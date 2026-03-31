<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class QuanLy extends Model
{
    use HasFactory;

    protected $table = 'quan_lys';

    protected $fillable = [
        'user_id',
        'ten_nguoi_quan_ly',
        'email',
        'chuc_vu',
        'que_quan',
        'ngay_sinh',
        'so_dien_thoai',
        'ton_giao',
        'dan_toc',
        'don_vi_id',
    ];

    public function user(): MorphOne
    {
        return $this->morphOne(User::class, 'profile');
    }
}
