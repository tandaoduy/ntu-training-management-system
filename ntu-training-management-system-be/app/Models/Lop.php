<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lop extends Model
{
    use HasFactory;

    protected $table = 'lops';

    protected $fillable = [
        'don_vi_id',
        'lop_hoc_phan',
        'si_so',
        'mo_hinh_dao_tao',
        'ma_khoi',
        'ten_khoi',
        'ma_don_vi',
        'ten_don_vi',
        'trang_thai',
        'ma_lop',
        'ten_lop',
        'khoa_hoc',
    ];

    protected $casts = [
        'si_so' => 'integer',
        'trang_thai' => 'boolean',
    ];

    public function donVi(): BelongsTo
    {
        return $this->belongsTo(DonVi::class, 'don_vi_id');
    }

    public function sinhViens(): HasMany
    {
        return $this->hasMany(SinhVien::class, 'lop_id');
    }
}
