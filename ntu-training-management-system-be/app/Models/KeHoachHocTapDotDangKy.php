<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KeHoachHocTapDotDangKy extends Model
{
    use HasFactory;

    protected $table = 'ke_hoach_hoc_tap_dot_dang_kys';

    protected $fillable = [
        'current_hoc_ky_id',
        'target_hoc_ky_id',
        'starts_at',
        'ends_at',
        'status',
        'ghi_chu',
        'created_by',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function currentHocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class, 'current_hoc_ky_id');
    }

    public function targetHocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class, 'target_hoc_ky_id');
    }

    public function keHoachHocTaps(): HasMany
    {
        return $this->hasMany(KeHoachHocTap::class, 'dot_dang_ky_id');
    }
}
