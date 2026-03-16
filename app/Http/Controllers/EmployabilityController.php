<?php

namespace App\Http\Controllers;

use App\Models\Alumni;
use App\Models\Program;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class EmployabilityController extends Controller
{
    public function index(Request $request)
    {
        $filters = $this->filters($request);
        $alumni = $this->query($filters)
            ->paginate($filters['per_page'])
            ->withQueryString()
            ->through(fn (Alumni $alumnus) => $this->payload($alumnus));

        return Inertia::render('Employability', [
            'alumni' => $alumni,
            'programs' => Program::query()->select('id', 'name')->orderBy('name')->get(),
            'filters' => $filters,
        ]);
    }

    public function export(Request $request)
    {
        $filters = $this->filters($request);
        $alumni = $this->query($filters)->get();

        if ($alumni->isEmpty()) {
            return response()->json([
                'message' => 'No employability records found for export.',
            ], 422);
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Employability');
        $sheet->fromArray([
            ['Program Name', 'Graduate Name', 'Status', 'Sex', 'Company / Business', 'Position / Work Nature'],
        ], null, 'A1');

        $rowIndex = 2;
        foreach ($alumni as $alumnus) {
            $sheet->fromArray([
                [
                    optional($alumnus->program)->name,
                    trim("{$alumnus->last_name}, {$alumnus->given_name} {$alumnus->middle_initial}"),
                    $alumnus->employment_status,
                    $alumnus->sex,
                    $alumnus->company_name,
                    $alumnus->work_position,
                ],
            ], null, 'A' . $rowIndex++);
        }

        foreach (range('A', 'F') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        ob_start();
        $writer->save('php://output');
        $output = ob_get_clean();

        return response($output)
            ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->header('Content-Disposition', 'attachment; filename="employability-report.xlsx"')
            ->header('Cache-Control', 'max-age=0');
    }

    private function query(array $filters): Builder
    {
        return Alumni::query()
            ->with('program:id,name')
            ->select(
                'id',
                'program_id',
                'last_name',
                'given_name',
                'middle_initial',
                'sex',
                'employment_status',
                'company_name',
                'work_position',
            )
            ->employabilityFilters($filters)
            ->orderByDesc('id');
    }

    private function filters(Request $request): array
    {
        $perPage = (int) $request->input('per_page', 10);

        if (! in_array($perPage, [10, 20, 50, 100], true)) {
            $perPage = 10;
        }

        return [
            'search' => trim((string) $request->input('search', '')),
            'program_id' => (string) $request->input('program_id', ''),
            'per_page' => $perPage,
        ];
    }

    private function payload(Alumni $alumnus): array
    {
        return [
            'id' => $alumnus->id,
            'program_id' => $alumnus->program_id,
            'last_name' => $alumnus->last_name,
            'given_name' => $alumnus->given_name,
            'middle_initial' => $alumnus->middle_initial,
            'sex' => $alumnus->sex,
            'employment_status' => $alumnus->employment_status,
            'company_name' => $alumnus->company_name,
            'work_position' => $alumnus->work_position,
            'program' => $alumnus->program ? [
                'id' => $alumnus->program->id,
                'name' => $alumnus->program->name,
            ] : null,
        ];
    }
}
