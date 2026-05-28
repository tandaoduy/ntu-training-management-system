<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LopHocPhanDangKy extends Model
{
    use HasFactory;

    protected $table = 'lop_hoc_phan_dang_kys';

    protected $fillable = [
        'hoc_ky_id',
        'lop_hoc_phan_id',
        'si_so_toi_da',
        'status',
    ];

    protected $casts = [
        'hoc_ky_id' => 'integer',
        'lop_hoc_phan_id' => 'integer',
        'si_so_toi_da' => 'integer',
    ];

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class, 'hoc_ky_id');
    }

    public function lopHocPhan(): BelongsTo
    {
        return $this->belongsTo(LopHocPhan::class, 'lop_hoc_phan_id');
    }

    public function dangKys(): HasMany
    {
        return $this->hasMany(DangKyHocPhan::class, 'lop_hoc_phan_dang_ky_id');
    }
}
