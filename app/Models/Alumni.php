<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Alumni extends Model
{
    protected $table = 'alumni';

    protected $fillable = [
        'student_number',
        'email',
        'program_id',
        'last_name',
        'given_name',
        'middle_initial',
        'sex',
        'present_address',
        'contact_number',
        'graduation_year',
        'employment_status',
        'company_name',
        'work_position',
        'further_studies',
        'sector',
        'work_location',
        'employer_classification',
        'related_to_course',
        'consent',
        'instruction_rating',
    ];

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function scopeManagementFilters(Builder $query, array $filters): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $graduationYear = $filters['graduation_year'] ?? null;
        $programId = $filters['program_id'] ?? null;
        $employmentStatus = $filters['employment_status'] ?? null;
        $workLocation = $filters['work_location'] ?? null;
        $sex = $filters['sex'] ?? null;

        return $query
            ->when($search !== '', function (Builder $builder) use ($search) {
                $builder->where(function (Builder $searchQuery) use ($search) {
                    $searchQuery
                        ->where('student_number', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('given_name', 'like', "%{$search}%")
                        ->orWhere('middle_initial', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%")
                        ->orWhere('employment_status', 'like', "%{$search}%")
                        ->orWhereHas('program', function (Builder $programQuery) use ($search) {
                            $programQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when(filled($graduationYear) && $graduationYear !== 'all', fn (Builder $builder) => $builder->where('graduation_year', (int) $graduationYear))
            ->when(filled($programId) && $programId !== 'all', fn (Builder $builder) => $builder->where('program_id', (int) $programId))
            ->when(filled($employmentStatus) && $employmentStatus !== 'all', fn (Builder $builder) => $builder->where('employment_status', $employmentStatus))
            ->when(filled($workLocation) && $workLocation !== 'all', fn (Builder $builder) => $builder->where('work_location', $workLocation))
            ->when(filled($sex) && $sex !== 'all', fn (Builder $builder) => $builder->where('sex', $sex));
    }

    public function scopeEmployabilityFilters(Builder $query, array $filters): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $programId = $filters['program_id'] ?? null;

        return $query
            ->when(filled($programId) && $programId !== 'all', fn (Builder $builder) => $builder->where('program_id', (int) $programId))
            ->when($search !== '', function (Builder $builder) use ($search) {
                $builder->where(function (Builder $searchQuery) use ($search) {
                    $searchQuery
                        ->where('last_name', 'like', "%{$search}%")
                        ->orWhere('given_name', 'like', "%{$search}%")
                        ->orWhere('middle_initial', 'like', "%{$search}%")
                        ->orWhere('sex', 'like', "%{$search}%")
                        ->orWhere('employment_status', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%")
                        ->orWhere('work_position', 'like', "%{$search}%")
                        ->orWhereHas('program', function (Builder $programQuery) use ($search) {
                            $programQuery->where('name', 'like', "%{$search}%");
                        });
                });
            });
    }
}
