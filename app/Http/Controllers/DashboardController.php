<?php

namespace App\Http\Controllers;
// Dashboard controller showing program and alumni statistics
use App\Models\Program;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Show the dashboard with program counts, alumni employment, and rating data.
     */
    public function index()
    {
        // ✅ Get all programs with alumni count
        $programs = Program::withCount('alumni')->orderBy('id')->get();

        // ✅ Get alumni data grouped by graduation_year
        $rawData = DB::table('alumni')
            ->selectRaw('
                graduation_year as year,
                COUNT(*) as total,
                SUM(CASE WHEN LOWER(TRIM(COALESCE(employment_status, \'\'))) = \'employed\' THEN 1 ELSE 0 END) as employed,
                SUM(CASE WHEN LOWER(TRIM(COALESCE(employment_status, \'\'))) = \'unemployed\' THEN 1 ELSE 0 END) as unemployed,
                SUM(CASE WHEN LOWER(TRIM(COALESCE(employment_status, \'\'))) NOT IN (\'employed\', \'unemployed\') THEN 1 ELSE 0 END) as not_tracked
            ')
            ->whereNotNull('graduation_year')
            ->groupBy('graduation_year')
            ->orderByRaw('CAST(graduation_year AS INTEGER) ASC')
            ->get()
            ->keyBy('year');

        // ✅ Find graduation year range
        $minYear = DB::table('alumni')
            ->whereNotNull('graduation_year')
            ->min(DB::raw('CAST(graduation_year AS INTEGER)'));

        $maxYear = DB::table('alumni')
            ->whereNotNull('graduation_year')
            ->max(DB::raw('CAST(graduation_year AS INTEGER)'));

        // ✅ Prepare chart data for employment chart
        $alumniPerYear = [];

        if ($minYear && $maxYear) {
            for ($year = $minYear; $year <= $maxYear; $year++) {
                $data = $rawData[$year] ?? null;

                $alumniPerYear[] = [
                    'year' => (string) $year,
                    'total' => $data->total ?? 0,
                    'employed' => $data->employed ?? 0,
                    'unemployed' => $data->unemployed ?? 0,
                    'notTracked' => $data->not_tracked ?? 0,
                ];
            }
        }

        // ✅ Get average instruction rating per program (for summary/statistics if needed)
        $ratings = DB::table('alumni')
            ->join('programs', 'alumni.program_id', '=', 'programs.id')
            ->selectRaw('programs.name as program, ROUND(AVG(alumni.instruction_rating), 1) as average_rating')
            ->whereNotNull('alumni.instruction_rating')
            ->groupBy('programs.name')
            ->orderBy('programs.name')
            ->get();

        // ✅ Instruction Rating Distribution (for star bar chart)
        $ratingCounts = DB::table('alumni')
            ->selectRaw('instruction_rating as star, COUNT(*) as total')
            ->whereNotNull('instruction_rating')
            ->groupBy('instruction_rating')
            ->orderBy('instruction_rating')
            ->get();

        // ✅ Render dashboard with all data
        return Inertia::render('dashboard', [
            'programs' => $programs,
            'alumniPerYear' => $alumniPerYear,
            'ratings' => $ratings,
            'ratingCounts' => $ratingCounts,
        ]);
    }
}
