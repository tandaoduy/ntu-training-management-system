<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class ChuyenVien extends Model
{
    use HasFactory;

    protected $table = 'chuyen_viens';

    protected $fillable = [
        'user_id',
        'ten_chuyen_vien',
        'email',
        'chuc_vu',
        'que_quan',
        'ngay_sinh',
        'so_dien_thoai',
        'gioi_tinh',
        'don_vi_id',
        'ton_giao',
        'dan_toc',
    ];

    public function user(): MorphOne
    {
        return $this->morphOne(User::class, 'profile');
    }
}
