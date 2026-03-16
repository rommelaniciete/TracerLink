<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class JobPost extends Model
{
    protected $fillable = [
        'title',
        'description',
        'company_name',
        'location',
        'location_link',
        'requirements',
        'responsibilities',
        'apply_link',
        'status',
        'posted_by',
        // Added date range fields
        'posted_date',
        'application_deadline',
        'start_date',
    ];

    protected $casts = [
        'posted_date' => 'date',
        'application_deadline' => 'date',
        'start_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Optional: Link to the user/admin who posted
    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    // Optional: Applications related to this job post
    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    // Scopes for date filtering
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                    ->where(function ($query) {
                        $query->whereNull('application_deadline')
                              ->orWhere('application_deadline', '>=', now());
                    });
    }

    public function scopeUpcoming($query)
    {
        return $query->where('start_date', '>', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('application_deadline', '<', now());
    }

    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->where(function ($query) use ($startDate, $endDate) {
            $query->whereBetween('posted_date', [$startDate, $endDate])
                  ->orWhereBetween('application_deadline', [$startDate, $endDate])
                  ->orWhereBetween('start_date', [$startDate, $endDate]);
        });
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        $term = trim((string) $search);

        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($term) {
            $builder
                ->where('title', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%")
                ->orWhere('company_name', 'like', "%{$term}%")
                ->orWhere('location', 'like', "%{$term}%")
                ->orWhere('requirements', 'like', "%{$term}%")
                ->orWhere('responsibilities', 'like', "%{$term}%");
        });
    }

    // Helper methods
    public function isActive(): bool
    {
        return $this->status === 'active' && 
               (!$this->application_deadline || $this->application_deadline >= now());
    }

    public function isExpired(): bool
    {
        return $this->application_deadline && $this->application_deadline < now();
    }

    public function isUpcoming(): bool
    {
        return $this->start_date && $this->start_date > now();
    }
}
