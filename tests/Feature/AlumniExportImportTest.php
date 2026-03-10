<?php

namespace Tests\Feature;

use App\Models\Alumni;
use App\Models\Program;
use App\Models\User;
use App\Services\AlumniImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class AlumniExportImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create programs
        Program::create(['id' => 1, 'name' => 'BS Information Technology']);
        Program::create(['id' => 2, 'name' => 'BS Computer Science']);
    }

    /**
     * Test alumni export with selected IDs
     */
    public function test_alumni_export_with_selected_ids()
    {
        // Create test alumni
        $alumni1 = Alumni::create([
            'student_number' => '2023001',
            'email' => 'john@example.com',
            'program_id' => 1,
            'last_name' => 'Doe',
            'given_name' => 'John',
            'present_address' => 'Lubao, Pampanga',
            'contact_number' => '09123456789',
            'graduation_year' => 2023,
            'employment_status' => 'Employed',
            'work_location' => 'Local',
            'sector' => 'IT',
            'employer_classification' => 'Private',
        ]);

        $response = $this->postJson('/export-alumni', [
            'selectedIds' => [$alumni1->id],
        ]);

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    /**
     * Test alumni export without any selected IDs
     */
    public function test_alumni_export_without_selected_ids_exports_empty()
    {
        $response = $this->postJson('/export-alumni', [
            'selectedIds' => [],
        ]);

        $response->assertStatus(400);
    }

    /**
     * Test alumni import with valid Excel file
     */
    public function test_alumni_import_with_valid_data()
    {
        $user = User::factory()->create();
        $file = $this->createAlumniImportFile([
            [
                '2024001',
                'alice@example.com',
                'BS Information Technology',
                'Dela Cruz',
                'Alice',
                'A',
                'MAlE',
                'San Nicolas, Lubao',
                '09171234567',
                '2024',
                'Employed',
                'Sample Company',
                'No',
                'Private',
                'Manila',
                'Private',
                'YeS',
                'Yes',
                '5',
            ],
        ]);

        $response = $this->actingAs($user)->post('/alumni/import', [
            'file' => $file,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('imported', 1);
        $response->assertJsonPath('skipped', 0);
        $response->assertJsonPath('total_rows', 1);
        $this->assertDatabaseHas('alumni', [
            'student_number' => '2024001',
            'email' => 'alice@example.com',
            'sex' => 'male',
            'related_to_course' => 'yes',
        ]);
    }

    public function test_alumni_import_skips_invalid_values_and_returns_errors()
    {
        $user = User::factory()->create();
        $file = $this->createAlumniImportFile([
            [
                '2024002',
                'bob@example.com',
                'BS Information Technology',
                'Dela Cruz',
                'Bob',
                'A',
                'Unknown',
                'San Nicolas, Lubao',
                '09171234568',
                '2024',
                'Employed',
                'Sample Company',
                'No',
                'Private',
                'Manila',
                'Private',
                'Maybe',
                'Maybe',
                '5',
            ],
        ]);

        $response = $this->actingAs($user)->post('/alumni/import', [
            'file' => $file,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('imported', 0);
        $response->assertJsonPath('skipped', 1);
        $response->assertJsonPath('total_rows', 1);
        $this->assertEquals(1, count($response->json('errors')));
        $response->assertJsonPath('errors.0.row', 4);
        $response->assertStringContainsString('Sex', $response->json('errors.0.reason'));
        $this->assertDatabaseMissing('alumni', ['student_number' => '2024002']);
    }

    public function test_alumni_import_supports_partial_success()
    {
        $user = User::factory()->create();
        $file = $this->createAlumniImportFile([
            [
                '2024003',
                'charlie@example.com',
                'BS Information Technology',
                'Dela Cruz',
                'Charlie',
                'A',
                'Female',
                'San Nicolas, Lubao',
                '09171234569',
                '2024',
                'Employed',
                'Sample Company',
                'No',
                'Private',
                'Manila',
                'Private',
                'Yes',
                'Yes',
                '5',
            ],
            [
                '2024004',
                '',
                'BS Information Technology',
                'Dela Cruz',
                'Missing Email',
                'A',
                'Male',
                'San Nicolas, Lubao',
                '09171234570',
                '2024',
                'Employed',
                'Sample Company',
                'No',
                'Private',
                'Manila',
                'Private',
                'Yes',
                'Yes',
                '5',
            ],
            [
                '2024005',
                'david@example.com',
                'BS Information Technology',
                'Dela Cruz',
                'David',
                'A',
                'Male',
                'San Nicolas, Lubao',
                '09171234571',
                '2024',
                'Employed',
                'Sample Company',
                'No',
                'Private',
                'Manila',
                'Private',
                'Maybe',
                'Yes',
                '5',
            ],
        ]);

        $response = $this->actingAs($user)->post('/alumni/import', [
            'file' => $file,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('imported', 1);
        $response->assertJsonPath('skipped', 2);
        $response->assertJsonPath('total_rows', 3);
        $this->assertDatabaseHas('alumni', ['student_number' => '2024003']);
        $this->assertDatabaseMissing('alumni', ['student_number' => '2024004']);
        $this->assertDatabaseMissing('alumni', ['student_number' => '2024005']);
    }

    public function test_alumni_import_with_missing_required_columns_is_skipped()
    {
        $user = User::factory()->create();
        $file = $this->createAlumniImportFile([
            [
                '',
                'eve@example.com',
                'BS Information Technology',
                '',
                '',
                'A',
                'Female',
                'San Nicolas, Lubao',
                '09171234572',
                '2024',
                'Employed',
                'Sample Company',
                'No',
                'Private',
                'Manila',
                'Private',
                'Yes',
                'Yes',
                '5',
            ],
        ]);

        $response = $this->actingAs($user)->post('/alumni/import', [
            'file' => $file,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('imported', 0);
        $response->assertJsonPath('total_rows', 1);
        $this->assertEquals(1, count($response->json('errors')));
        $response->assertStringContainsString('Student Number is required.', $response->json('errors.0.reason'));
    }

    /**
     * Test alumni import validation - missing required file
     */
    public function test_alumni_import_requires_file()
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->postJson('/alumni/import', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('file');
    }

    /**
     * Test alumni import with invalid file type
     */
    public function test_alumni_import_rejects_invalid_file_type()
    {
        $user = User::factory()->create();
        $file = \Illuminate\Http\UploadedFile::fake()->create('alumni.pdf');

        $response = $this->actingAs($user)->postJson('/alumni/import', [
            'file' => $file,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('file');
    }

    /**
     * Test filtering alumni by employment status
     */
    public function test_filter_alumni_by_employment_status()
    {
        Alumni::create([
            'student_number' => '2023001',
            'email' => 'employed@example.com',
            'program_id' => 1,
            'last_name' => 'Employed',
            'given_name' => 'Person',
            'present_address' => 'Lubao',
            'contact_number' => '09123456789',
            'graduation_year' => 2023,
            'employment_status' => 'Employed',
            'work_location' => 'Local',
            'sector' => 'IT',
            'employer_classification' => 'Private',
        ]);

        Alumni::create([
            'student_number' => '2023002',
            'email' => 'unemployed@example.com',
            'program_id' => 1,
            'last_name' => 'Unemployed',
            'given_name' => 'Person',
            'present_address' => 'Lubao',
            'contact_number' => '09123456789',
            'graduation_year' => 2023,
            'employment_status' => 'Unemployed',
            'work_location' => 'Local',
            'sector' => '',
            'employer_classification' => '',
        ]);

        // Verify both exist
        $this->assertCount(2, Alumni::all());
        $this->assertCount(1, Alumni::where('employment_status', 'Employed')->get());
        $this->assertCount(1, Alumni::where('employment_status', 'Unemployed')->get());
    }

    /**
     * Test filtering alumni by sex
     */
    public function test_filter_alumni_by_sex()
    {
        Alumni::create([
            'student_number' => '2023001',
            'email' => 'male@example.com',
            'program_id' => 1,
            'last_name' => 'Male',
            'given_name' => 'Person',
            'present_address' => 'Lubao',
            'contact_number' => '09123456789',
            'graduation_year' => 2023,
            'sex' => 'Male',
            'employment_status' => 'Employed',
            'work_location' => 'Local',
            'sector' => 'IT',
            'employer_classification' => 'Private',
        ]);

        Alumni::create([
            'student_number' => '2023002',
            'email' => 'female@example.com',
            'program_id' => 1,
            'last_name' => 'Female',
            'given_name' => 'Person',
            'present_address' => 'Lubao',
            'contact_number' => '09123456789',
            'graduation_year' => 2023,
            'sex' => 'Female',
            'employment_status' => 'Employed',
            'work_location' => 'Local',
            'sector' => 'IT',
            'employer_classification' => 'Private',
        ]);

        $this->assertCount(1, Alumni::where('sex', 'Male')->get());
        $this->assertCount(1, Alumni::where('sex', 'Female')->get());
    }

    /**
     * Test filtering alumni by graduation year
     */
    public function test_filter_alumni_by_graduation_year()
    {
        Alumni::create([
            'student_number' => '2023001',
            'email' => 'grad2023@example.com',
            'program_id' => 1,
            'last_name' => 'Doe',
            'given_name' => 'John',
            'present_address' => 'Lubao',
            'contact_number' => '09123456789',
            'graduation_year' => 2023,
            'employment_status' => 'Employed',
            'work_location' => 'Local',
            'sector' => 'IT',
            'employer_classification' => 'Private',
        ]);

        Alumni::create([
            'student_number' => '2022001',
            'email' => 'grad2022@example.com',
            'program_id' => 1,
            'last_name' => 'Smith',
            'given_name' => 'Jane',
            'present_address' => 'Lubao',
            'contact_number' => '09123456789',
            'graduation_year' => 2022,
            'employment_status' => 'Employed',
            'work_location' => 'Local',
            'sector' => 'IT',
            'employer_classification' => 'Private',
        ]);

        $this->assertCount(1, Alumni::where('graduation_year', 2023)->get());
        $this->assertCount(1, Alumni::where('graduation_year', 2022)->get());
    }

    /**
     * Test bulk delete alumni
     */
    public function test_bulk_delete_alumni()
    {
        $alumni1 = Alumni::create([
            'student_number' => '2023001',
            'email' => 'alumni1@example.com',
            'program_id' => 1,
            'last_name' => 'First',
            'given_name' => 'Alumni',
            'present_address' => 'Lubao',
            'contact_number' => '09123456789',
            'graduation_year' => 2023,
            'employment_status' => 'Employed',
            'work_location' => 'Local',
            'sector' => 'IT',
            'employer_classification' => 'Private',
        ]);

        $alumni2 = Alumni::create([
            'student_number' => '2023002',
            'email' => 'alumni2@example.com',
            'program_id' => 1,
            'last_name' => 'Second',
            'given_name' => 'Alumni',
            'present_address' => 'Lubao',
            'contact_number' => '09123456789',
            'graduation_year' => 2023,
            'employment_status' => 'Unemployed',
            'work_location' => 'Local',
            'sector' => '',
            'employer_classification' => '',
        ]);

        $this->assertCount(2, Alumni::all());

        // Delete alumni1
        $response = $this->deleteJson("/alumni/{$alumni1->id}");
        $response->assertStatus(200);

        $this->assertCount(1, Alumni::all());
        $this->assertTrue(Alumni::where('student_number', '2023002')->exists());
    }

    /**
     * Test alumni creation with all required fields
     */
    public function test_create_alumni_with_required_fields()
    {
        $alumniData = [
            'student_number' => '2024001',
            'email' => 'new@example.com',
            'program_id' => 1,
            'last_name' => 'New',
            'given_name' => 'Alumni',
            'present_address' => 'Lubao, Pampanga',
            'contact_number' => '09123456789',
            'graduation_year' => 2024,
            'employment_status' => 'Employed',
            'work_location' => 'Local',
            'sector' => 'Technology',
            'employer_classification' => 'Private',
        ];

        $alumni = Alumni::create($alumniData);

        $this->assertDatabaseHas('alumni', [
            'student_number' => '2024001',
            'email' => 'new@example.com',
        ]);
    }

    /**
     * Helper: Create a valid alumni import file
     */
    protected function createValidAlumniFile()
    {
        return $this->createAlumniImportFile([[
            '2024001',
            'alice@example.com',
            'BS Information Technology',
            'Dela Cruz',
            'Alice',
            'A',
            'Male',
            'San Nicolas, Lubao',
            '09171234567',
            '2024',
            'Employed',
            'Sample Company',
            'No',
            'Private',
            'Manila',
            'Private',
            'Yes',
            'Yes',
            '5',
        ]]);
    }

    protected function createAlumniImportFile(array $rows, bool $includeMetadataRows = true): UploadedFile
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $rowNumber = 1;
        if ($includeMetadataRows) {
            $sheet->setCellValue("A{$rowNumber}", 'Pampanga State University');
            $rowNumber++;
            $sheet->setCellValue("A{$rowNumber}", 'Lubao, Campus');
            $rowNumber++;
        }

        $sheet->fromArray([AlumniImportService::getHeaders()], null, "A{$rowNumber}");
        $rowNumber++;

        if (!empty($rows)) {
            $sheet->fromArray($rows, null, "A{$rowNumber}");
        }

        $tempPath = tempnam(sys_get_temp_dir(), 'alumni_import_') . '.xlsx';
        (new Xlsx($spreadsheet))->save($tempPath);

        return new UploadedFile($tempPath, 'alumni_import.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
    }
}

