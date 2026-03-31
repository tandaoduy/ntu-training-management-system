<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class CanBo extends Model
{
    use HasFactory;

    protected $table = 'can_bos';

    protected $fillable = [
        'user_id',
        'ten_giang_vien',
        'ngay_sinh',
        'que_quan',
        'don_vi_id',
        'dia_chi',
        'so_dien_thoai',
        'chuc_vu',
        'chuc_danh',
        'email',
        'gioi_tinh',
        'ton_giao',
        'dan_toc',
    ];

    public function user(): MorphOne
    {
        return $this->morphOne(User::class, 'profile');
    }
}
