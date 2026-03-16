<?php

namespace App\Http\Controllers;

use App\Jobs\SendAlumniFormEmail;
use App\Models\Alumni;
use App\Models\Student;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SendController extends Controller
{
    public function index(Request $request)
    {
        $filters = $this->studentFilters($request);
        $students = $this->studentQuery($filters)
            ->paginate($filters['per_page'])
            ->withQueryString()
            ->through(fn (Student $student) => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'student_name' => $student->student_name,
                'email' => $student->email,
                'year' => (int) $student->year,
            ]);

        return Inertia::render('send', [
            'students' => $students,
            'years' => Student::availableYears()->values(),
            'filters' => $filters,
        ]);
    }

    public function sendEmail(Request $request)
    {
        $request->validate([
            'emails' => 'required|array|min:1',
            'emails.*' => 'required|email',
        ]);

        $emails = $request->emails;
        $queued = [];
        $failed = [];

        foreach ($emails as $email) {
            $student = Student::query()->where('email', $email)->first();

            if (! $student) {
                $failed[] = $email;
                continue;
            }

            try {
                SendAlumniFormEmail::dispatch($student);
                $queued[] = $email;
            } catch (\Exception $exception) {
                Log::error("Failed to queue {$student->email}: " . $exception->getMessage());
                $failed[] = $email;
            }
        }

        return response()->json([
            'message' => count($queued) . ' Email have been sent successfully!',
            'queued' => $queued,
            'failed' => $failed,
        ]);
    }

    public function sendToProgram(Request $request)
    {
        $request->validate([
            'program' => 'required|string',
        ]);

        $alumniList = Alumni::query()
            ->where('program', $request->program)
            ->whereNotNull('email')
            ->where('email', '!=', '')
            ->where('consent', true)
            ->get();

        $queued = [];
        $failed = [];

        foreach ($alumniList as $alum) {
            try {
                SendAlumniFormEmail::dispatch($alum);

                $alum->update([
                    'email_status' => 'queued',
                ]);

                $queued[] = $alum->email;
            } catch (\Exception $exception) {
                Log::error("Failed to queue {$alum->email}: " . $exception->getMessage());

                $alum->update([
                    'email_status' => 'failed',
                ]);

                $failed[] = $alum->email;
            }
        }

        return response()->json([
            'message' => 'Alumni emails have been queued by program.',
            'queued' => $queued,
            'failed' => $failed,
        ]);
    }

    public function updateAlumniForm(Request $request)
    {
        $validated = $request->validate([
            'student_number' => ['required', 'string'],
            'email' => ['required', 'email'],
            'name' => ['required', 'string'],
            'program' => ['required', 'string'],
        ]);

        $alumni = Alumni::query()->where('student_number', $validated['student_number'])->first();

        if (! $alumni) {
            return response()->json([
                'message' => 'Student not found.',
            ], 404);
        }

        $alumni->update($validated);

        return response()->json([
            'message' => 'Alumni record updated successfully.',
        ]);
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
        $perPage = (int) $request->input('per_page', 10);

        if (! in_array($perPage, [10, 20, 50, 100], true)) {
            $perPage = 10;
        }

        return [
            'search' => trim((string) $request->input('search', '')),
            'year' => (string) $request->input('year', ''),
            'per_page' => $perPage,
            'sort' => (string) $request->input('sort', 'id'),
            'direction' => $request->input('direction') === 'asc' ? 'asc' : 'desc',
        ];
    }
}
