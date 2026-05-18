<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CauHinhTuanHoc extends Model
{
    use HasFactory;

    protected $table = 'cau_hinh_tuan_hocs';

    protected $fillable = [
        'hoc_ky_id',
        'tuan_1_bat_dau',
        'so_tuan_mac_dinh',
        'tuan_nghis',
    ];

    protected $casts = [
        'hoc_ky_id' => 'integer',
        'tuan_1_bat_dau' => 'date',
        'so_tuan_mac_dinh' => 'integer',
        'tuan_nghis' => 'array',
    ];

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class, 'hoc_ky_id');
    }
}
