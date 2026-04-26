<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KetQuaHocTap extends Model
{
    use HasFactory;

    protected $table = 'ket_qua_hoc_taps';

    protected $fillable = [
        'sinh_vien_id',
        'hoc_phan_id',
        'lan_hoc',
        'hoc_ky_id',
        'diem_he_10',
        'diem_chu',
        'so_tin_chi_dat',
        'trang_thai',
        'ngay_cap_nhat_ket_qua',
        'ghi_chu',
    ];

    protected function casts(): array
    {
        return [
            'lan_hoc' => 'integer',
            'hoc_ky_id' => 'integer',
            'diem_he_10' => 'decimal:2',
            'so_tin_chi_dat' => 'integer',
            'ngay_cap_nhat_ket_qua' => 'date',
        ];
    }

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class, 'hoc_ky_id');
    }
}
