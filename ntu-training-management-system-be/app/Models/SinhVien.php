<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class SinhVien extends Model
{
    use HasFactory;

    protected $table = 'sinh_viens';

    protected $fillable = [
        'user_id',
        'anh',
        'ten_sinh_vien',
        'ngay_sinh',
        'gioi_tinh',
        'email',
        'so_dien_thoai',
        'ma_lop',
        'lop_id',
        'nganh_dao_tao_id',
        'don_vi_id',
        'he_dao_tao',
        'so_cccd',
        'ngay_cap_cccd',
        'noi_cap_cccd',
        'que_quan',
        'dan_toc',
        'ton_giao',
        'dia_chi_lien_lac',
        'so_dien_thoai_gia_dinh',
        'ho_ten_cha',
        'ho_ten_me',
        'ngay_sinh_cha',
        'ngay_sinh_me',
        'que_quan_cha',
        'que_quan_me',
        'nghe_nghiep_cha',
        'nghe_nghiep_me',
    ];

    public function user(): MorphOne
    {
        return $this->morphOne(User::class, 'profile');
    }

    public function lop(): BelongsTo
    {
        return $this->belongsTo(Lop::class, 'lop_id');
    }
}
