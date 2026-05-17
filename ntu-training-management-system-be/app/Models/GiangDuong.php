<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GiangDuong extends Model
{
    use HasFactory;

    protected $table = 'giang_duongs';

    protected $fillable = [
        'ma_giang_duong',
        'ten_giang_duong',
        'mo_ta',
    ];

    public function phongHocs(): HasMany
    {
        return $this->hasMany(PhongHoc::class, 'giang_duong_id');
    }
}
