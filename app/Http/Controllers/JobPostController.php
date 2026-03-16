<?php

namespace App\Http\Controllers;

use App\Mail\CreateJobPostMail;
use App\Mail\JobNotificationMail;
use App\Models\Alumni;
use App\Models\JobPost;
use App\Models\Program;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class JobPostController extends Controller
{
    public function index(Request $request)
    {
        $filters = $this->filters($request);
        $jobs = $this->query($filters)
            ->paginate($filters['per_page'])
            ->withQueryString()
            ->through(fn (JobPost $jobPost) => $this->payload($jobPost));

        return Inertia::render('job', [
            'jobs' => $jobs,
            'programs' => Program::query()->select('id', 'name')->orderBy('name')->get(),
            'filters' => $filters,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'company_name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'location_link' => 'nullable|string|max:255',
            'requirements' => 'nullable|string',
            'responsibilities' => 'nullable|string',
            'apply_link' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
            'posted_date' => 'nullable|date',
            'application_deadline' => 'nullable|date|after_or_equal:posted_date',
            'start_date' => 'nullable|date|after_or_equal:posted_date',
        ]);

        if (empty($validated['posted_date'])) {
            $validated['posted_date'] = now();
        }

        JobPost::query()->create($validated);

        return redirect()->back()
            ->with('success', 'Job post created successfully.');
    }

    public function update(Request $request, JobPost $jobPost)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'company_name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'location_link' => 'nullable|string|max:255',
            'requirements' => 'nullable|string',
            'responsibilities' => 'nullable|string',
            'apply_link' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
            'posted_date' => 'nullable|date',
            'application_deadline' => 'nullable|date|after_or_equal:posted_date',
            'start_date' => 'nullable|date|after_or_equal:posted_date',
        ]);

        $jobPost->update($validated);

        return redirect()->back()
            ->with('success', 'Job post updated successfully.');
    }

    public function destroy(JobPost $jobPost)
    {
        $jobPost->delete();

        return redirect()->back()
            ->with('success', 'Job post deleted successfully.');
    }

    public function sendEmail(Request $request)
    {
        $validated = $request->validate([
            'job_id' => 'required|integer|exists:job_posts,id',
            'program_id' => 'nullable|integer|exists:programs,id',
        ]);

        $job = JobPost::query()->findOrFail($validated['job_id']);

        if (! $job->isActive()) {
            return response()->json([
                'message' => 'Cannot send notifications for inactive or expired job posts.',
            ], 422);
        }

        $unemployedAlumni = Alumni::query()
            ->where('employment_status', 'Unemployed')
            ->when($validated['program_id'] ?? null, fn (Builder $query, $programId) => $query->where('program_id', $programId))
            ->get();

        if ($unemployedAlumni->isEmpty()) {
            return response()->json([
                'message' => 'No unemployed alumni found for the selected program.',
            ], 404);
        }

        foreach ($unemployedAlumni as $alumnus) {
            try {
                Mail::to($alumnus->email)->queue(new JobNotificationMail($job));
            } catch (\Exception $exception) {
                \Log::error('Mail failed: ' . $exception->getMessage());
            }
        }

        return response()->json(['message' => 'Emails sent successfully']);
    }

    public function sendEmailToAllEmployed()
    {
        $employedAlumni = Alumni::query()->where('employment_status', 'Employed')->get();

        if ($employedAlumni->isEmpty()) {
            return response()->json(['message' => 'No employed alumni found.'], 404);
        }

        foreach ($employedAlumni as $alumnus) {
            try {
                $formUrl = route('job-posts.index');
                Mail::to($alumnus->email)->send(new CreateJobPostMail($alumnus, $formUrl));
            } catch (\Exception $exception) {
                \Log::error('Mail failed: ' . $exception->getMessage());
            }
        }

        return response()->json(['message' => 'Emails sent to all employed alumni successfully.']);
    }

    public function getByDateRange(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'date_field' => 'nullable|in:posted_date,application_deadline,start_date',
        ]);

        $dateField = $validated['date_field'] ?? 'posted_date';
        $jobs = JobPost::query()
            ->whereBetween($dateField, [
                Carbon::parse($validated['start_date'])->startOfDay(),
                Carbon::parse($validated['end_date'])->endOfDay(),
            ])
            ->latest()
            ->get();

        return response()->json(['jobs' => $jobs]);
    }

    private function query(array $filters): Builder
    {
        return JobPost::query()
            ->latest()
            ->search($filters['search'])
            ->when($filters['start_date'] !== '' && $filters['end_date'] !== '', function (Builder $query) use ($filters) {
                $startDate = Carbon::parse($filters['start_date'])->startOfDay();
                $endDate = Carbon::parse($filters['end_date'])->endOfDay();
                $query->betweenDates($startDate, $endDate);
            })
            ->when(in_array($filters['status'], ['active', 'inactive'], true), fn (Builder $query) => $query->where('status', $filters['status']))
            ->when($filters['show_expired'], fn (Builder $query) => $query->expired())
            ->when($filters['show_active'], fn (Builder $query) => $query->active())
            ->when($filters['show_upcoming'], fn (Builder $query) => $query->upcoming());
    }

    private function filters(Request $request): array
    {
        $perPage = (int) $request->input('per_page', 10);

        if (! in_array($perPage, [10, 20, 50, 100], true)) {
            $perPage = 10;
        }

        return [
            'search' => trim((string) $request->input('search', '')),
            'per_page' => $perPage,
            'start_date' => (string) $request->input('start_date', ''),
            'end_date' => (string) $request->input('end_date', ''),
            'status' => (string) $request->input('status', ''),
            'show_expired' => $request->boolean('show_expired'),
            'show_active' => $request->boolean('show_active'),
            'show_upcoming' => $request->boolean('show_upcoming'),
        ];
    }

    private function payload(JobPost $jobPost): array
    {
        return [
            'id' => $jobPost->id,
            'title' => $jobPost->title,
            'description' => $jobPost->description,
            'company_name' => $jobPost->company_name,
            'location' => $jobPost->location,
            'location_link' => $jobPost->location_link,
            'requirements' => $jobPost->requirements,
            'responsibilities' => $jobPost->responsibilities,
            'apply_link' => $jobPost->apply_link,
            'status' => $jobPost->status,
            'posted_date' => optional($jobPost->posted_date)->format('Y-m-d'),
            'application_deadline' => optional($jobPost->application_deadline)->format('Y-m-d'),
            'start_date' => optional($jobPost->start_date)->format('Y-m-d'),
        ];
    }
}
