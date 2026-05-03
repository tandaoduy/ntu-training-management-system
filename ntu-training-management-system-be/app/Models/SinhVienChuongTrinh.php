<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SinhVienChuongTrinh extends Model
{
    use HasFactory;

    protected $table = 'sinh_vien_chuong_trinhs';

    protected $fillable = [
        'sinh_vien_id',
        'phien_ban_ctdt_id',
        'ngay_ap_dung',
        'locked',
        'ghi_chu',
    ];

    protected $casts = [
        'ngay_ap_dung' => 'date',
        'locked' => 'boolean',
    ];

    public function sinhVien(): BelongsTo
    {
        return $this->belongsTo(SinhVien::class, 'sinh_vien_id');
    }

    public function phienBanCtdt(): BelongsTo
    {
        return $this->belongsTo(PhienBanCtdt::class, 'phien_ban_ctdt_id');
    }
}
