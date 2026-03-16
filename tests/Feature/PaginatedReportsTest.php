<?php

namespace Tests\Feature;

use App\Models\Alumni;
use App\Models\JobPost;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PaginatedReportsTest extends TestCase
{
    use RefreshDatabase;

    public function test_employability_index_returns_paginated_filtered_results(): void
    {
        $user = User::factory()->create();
        $programOne = Program::create(['name' => 'BSIT']);
        $programTwo = Program::create(['name' => 'BSCS']);

        foreach (range(1, 11) as $index) {
            Alumni::create([
                'student_number' => sprintf('2024%03d', $index),
                'email' => "ana{$index}@example.com",
                'program_id' => $programOne->id,
                'last_name' => 'Santos',
                'given_name' => 'Ana ' . $index,
                'present_address' => 'Lubao',
                'contact_number' => '0917000' . str_pad((string) $index, 4, '0', STR_PAD_LEFT),
                'graduation_year' => 2024,
                'employment_status' => 'Employed',
                'company_name' => 'Acme',
                'work_position' => 'Developer',
                'consent' => true,
            ]);
        }

        Alumni::create([
            'student_number' => '2024999',
            'email' => 'ben@example.com',
            'program_id' => $programTwo->id,
            'last_name' => 'Rivera',
            'given_name' => 'Ben',
            'present_address' => 'Lubao',
            'contact_number' => '09170000002',
            'graduation_year' => 2024,
            'employment_status' => 'Unemployed',
            'consent' => true,
        ]);

        $response = $this->actingAs($user)->get('/employability?search=Acme&program_id=' . $programOne->id . '&per_page=10');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employability')
            ->where('filters.search', 'Acme')
            ->where('filters.program_id', (string) $programOne->id)
            ->where('filters.per_page', 10)
            ->where('alumni.total', 11)
            ->has('alumni.data', 10));
    }

    public function test_students_index_and_export_are_paginated(): void
    {
        $user = User::factory()->create();

        foreach (range(1, 11) as $index) {
            Student::create([
                'student_number' => '2024' . str_pad((string) $index, 6, '0', STR_PAD_LEFT),
                'student_name' => 'Alpha Student ' . $index,
                'email' => "alpha{$index}@example.com",
                'year' => 2024,
            ]);
        }

        Student::create([
            'student_number' => '2024999999',
            'student_name' => 'Beta Student',
            'email' => 'beta@example.com',
            'year' => 2023,
        ]);

        $response = $this->actingAs($user)->get('/students?search=Alpha&per_page=10&sort=student_name&direction=asc');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Students/Index')
            ->where('filters.search', 'Alpha')
            ->where('filters.per_page', 10)
            ->where('filters.sort', 'student_name')
            ->where('filters.direction', 'asc')
            ->where('students.total', 11)
            ->has('students.data', 10));

        $exportResponse = $this->actingAs($user)->post('/students/export', [
            'search' => 'Student',
        ]);

        $exportResponse->assertOk();
        $exportResponse->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_alumni_json_endpoint_returns_paginated_filtered_results(): void
    {
        $user = User::factory()->create();
        $program = Program::create(['name' => 'BSIT']);

        foreach (range(1, 11) as $index) {
            Alumni::create([
                'student_number' => '2023' . str_pad((string) $index, 3, '0', STR_PAD_LEFT),
                'email' => "first{$index}@example.com",
                'program_id' => $program->id,
                'last_name' => 'First',
                'given_name' => 'Alumni ' . $index,
                'present_address' => 'Lubao',
                'contact_number' => '09170001' . str_pad((string) $index, 3, '0', STR_PAD_LEFT),
                'graduation_year' => 2023,
                'employment_status' => 'Employed',
                'work_location' => 'local',
                'sex' => 'Male',
                'consent' => true,
            ]);
        }

        Alumni::create([
            'student_number' => '2023999',
            'email' => 'second@example.com',
            'program_id' => $program->id,
            'last_name' => 'Second',
            'given_name' => 'Alumni',
            'present_address' => 'Lubao',
            'contact_number' => '09170001002',
            'graduation_year' => 2024,
            'employment_status' => 'Unemployed',
            'work_location' => 'abroad',
            'sex' => 'Female',
            'consent' => true,
        ]);

        $response = $this->actingAs($user)->getJson('/alumni-data?employment_status=Employed&per_page=10');

        $response->assertOk();
        $response->assertJsonPath('total', 11);
        $response->assertJsonPath('per_page', 10);
        $response->assertJsonCount(10, 'data');
    }

    public function test_job_post_index_returns_paginated_filtered_results(): void
    {
        $user = User::factory()->create();

        foreach (range(1, 11) as $index) {
            JobPost::create([
                'title' => 'Backend Engineer ' . $index,
                'description' => 'API work',
                'company_name' => 'Acme',
                'status' => 'active',
                'posted_date' => now(),
                'application_deadline' => now()->addDays(10),
            ]);
        }

        JobPost::create([
            'title' => 'Graphic Designer',
            'description' => 'Creative work',
            'company_name' => 'Studio',
            'status' => 'inactive',
            'posted_date' => now(),
            'application_deadline' => now()->addDays(5),
        ]);

        $response = $this->actingAs($user)->get('/jobpost?search=Engineer&per_page=10');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('job')
            ->where('filters.search', 'Engineer')
            ->where('filters.per_page', 10)
            ->where('jobs.total', 11)
            ->has('jobs.data', 10));
    }

    public function test_employability_export_returns_excel_response(): void
    {
        $user = User::factory()->create();
        $program = Program::create(['name' => 'BSIT']);

        Alumni::create([
            'student_number' => '2025001',
            'email' => 'export@example.com',
            'program_id' => $program->id,
            'last_name' => 'Export',
            'given_name' => 'Case',
            'present_address' => 'Lubao',
            'contact_number' => '09170002001',
            'graduation_year' => 2025,
            'employment_status' => 'Employed',
            'company_name' => 'Acme Export',
            'consent' => true,
        ]);

        $response = $this->actingAs($user)->post('/employability/export', [
            'search' => 'Acme Export',
        ]);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
}
