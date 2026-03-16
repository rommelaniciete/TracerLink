<?php

namespace App\Http\Controllers;

use App\Events\AlumniCreated;
use App\Exports\AlumniTemplateExport;
use App\Models\Alumni;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class AlumniController extends Controller
{
    public function dashboard()
    {
        $alumniPerYear = Alumni::query()
            ->selectRaw('graduation_year as year, COUNT(*) as total')
            ->groupBy('graduation_year')
            ->orderBy('graduation_year')
            ->get();

        return inertia('dashboard', [
            'alumniPerYear' => $alumniPerYear,
        ]);
    }

    public function index(Request $request)
    {
        $filters = $this->filters($request);
        $alumni = $this->query($filters)
            ->paginate($filters['per_page'])
            ->withQueryString()
            ->through(fn (Alumni $alumnus) => $this->payload($alumnus));

        return response()->json($alumni);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'student_number' => 'required|string|unique:alumni,student_number',
                'email' => 'required|email',
                'program_id' => 'required|exists:programs,id',
                'last_name' => 'required|string',
                'given_name' => 'required|string',
                'middle_initial' => 'nullable|string',
                'present_address' => 'required|string',
                'contact_number' => 'required|string',
                'graduation_year' => 'required|digits:4',
                'sex' => ['required', Rule::in(['Male', 'Female'])],
                'employment_status' => 'required|string',
                'company_name' => 'nullable|string|max:255',
                'work_position' => 'nullable|string|max:255',
                'further_studies' => 'nullable|string',
                'sector' => 'nullable|string',
                'work_location' => 'nullable|string',
                'employer_classification' => 'nullable|string',
                'related_to_course' => ['nullable', Rule::in(['yes', 'no', 'unsure'])],
                'instruction_rating' => 'nullable|numeric|min:0|max:5',
                'consent' => 'accepted',
            ]);

            if (strtolower((string) $validated['employment_status']) !== 'employed') {
                $validated['company_name'] = null;
                $validated['work_position'] = null;
                $validated['sector'] = null;
                $validated['work_location'] = null;
                $validated['employer_classification'] = null;
                $validated['related_to_course'] = null;
            }

            $alumni = Alumni::query()->create($validated);
            broadcast(new AlumniCreated($alumni))->toOthers();

            Log::info('Alumni created and broadcasted', ['alumni_id' => $alumni->id]);

            return response()->json([
                'message' => 'Alumni added successfully!',
                'data' => $this->payload($alumni->load('program')),
            ], 201);
        } catch (ValidationException $exception) {
            return response()->json([
                'errors' => $exception->errors(),
                'message' => 'Validation failed.',
            ], 422);
        } catch (\Exception $exception) {
            Log::error('Error creating alumni: ' . $exception->getMessage());

            return response()->json([
                'message' => 'Server error occurred.',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $alumni = Alumni::query()->findOrFail($id);

            $validated = $request->validate([
                'student_number' => [
                    'required',
                    'string',
                    Rule::unique('alumni', 'student_number')->ignore($alumni->id),
                ],
                'email' => 'required|email',
                'program_id' => 'required|exists:programs,id',
                'last_name' => 'required|string',
                'given_name' => 'required|string',
                'middle_initial' => 'nullable|string',
                'present_address' => 'required|string',
                'contact_number' => 'required|string',
                'graduation_year' => 'required|digits:4',
                'sex' => ['required', Rule::in(['Male', 'Female'])],
                'employment_status' => 'required|string',
                'company_name' => 'nullable|string|max:255',
                'work_position' => 'nullable|string|max:255',
                'further_studies' => 'nullable|string',
                'sector' => 'nullable|string',
                'work_location' => 'nullable|string',
                'employer_classification' => 'nullable|string',
                'related_to_course' => ['nullable', Rule::in(['yes', 'no', 'unsure'])],
                'instruction_rating' => 'nullable|numeric|min:0|max:5',
                'consent' => 'accepted',
            ]);

            if (strtolower((string) $validated['employment_status']) !== 'employed') {
                $validated['company_name'] = null;
                $validated['work_position'] = null;
                $validated['sector'] = null;
                $validated['work_location'] = null;
                $validated['employer_classification'] = null;
                $validated['related_to_course'] = null;
            }

            $alumni->update($validated);

            return response()->json([
                'message' => 'Alumni updated successfully!',
                'data' => $this->payload($alumni->load('program')),
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'errors' => $exception->errors(),
                'message' => 'Validation failed.',
            ], 422);
        } catch (\Exception $exception) {
            return response()->json([
                'message' => 'Server error occurred.',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $alumni = Alumni::query()->find($id);

        if (! $alumni) {
            return response()->json(['message' => 'Alumni not found.'], 404);
        }

        $alumni->delete();

        return response()->json(['message' => 'Alumni deleted successfully.']);
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:alumni,id'],
        ]);

        $deleted = Alumni::query()->whereIn('id', $validated['ids'])->delete();

        return response()->json([
            'message' => 'Alumni deleted successfully.',
            'deleted' => $deleted,
        ]);
    }

    public function downloadTemplate()
    {
        return Excel::download(new AlumniTemplateExport, 'alumni_template.xlsx');
    }

    private function query(array $filters): Builder
    {
        return Alumni::query()
            ->with('program:id,name')
            ->managementFilters($filters)
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
            'graduation_year' => (string) $request->input('graduation_year', ''),
            'program_id' => (string) $request->input('program_id', ''),
            'employment_status' => (string) $request->input('employment_status', ''),
            'work_location' => (string) $request->input('work_location', ''),
            'sex' => (string) $request->input('sex', ''),
            'per_page' => $perPage,
        ];
    }

    private function payload(Alumni $alumnus): array
    {
        return [
            'id' => $alumnus->id,
            'student_number' => $alumnus->student_number,
            'email' => $alumnus->email,
            'program_id' => $alumnus->program_id,
            'program' => $alumnus->program ? [
                'id' => $alumnus->program->id,
                'name' => $alumnus->program->name,
            ] : null,
            'last_name' => $alumnus->last_name,
            'given_name' => $alumnus->given_name,
            'middle_initial' => $alumnus->middle_initial,
            'present_address' => $alumnus->present_address,
            'contact_number' => $alumnus->contact_number,
            'graduation_year' => (int) $alumnus->graduation_year,
            'sex' => $alumnus->sex,
            'employment_status' => $alumnus->employment_status,
            'company_name' => $alumnus->company_name,
            'work_position' => $alumnus->work_position,
            'further_studies' => $alumnus->further_studies,
            'sector' => $alumnus->sector,
            'work_location' => $alumnus->work_location,
            'employer_classification' => $alumnus->employer_classification,
            'related_to_course' => $alumnus->related_to_course,
            'instruction_rating' => $alumnus->instruction_rating,
            'consent' => (bool) $alumnus->consent,
        ];
    }
}
