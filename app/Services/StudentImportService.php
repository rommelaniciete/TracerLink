<?php

namespace App\Services;

use App\Models\Student;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;

class StudentImportService
{
    public function __construct(
        private readonly ImportProgressService $importProgress,
    ) {
    }

    public function import(string $filePath, ?string $importId = null): array
    {
        try {
            try {
                $spreadsheet = IOFactory::load($filePath);
            } catch (\Throwable $e) {
                throw ValidationException::withMessages([
                    'file' => 'The uploaded file could not be read. Please use the template and try again.',
                ]);
            }

            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            array_shift($rows);

            $processableRows = array_values(array_filter($rows, fn (array $row) => ! $this->isBlankStudentImportRow($row)));
            $totalRows = count($processableRows);

            if ($totalRows === 0) {
                throw ValidationException::withMessages([
                    'file' => 'No student rows were found in the uploaded file.',
                ]);
            }

            if ($importId !== null) {
                $this->importProgress->startProcessing($importId, $totalRows);
            }

            $inserted = 0;
            $skipped = 0;
            $errors = [];
            $processedRows = 0;
            $currentYear = (int) date('Y');

            foreach ($rows as $index => $row) {
                if ($this->isBlankStudentImportRow($row)) {
                    continue;
                }

                $rowNumber = $index + 2;
                $studentNumber = trim((string) ($row[0] ?? ''));
                $studentName = trim((string) ($row[1] ?? ''));
                $email = trim((string) ($row[2] ?? ''));
                $year = trim((string) ($row[3] ?? ''));

                if ($studentNumber === '') {
                    $skipped++;
                    $errors[] = $this->studentImportError($rowNumber, 'Student Number is required.');
                    $processedRows++;
                    $this->advanceImportProgress($importId, $processedRows, $totalRows);
                    continue;
                }

                if ($studentName === '') {
                    $skipped++;
                    $errors[] = $this->studentImportError($rowNumber, 'Student Name is required.');
                    $processedRows++;
                    $this->advanceImportProgress($importId, $processedRows, $totalRows);
                    continue;
                }

                if ($email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $skipped++;
                    $errors[] = $this->studentImportError($rowNumber, 'Email format is invalid.');
                    $processedRows++;
                    $this->advanceImportProgress($importId, $processedRows, $totalRows);
                    continue;
                }

                if ($year === '') {
                    $skipped++;
                    $errors[] = $this->studentImportError($rowNumber, 'Year is required.');
                    $processedRows++;
                    $this->advanceImportProgress($importId, $processedRows, $totalRows);
                    continue;
                }

                if (! is_numeric($year)) {
                    $skipped++;
                    $errors[] = $this->studentImportError($rowNumber, 'Year must be a valid number.');
                    $processedRows++;
                    $this->advanceImportProgress($importId, $processedRows, $totalRows);
                    continue;
                }

                $year = (int) $year;

                if ($year < 2022 || $year > $currentYear) {
                    $skipped++;
                    $errors[] = $this->studentImportError($rowNumber, "Year must be between 2022 and {$currentYear}.");
                    $processedRows++;
                    $this->advanceImportProgress($importId, $processedRows, $totalRows);
                    continue;
                }

                $hasDuplicateStudentNumber = Student::query()->where('student_number', $studentNumber)->exists();
                $hasDuplicateEmail = $email !== '' && Student::query()->where('email', $email)->exists();

                if ($hasDuplicateStudentNumber) {
                    $skipped++;
                    $errors[] = $this->studentImportError($rowNumber, 'Student Number already exists.');
                    $processedRows++;
                    $this->advanceImportProgress($importId, $processedRows, $totalRows);
                    continue;
                }

                if ($hasDuplicateEmail) {
                    $skipped++;
                    $errors[] = $this->studentImportError($rowNumber, 'Email already exists.');
                    $processedRows++;
                    $this->advanceImportProgress($importId, $processedRows, $totalRows);
                    continue;
                }

                Student::create([
                    'student_number' => $studentNumber,
                    'student_name' => $studentName,
                    'email' => $email !== '' ? $email : null,
                    'year' => $year,
                ]);

                $inserted++;
                $processedRows++;
                $this->advanceImportProgress($importId, $processedRows, $totalRows);
            }

            $message = $inserted === $totalRows
                ? "{$inserted} students imported successfully!"
                : ($inserted > 0
                    ? "{$inserted} of {$totalRows} students imported successfully."
                    : 'No students were imported.');

            if ($importId !== null) {
                $this->importProgress->complete($importId, $message, $totalRows, [
                    'imported' => $inserted,
                    'skipped' => $skipped,
                    'errors' => $errors,
                ]);
            }

            return [
                'message' => $message,
                'imported' => $inserted,
                'skipped' => $skipped,
                'total_rows' => $totalRows,
                'errors' => $errors,
            ];
        } catch (ValidationException $exception) {
            if ($importId !== null) {
                $this->importProgress->fail($importId, $this->validationMessage($exception), [
                    'errors' => $this->validationIssues($exception),
                ]);
            }

            throw $exception;
        } catch (\Throwable $exception) {
            if ($importId !== null) {
                $this->importProgress->fail($importId, 'Import failed.');
            }

            throw $exception;
        }
    }

    private function isBlankStudentImportRow(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function studentImportError(int $row, string $reason): array
    {
        return [
            'row' => $row,
            'reason' => $reason,
        ];
    }

    private function advanceImportProgress(?string $importId, int $processedRows, int $totalRows): void
    {
        if ($importId === null) {
            return;
        }

        $this->importProgress->advance($importId, $processedRows, $totalRows);
    }

    private function validationMessage(ValidationException $exception): string
    {
        foreach ($exception->errors() as $messages) {
            if (! empty($messages[0])) {
                return (string) $messages[0];
            }
        }

        return 'Import failed.';
    }

    private function validationIssues(ValidationException $exception): array
    {
        $issues = [];

        foreach ($exception->errors() as $messages) {
            foreach ($messages as $message) {
                $issues[] = [
                    'row' => null,
                    'reason' => (string) $message,
                ];
            }
        }

        return $issues;
    }
}
