<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DangKyHocPhan extends Model
{
    use HasFactory;

    protected $table = 'dang_ky_hoc_phans';

    protected $fillable = [
        'sinh_vien_id',
        'hoc_ky_id',
        'lop_hoc_phan_dang_ky_id',
        'lop_hoc_phan_id',
        'ma_hoc_phan',
        'status',
        'registered_at',
    ];

    protected $casts = [
        'sinh_vien_id' => 'integer',
        'hoc_ky_id' => 'integer',
        'lop_hoc_phan_dang_ky_id' => 'integer',
        'lop_hoc_phan_id' => 'integer',
        'registered_at' => 'datetime',
    ];

    public function sinhVien(): BelongsTo
    {
        return $this->belongsTo(SinhVien::class, 'sinh_vien_id');
    }

    public function lopHocPhanDangKy(): BelongsTo
    {
        return $this->belongsTo(LopHocPhanDangKy::class, 'lop_hoc_phan_dang_ky_id');
    }

    public function lopHocPhan(): BelongsTo
    {
        return $this->belongsTo(LopHocPhan::class, 'lop_hoc_phan_id');
    }

    public function grade(): HasOne
    {
        return $this->hasOne(StudentGrade::class, 'dang_ky_hoc_phan_id');
    }
}
