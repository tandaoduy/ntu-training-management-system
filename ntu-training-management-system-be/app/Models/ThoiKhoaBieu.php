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
        return $this->belongsTo(Lop::class, 'lop_hoc_phan_id');
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
