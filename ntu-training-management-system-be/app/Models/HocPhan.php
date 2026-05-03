<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HocPhan extends Model
{
    use HasFactory;

    protected $table = 'hoc_phans';

    protected $fillable = [
        'don_vi_id',
        'ma_hoc_phan',
        'ten_hoc_phan',
        'so_tin_chi',
        'so_tiet_ly_thuyet',
        'so_tiet_thuc_hanh',
        'loai_hoc_phan',
        'mo_ta',
        'trang_thai',
    ];

    protected $casts = [
        'trang_thai' => 'boolean',
        'so_tin_chi' => 'integer',
        'so_tiet_ly_thuyet' => 'integer',
        'so_tiet_thuc_hanh' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the don_vi that this hoc_phan belongs to
     */
    public function donVi(): BelongsTo
    {
        return $this->belongsTo(DonVi::class, 'don_vi_id');
    }
}
