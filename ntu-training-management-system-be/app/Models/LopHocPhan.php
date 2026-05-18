<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LopHocPhan extends Model
{
    use HasFactory;

    protected $table = 'lop_hoc_phans';

    protected $fillable = [
        'hoc_phan_id',
        'hoc_ky_id',
        'lop_hanh_chinh_id',
        'giang_vien_id',
        'ma_hoc_phan',
        'ten_hoc_phan',
        'lop_hoc_phan',
        'nhom_hoc_phan',
        'ten_giang_vien',
        'si_so',
        'trang_thai',
    ];

    protected $casts = [
        'hoc_phan_id' => 'integer',
        'hoc_ky_id' => 'integer',
        'lop_hanh_chinh_id' => 'integer',
        'giang_vien_id' => 'integer',
        'si_so' => 'integer',
        'trang_thai' => 'boolean',
    ];

    public function hocPhan(): BelongsTo
    {
        return $this->belongsTo(HocPhan::class, 'hoc_phan_id');
    }

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class, 'hoc_ky_id');
    }

    public function lopHanhChinh(): BelongsTo
    {
        return $this->belongsTo(Lop::class, 'lop_hanh_chinh_id');
    }

    public function giangVien(): BelongsTo
    {
        return $this->belongsTo(CanBo::class, 'giang_vien_id');
    }
}
