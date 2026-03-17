<?php

namespace App\Services;

use App\Models\Alumni;
use App\Models\Program;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Maatwebsite\Excel\Facades\Excel;

class AlumniImportService
{
    public function __construct(
        private readonly ImportProgressService $importProgress,
    ) {
    }

    protected const HEADERS = [
        'Student Number',
        'Email',
        'Program',
        'Last Name',
        'Given Name',
        'M.I',
        'Sex',
        'Present Address',
        'Contact No.',
        'Batch Year',
        'Employment Status',
        'Company Name',
        'Further Studies',
        'Sector',
        'Work Location',
        'Employer Classification',
        'Related To Course',
        'Consent',
        'Instruction Rating'
    ];

    protected const HEADER_ALIASES = [
        'student_number' => ['student number', 'studentnumber', 'student id'],
        'email' => ['email'],
        'program' => ['program'],
        'last_name' => ['last name', 'lastname', 'last'],
        'given_name' => ['given name', 'givenname', 'first name', 'first'],
        'middle_initial' => ['m.i', 'middle initial', 'middleinitial', 'middle'],
        'sex' => ['sex'],
        'present_address' => ['present address', 'presentaddress', 'address'],
        'contact_number' => ['contact number', 'contact no', 'contact no.', 'contact', 'phone'],
        'graduation_year' => ['batch year', 'graduation year', 'graduationyear', 'year'],
        'employment_status' => ['employment status', 'employmentstatus', 'status'],
        'company_name' => ['company name', 'company'],
        'work_position' => ['work position', 'workposition', 'position'],
        'further_studies' => ['further studies', 'furtherstudies'],
        'sector' => ['sector'],
        'work_location' => ['work location', 'worklocation'],
        'employer_classification' => ['employer classification', 'employerclassification', 'classification'],
        'related_to_course' => ['related to course', 'related_to_course', 'related'],
        'consent' => ['consent', 'consent given'],
        'instruction_rating' => ['instruction rating', 'instructionrating', 'rating'],
    ];

    protected const FALLBACK_COLUMN_INDEX = [
        'student_number' => 0,
        'email' => 1,
        'program' => 2,
        'last_name' => 3,
        'given_name' => 4,
        'middle_initial' => 5,
        'sex' => 6,
        'present_address' => 7,
        'contact_number' => 8,
        'graduation_year' => 9,
        'employment_status' => 10,
        'company_name' => 11,
        'work_position' => null,
        'further_studies' => 12,
        'sector' => 13,
        'work_location' => 14,
        'employer_classification' => 15,
        'related_to_course' => 16,
        'consent' => 17,
        'instruction_rating' => 18,
    ];

    /**
     * Import alumni from uploaded Excel file
     */
    public function import($file, ?string $importId = null): array
    {
        try {
            $data = Excel::toArray([], $file);

            if (empty($data[0])) {
                throw new InvalidArgumentException('The uploaded file is empty.');
            }

            $rows = $data[0];
            $headerIndexes = null;

            $totalRows = $this->countImportableRows($rows);

            if ($totalRows === 0) {
                throw new InvalidArgumentException('No alumni rows were found in the uploaded file.');
            }

            if ($importId !== null) {
                $this->importProgress->startProcessing($importId, $totalRows);
            }

            $imported = 0;
            $skipped = 0;
            $errors = [];
            $processedRows = 0;

            foreach ($rows as $index => $row) {
                try {
                    if ($headerIndexes === null && $this->isHeaderRow($row)) {
                        $headerIndexes = $this->buildHeaderIndexes($row);
                        continue;
                    }

                    if ($this->isSkippableRow($row)) {
                        continue;
                    }

                    $prepared = $this->prepareRow($row, $headerIndexes);
                    $this->importRow($prepared);
                    $imported++;
                    $processedRows++;
                    $this->advanceImportProgress($importId, $processedRows, $totalRows);
                } catch (InvalidArgumentException $e) {
                    $skipped++;
                    $processedRows++;
                    $this->advanceImportProgress($importId, $processedRows, $totalRows);
                    $errors[] = [
                        'row' => $index + 1,
                        'reason' => $e->getMessage(),
                    ];
                } catch (\Exception $e) {
                    $skipped++;
                    $processedRows++;
                    $this->advanceImportProgress($importId, $processedRows, $totalRows);
                    Log::error("Import error at row " . ($index + 1) . ": " . $e->getMessage());
                    $errors[] = [
                        'row' => $index + 1,
                        'reason' => $this->humanizeDatabaseError($e),
                    ];
                }
            }

            $message = "{$imported} of {$totalRows} alumni imported successfully";

            if ($importId !== null) {
                $this->importProgress->complete($importId, $message, $totalRows, [
                    'imported' => $imported,
                    'skipped' => $skipped,
                    'errors' => $errors,
                ]);
            }

            return [
                'imported' => $imported,
                'skipped' => $skipped,
                'total_rows' => $totalRows,
                'errors' => $errors,
                'message' => $message,
            ];
        } catch (\Exception $e) {
            if ($importId !== null) {
                $this->importProgress->fail($importId, $e->getMessage());
            }

            Log::error('Import failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Check if row is invalid or empty
     */
    protected function isSkippableRow($row): bool
    {
        if (!is_array($row)) {
            return true;
        }

        $rowText = $this->normalizeText($row);
        $nonEmptyCells = array_filter(
            array_map(
                fn ($value) => trim((string) $value),
                $row
            ),
            fn ($value) => $value !== ''
        );

        if (empty($nonEmptyCells)) {
            return true;
        }

        return str_contains($rowText, 'pampanga state university')
            || str_contains($rowText, 'lubao, campus')
            || (str_contains($rowText, 'student number')
                && str_contains($rowText, 'email'));
    }

    protected function isHeaderRow(array $row): bool
    {
        $rowText = $this->normalizeText($row);
        return (str_contains($rowText, 'student number') || str_contains($rowText, 'student no') || str_contains($rowText, 'student no.'))
            && str_contains($rowText, 'email')
            && str_contains($rowText, 'program');
    }

    protected function buildHeaderIndexes(array $row): array
    {
        $indexes = [];
        foreach ($row as $index => $value) {
            $normalized = $this->normalizeText([$value]);
            foreach (self::HEADER_ALIASES as $field => $aliases) {
                if (in_array($normalized, $aliases, true)) {
                    $indexes[$field] = $index;
                    break;
                }
            }
        }

        return $indexes;
    }

    protected function prepareRow(array $row, ?array $headerIndexes): array
    {
        $studentNumber = $this->requiredString(
            $this->cellValue($row, $headerIndexes, 'student_number'),
            'Student Number'
        );

        $email = $this->requiredString(
            $this->cellValue($row, $headerIndexes, 'email'),
            'Email'
        );

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Email format is invalid.');
        }

        $programName = $this->cellValue($row, $headerIndexes, 'program');
        $programId = null;
        if (!empty($programName)) {
            $program = Program::firstOrCreate(['name' => $programName]);
            $programId = $program->id;
        }

        $sex = $this->normalizeSex($this->cellValue($row, $headerIndexes, 'sex'));
        if ($sex === null && $this->cellValue($row, $headerIndexes, 'sex') !== null) {
            throw new InvalidArgumentException('Sex must be Male or Female.');
        }

        $graduationYear = $this->requiredString(
            $this->cellValue($row, $headerIndexes, 'graduation_year'),
            'Graduation Year'
        );
        if (!preg_match('/^\d{4}$/', $graduationYear)) {
            throw new InvalidArgumentException('Graduation Year must be a 4-digit year.');
        }

        $employmentStatus = $this->requiredString(
            $this->cellValue($row, $headerIndexes, 'employment_status'),
            'Employment Status'
        );

        $presentAddress = $this->requiredString(
            $this->cellValue($row, $headerIndexes, 'present_address'),
            'Present Address'
        );

        $contactNumber = $this->requiredString(
            $this->cellValue($row, $headerIndexes, 'contact_number'),
            'Contact Number'
        );

        $lastName = $this->requiredString(
            $this->cellValue($row, $headerIndexes, 'last_name'),
            'Last Name'
        );

        $givenName = $this->requiredString(
            $this->cellValue($row, $headerIndexes, 'given_name'),
            'Given Name'
        );

        $relatedToCourse = null;
        $relatedToCourseRaw = $this->cellValue($row, $headerIndexes, 'related_to_course');
        if ($relatedToCourseRaw !== null) {
            $relatedToCourse = $this->normalizeYesNo($relatedToCourseRaw);
        }

        $consent = $this->normalizeConsent(
            $this->cellValue($row, $headerIndexes, 'consent')
        );

        $rawInstructionRating = $this->cellValue($row, $headerIndexes, 'instruction_rating');
        $instructionRating = null;
        if ($rawInstructionRating !== null) {
            if (!is_numeric($rawInstructionRating)) {
                throw new InvalidArgumentException('Instruction Rating must be numeric.');
            }
            $instructionRating = (int) $rawInstructionRating;
        }

        $result = [
            'student_number' => $studentNumber,
            'email' => $email,
            'program_id' => $programId,
            'last_name' => $lastName,
            'given_name' => $givenName,
            'middle_initial' => $this->cellValue($row, $headerIndexes, 'middle_initial'),
            'sex' => $sex,
            'present_address' => $presentAddress,
            'contact_number' => $contactNumber,
            'graduation_year' => (int) $graduationYear,
            'employment_status' => $employmentStatus,
            'company_name' => $this->cellValue($row, $headerIndexes, 'company_name'),
            'work_position' => $this->cellValue($row, $headerIndexes, 'work_position'),
            'further_studies' => $this->cellValue($row, $headerIndexes, 'further_studies'),
            'sector' => $this->cellValue($row, $headerIndexes, 'sector'),
            'work_location' => $this->cellValue($row, $headerIndexes, 'work_location'),
            'employer_classification' => $this->cellValue($row, $headerIndexes, 'employer_classification'),
            'related_to_course' => $relatedToCourse,
            'consent' => $consent,
            'instruction_rating' => $instructionRating,
        ];

        return $result;
    }

    protected function normalizeText(array $row): string
    {
        return implode(
            ' ',
            array_filter(
                array_map(
                    fn ($value) => strtolower(trim((string) $value)),
                    $row
                ),
                fn ($value) => $value !== ''
            )
        );
    }

    protected function humanizeDatabaseError(\Throwable $e): string
    {
        $message = strtolower($e->getMessage());

        if (str_contains($message, 'alumni_sex_check')) {
            return 'Invalid sex value. Use Male or Female.';
        }

        if (str_contains($message, 'alumni_related_to_course_check')) {
            return 'Related To Course must be Yes, No, or Unsure.';
        }

        if (str_contains($message, 'not-null constraint')) {
            return 'Missing one or more required values.';
        }

        return 'Failed to save row due to database constraint.';
    }

    protected function cellValue(array $row, ?array $headerIndexes, string $field): ?string
    {
        $index = null;

        if ($headerIndexes !== null && array_key_exists($field, $headerIndexes)) {
            $index = $headerIndexes[$field];
        }

        if ($index === null && array_key_exists($field, self::FALLBACK_COLUMN_INDEX)) {
            $index = self::FALLBACK_COLUMN_INDEX[$field];
        }

        if ($index === null || !array_key_exists($index, $row)) {
            return null;
        }

        $value = trim((string) $row[$index]);
        return $value === '' ? null : $value;
    }

    protected function requiredString(?string $value, string $field): string
    {
        if ($value === null || $value === '') {
            throw new InvalidArgumentException("{$field} is required.");
        }

        return $value;
    }

    protected function normalizeSex(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $normalized = strtolower(trim($value));
        if (in_array($normalized, ['male', 'm'], true)) {
            return 'male';
        }

        if (in_array($normalized, ['female', 'f'], true)) {
            return 'female';
        }

        return null;
    }

    protected function normalizeYesNo(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $normalized = strtolower(trim($value));
        if (in_array($normalized, ['yes', 'y', 'true', '1'], true)) {
            return 'yes';
        }

        if (in_array($normalized, ['no', 'n', 'false', '0'], true)) {
            return 'no';
        }

        if (in_array($normalized, ['unsure', 'u'], true)) {
            return 'unsure';
        }

        throw new InvalidArgumentException('Related To Course must be Yes, No, or Unsure.');
    }

    protected function normalizeConsent(?string $value): int
    {
        if ($value === null || $value === '') {
            return 0;
        }

        $normalized = strtolower(trim($value));
        if (in_array($normalized, ['yes', 'y', 'true', '1'], true)) {
            return 1;
        }

        if (in_array($normalized, ['no', 'n', 'false', '0'], true)) {
            return 0;
        }

        throw new InvalidArgumentException('Consent must be Yes or No.');
    }

    /**
     * Import single row into database
     */
    protected function importRow(array $row): void
    {
        Alumni::updateOrCreate(
            ['student_number' => $row['student_number']],
            Arr::except($row, ['student_number'])
        );
    }

    /**
     * Get shared headers for consistency
     */
    public static function getHeaders(): array
    {
        return self::HEADERS;
    }

    private function countImportableRows(array $rows): int
    {
        $headerIndexes = null;
        $totalRows = 0;

        foreach ($rows as $row) {
            if ($headerIndexes === null && is_array($row) && $this->isHeaderRow($row)) {
                $headerIndexes = $this->buildHeaderIndexes($row);
                continue;
            }

            if ($this->isSkippableRow($row)) {
                continue;
            }

            $totalRows++;
        }

        return $totalRows;
    }

    private function advanceImportProgress(?string $importId, int $processedRows, int $totalRows): void
    {
        if ($importId === null) {
            return;
        }

        $this->importProgress->advance($importId, $processedRows, $totalRows);
    }
}
