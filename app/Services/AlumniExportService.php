<?php

namespace App\Services;

use App\Models\Alumni;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class AlumniExportService
{
    protected const HEADERS = [
        'Student Number',
        'Email',
        'Program',
        'Last Name',
        'Given Name',
        'Middle Initial',
        'Sex',
        'Present Address',
        'Contact Number',
        'Graduation Year',
        'Employment Status',
        'Company Name',
        'Further Studies',
        'Sector',
        'Work Location',
        'Employer Classification',
        'Related To Course',
        'Consent Given',
    ];

    protected const UNIVERSITY_NAME = 'Pampanga State University';
    protected const CAMPUS_NAME = 'Lubao, Campus';
    protected const HEADER_BG_COLOR = 'D9E1F2';

    public function export(array $filters = [], array $selectedIds = []): string
    {
        try {
            $alumni = $this->queryAlumni($filters, $selectedIds);

            if ($alumni->isEmpty()) {
                throw new \Exception('No alumni found for export.');
            }

            $spreadsheet = $this->createSpreadsheet($alumni);

            return $this->saveSpreadsheet($spreadsheet);
        } catch (\Exception $exception) {
            Log::error('Alumni export failed: ' . $exception->getMessage());
            throw $exception;
        }
    }

    protected function queryAlumni(array $filters, array $selectedIds): Collection
    {
        return Alumni::query()
            ->with('program')
            ->when(! empty($selectedIds), fn ($query) => $query->whereIn('id', $selectedIds), fn ($query) => $query->managementFilters($filters))
            ->orderByDesc('id')
            ->get();
    }

    protected function createSpreadsheet(Collection $alumni): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Alumni List');

        $this->addUniversityHeading($sheet);
        $this->addHeaders($sheet);
        $this->addData($sheet, $alumni);
        $this->formatSpreadsheet($sheet);

        return $spreadsheet;
    }

    protected function addUniversityHeading($sheet): void
    {
        $sheet->insertNewRowBefore(1, 2);

        $lastCol = chr(64 + count(self::HEADERS));
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->mergeCells("A2:{$lastCol}2");

        $sheet->setCellValue('A1', self::UNIVERSITY_NAME);
        $sheet->setCellValue('A2', self::CAMPUS_NAME);

        $sheet->getStyle('A1:A2')->applyFromArray([
            'font' => [
                'name' => 'Times New Roman',
                'size' => 14,
                'bold' => true,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
    }

    protected function addHeaders($sheet): void
    {
        $sheet->fromArray([self::HEADERS], null, 'A3');

        $lastCol = chr(64 + count(self::HEADERS));
        $sheet->getStyle("A3:{$lastCol}3")->applyFromArray([
            'font' => ['bold' => true],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => self::HEADER_BG_COLOR],
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN],
            ],
        ]);
    }

    protected function addData($sheet, Collection $alumni): void
    {
        $rowIndex = 4;

        foreach ($alumni as $alumnus) {
            $sheet->fromArray([[
                $alumnus->student_number,
                $alumnus->email,
                $alumnus->program?->name,
                $alumnus->last_name,
                $alumnus->given_name,
                $alumnus->middle_initial,
                $alumnus->sex,
                $alumnus->present_address,
                $alumnus->contact_number,
                $alumnus->graduation_year,
                $alumnus->employment_status,
                $alumnus->company_name,
                $alumnus->further_studies,
                $alumnus->sector,
                $alumnus->work_location,
                $alumnus->employer_classification,
                $alumnus->related_to_course,
                $alumnus->consent ? 'Yes' : 'No',
            ]], null, 'A' . $rowIndex++);
        }
    }

    protected function formatSpreadsheet($sheet): void
    {
        $lastCol = chr(64 + count(self::HEADERS));
        $lastRow = $sheet->getHighestRow();

        foreach (range('A', $lastCol) as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $sheet->getStyle("A3:{$lastCol}{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN],
            ],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
    }

    protected function saveSpreadsheet(Spreadsheet $spreadsheet): string
    {
        $writer = new Xlsx($spreadsheet);
        ob_start();
        $writer->save('php://output');

        return (string) ob_get_clean();
    }
}
