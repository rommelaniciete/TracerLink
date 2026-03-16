<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class Student extends Model
{
    protected $fillable = [
        'student_number',
        'student_name',
        'email',
        'year',
    ];

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        $term = trim((string) $search);

        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($term) {
            $builder
                ->where('student_number', 'like', "%{$term}%")
                ->orWhere('student_name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%");
        });
    }

    public function scopeYear(Builder $query, ?string $year): Builder
    {
        if (blank($year) || $year === 'all') {
            return $query;
        }

        return $query->where('year', (int) $year);
    }

    public function scopeSorted(Builder $query, ?string $sort, ?string $direction): Builder
    {
        $allowedSorts = ['id', 'student_number', 'student_name', 'email', 'year'];
        $column = in_array($sort, $allowedSorts, true) ? $sort : 'id';
        $order = $direction === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($column, $order)->orderBy('id', 'desc');
    }

    public static function availableYears(): Collection
    {
        return static::query()
            ->whereNotNull('year')
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year');
    }
}
