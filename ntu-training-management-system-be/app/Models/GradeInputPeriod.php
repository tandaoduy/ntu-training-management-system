<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeInputPeriod extends Model
{
    use HasFactory;

    protected $table = 'grade_input_periods';

    protected $fillable = [
        'hoc_ky_id',
        'starts_at',
        'ends_at',
        'status',
        'created_by',
    ];

    protected $casts = [
        'hoc_ky_id' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'created_by' => 'integer',
    ];

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class, 'hoc_ky_id');
    }
}
