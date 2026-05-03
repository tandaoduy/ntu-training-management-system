<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChuongTrinhDaoTao extends Model
{
    use HasFactory;

    protected $table = 'chuong_trinh_dao_taos';

    protected $fillable = [
        'ma_ctdt',
        'ten_ctdt',
        'nganh_dao_tao_id',
        'chuyen_nganh_id',
        'khoa_tuyen_sinh_id',
        'tong_tin_chi_yeu_cau',
        'mo_ta',
    ];

    protected $casts = [
        'tong_tin_chi_yeu_cau' => 'integer',
    ];

    public function nganhDaoTao(): BelongsTo
    {
        return $this->belongsTo(NganhDaoTao::class, 'nganh_dao_tao_id');
    }

    public function phienBans(): HasMany
    {
        return $this->hasMany(PhienBanCtdt::class, 'chuong_trinh_dao_tao_id');
    }
}
