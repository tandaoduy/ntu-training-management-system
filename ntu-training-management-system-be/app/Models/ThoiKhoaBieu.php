<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThoiKhoaBieu extends Model
{
    use HasFactory;

    protected $table = 'thoi_khoa_bieus';

    protected $fillable = [
        'lop_hoc_phan_id',
        'phong_hoc_id',
        'hoc_ky_id',
        'ma_hoc_phan_snapshot',
        'ten_hoc_phan_snapshot',
        'lop_hoc_phan_snapshot',
        'nhom_hoc_phan_snapshot',
        'ten_giang_vien_snapshot',
        'giang_vien_id_snapshot',
        'si_so_snapshot',
        'ma_phong_snapshot',
        'thu',
        'tiet_bat_dau',
        'so_tiet',
        'tiet_ket_thuc',
        'tuan_bat_dau',
        'so_tuan',
        'tuan_ket_thuc',
        'created_by',
    ];

    protected $casts = [
        'lop_hoc_phan_id' => 'integer',
        'phong_hoc_id' => 'integer',
        'hoc_ky_id' => 'integer',
        'giang_vien_id_snapshot' => 'integer',
        'si_so_snapshot' => 'integer',
        'thu' => 'integer',
        'tiet_bat_dau' => 'integer',
        'so_tiet' => 'integer',
        'tiet_ket_thuc' => 'integer',
        'tuan_bat_dau' => 'integer',
        'so_tuan' => 'integer',
        'tuan_ket_thuc' => 'integer',
    ];

    public function lopHocPhan(): BelongsTo
    {
        return $this->belongsTo(LopHocPhan::class, 'lop_hoc_phan_id');
    }

    public function phongHoc(): BelongsTo
    {
        return $this->belongsTo(PhongHoc::class, 'phong_hoc_id');
    }

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class, 'hoc_ky_id');
    }
}
