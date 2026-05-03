<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhienBanCtdt extends Model
{
    use HasFactory;

    protected $table = 'phien_ban_ctdts';

    protected $fillable = [
        'chuong_trinh_dao_tao_id',
        'version_no',
        'hieu_luc_tu',
        'hieu_luc_den',
        'trang_thai',
        'ghi_chu',
    ];

    protected $casts = [
        'version_no' => 'integer',
        'hieu_luc_tu' => 'date',
        'hieu_luc_den' => 'date',
    ];

    public function chuongTrinhDaoTao(): BelongsTo
    {
        return $this->belongsTo(ChuongTrinhDaoTao::class, 'chuong_trinh_dao_tao_id');
    }

    public function sinhVienChuongTrinhs(): HasMany
    {
        return $this->hasMany(SinhVienChuongTrinh::class, 'phien_ban_ctdt_id');
    }
}
