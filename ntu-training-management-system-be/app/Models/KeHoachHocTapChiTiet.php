<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KeHoachHocTapChiTiet extends Model
{
    use HasFactory;

    protected $table = 'ke_hoach_hoc_tap_chi_tiets';

    protected $fillable = [
        'ke_hoach_hoc_tap_id',
        'hoc_phan_id',
        'hoc_ky_id',
        'so_tin_chi',
    ];

    protected $casts = [
        'so_tin_chi' => 'integer',
    ];

    public function keHoachHocTap(): BelongsTo
    {
        return $this->belongsTo(KeHoachHocTap::class, 'ke_hoach_hoc_tap_id');
    }

    public function hocPhan(): BelongsTo
    {
        return $this->belongsTo(HocPhan::class, 'hoc_phan_id');
    }

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class, 'hoc_ky_id');
    }
}
