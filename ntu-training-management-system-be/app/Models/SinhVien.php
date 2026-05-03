<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
        'noi_sinh',
        'gioi_tinh',
        'email',
        'so_dien_thoai',
        'ma_lop',
        'lop_id',
        'nganh_dao_tao_id',
        'ten_nganh_hoc',
        'don_vi_id',
        'ten_don_vi',
        'he_dao_tao',
        'nam_nhap_hoc',
        'khoa_hoc',
        'so_cccd',
        'ngay_cap_cccd',
        'noi_cap_cccd',
        'ho_khau_tinh_thanh_pho',
        'ho_khau_quan_huyen',
        'que_quan',
        'que_quan_tinh_thanh_pho',
        'que_quan_quan_huyen',
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

    public function chuongTrinhs(): HasMany
    {
        return $this->hasMany(SinhVienChuongTrinh::class, 'sinh_vien_id');
    }

    public function chuongTrinhHienTai(): HasOne
    {
        return $this->hasOne(SinhVienChuongTrinh::class, 'sinh_vien_id')
            ->where('locked', true)
            ->latestOfMany();
    }
}
