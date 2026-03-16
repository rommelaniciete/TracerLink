<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $filters = $this->studentFilters($request);
        $students = $this->studentQuery($filters)
            ->paginate($filters['per_page'])
            ->withQueryString()
            ->through(fn (Student $student) => $this->studentPayload($student));

        return Inertia::render('Students/Index', [
            'students' => $students,
            'years' => Student::availableYears()->values(),
            'filters' => $filters,
        ]);
    }

    public function getAllStudents(Request $request)
    {
        return $this->studentQuery($this->studentFilters($request))->get()->map(
            fn (Student $student) => $this->studentPayload($student)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_number' => 'required|string|unique:students',
            'student_name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:students',
            'year' => 'required|integer|min:2022|max:' . date('Y'),
        ]);

        $student = Student::create($validated);

        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json($this->studentPayload($student), 201);
        }

        return redirect()->route('students.index')->with('success', 'Student added!');
    }

    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'student_number' => 'required|string|unique:students,student_number,' . $student->id,
            'student_name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:students,email,' . $student->id,
            'year' => 'required|integer|min:2022|max:' . date('Y'),
        ]);

        $student->update($validated);
        $student->refresh();

        return response()->json($this->studentPayload($student));
    }

    public function destroy(Student $student)
    {
        $student->delete();

        return response()->json(['success' => true, 'message' => 'Student deleted successfully.']);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
        ]);

        $file = $request->file('file');
        $spreadsheet = IOFactory::load($file->getPathname());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray();

        array_shift($rows);

        $inserted = 0;
        $skipped = 0;

        foreach ($rows as $row) {
            $studentNumber = trim((string) ($row[0] ?? ''));
            $studentName = trim((string) ($row[1] ?? ''));
            $email = trim((string) ($row[2] ?? ''));
            $year = trim((string) ($row[3] ?? ''));

            if ($studentNumber === '' || $studentName === '' || $year === '' || ! is_numeric($year)) {
                $skipped++;
                continue;
            }

            $year = (int) $year;
            $currentYear = (int) date('Y');

            if ($year < 2022 || $year > $currentYear) {
                $skipped++;
                continue;
            }

            $hasDuplicateStudentNumber = Student::query()->where('student_number', $studentNumber)->exists();
            $hasDuplicateEmail = $email !== '' && Student::query()->where('email', $email)->exists();

            if ($hasDuplicateStudentNumber || $hasDuplicateEmail) {
                $skipped++;
                continue;
            }

            Student::create([
                'student_number' => $studentNumber,
                'student_name' => $studentName,
                'email' => $email !== '' ? $email : null,
                'year' => $year,
            ]);

            $inserted++;
        }

        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'message' => "{$inserted} students imported successfully!",
                'imported' => $inserted,
                'skipped' => $skipped,
            ]);
        }

        return redirect()->route('students.index')
            ->with('success', "{$inserted} students imported successfully!");
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:students,id'],
        ]);

        $deleted = Student::query()->whereIn('id', $validated['ids'])->delete();

        return response()->json([
            'message' => 'Students deleted successfully',
            'deleted' => $deleted,
        ]);
    }

    public function export(Request $request)
    {
        $filters = $this->studentFilters($request);
        $students = $this->studentQuery($filters)->get();

        if ($students->isEmpty()) {
            return response()->json([
                'message' => 'No students found for export.',
            ], 422);
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Students');

        $sheet->fromArray([
            ['Student Number', 'Student Name', 'Email', 'Year'],
        ], null, 'A1');

        $rowIndex = 2;
        foreach ($students as $student) {
            $sheet->fromArray([
                [
                    $student->student_number,
                    $student->student_name,
                    $student->email,
                    $student->year,
                ],
            ], null, 'A' . $rowIndex++);
        }

        foreach (range('A', 'D') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        ob_start();
        $writer->save('php://output');
        $output = ob_get_clean();

        return response($output)
            ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->header('Content-Disposition', 'attachment; filename="students.xlsx"')
            ->header('Cache-Control', 'max-age=0');
    }

    private function studentQuery(array $filters): Builder
    {
        return Student::query()
            ->select('id', 'student_number', 'student_name', 'email', 'year')
            ->search($filters['search'])
            ->year($filters['year'])
            ->sorted($filters['sort'], $filters['direction']);
    }

    private function studentFilters(Request $request): array
    {
        return [
            'search' => trim((string) $request->input('search', '')),
            'year' => (string) $request->input('year', ''),
            'per_page' => $this->resolvePerPage($request),
            'sort' => (string) $request->input('sort', 'id'),
            'direction' => $request->input('direction') === 'asc' ? 'asc' : 'desc',
        ];
    }

    private function resolvePerPage(Request $request): int
    {
        $perPage = (int) $request->input('per_page', 10);

        if (! in_array($perPage, [10, 20, 50, 100], true)) {
            return 10;
        }

        return $perPage;
    }

    private function studentPayload(Student $student): array
    {
        return [
            'id' => $student->id,
            'student_number' => $student->student_number,
            'student_name' => $student->student_name,
            'email' => $student->email,
            'year' => (int) $student->year,
        ];
    }
}
