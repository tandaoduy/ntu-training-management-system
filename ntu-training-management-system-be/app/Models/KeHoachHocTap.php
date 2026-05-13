<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KeHoachHocTap extends Model
{
    use HasFactory;

    protected $table = 'ke_hoach_hoc_taps';

    protected $fillable = [
        'sinh_vien_id',
        'dot_dang_ky_id',
        'hoc_ky_id',
        'tong_tin_chi',
        'status',
        'submitted_at',
    ];

    protected $casts = [
        'tong_tin_chi' => 'integer',
        'submitted_at' => 'datetime',
    ];

    public function sinhVien(): BelongsTo
    {
        return $this->belongsTo(SinhVien::class, 'sinh_vien_id');
    }

    public function dotDangKy(): BelongsTo
    {
        return $this->belongsTo(KeHoachHocTapDotDangKy::class, 'dot_dang_ky_id');
    }

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class, 'hoc_ky_id');
    }

    public function chiTiets(): HasMany
    {
        return $this->hasMany(KeHoachHocTapChiTiet::class, 'ke_hoach_hoc_tap_id');
    }
}
