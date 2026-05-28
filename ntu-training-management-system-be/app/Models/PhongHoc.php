<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhongHoc extends Model
{
    use HasFactory;

    protected $table = 'phong_hocs';

    protected $fillable = [
        'giang_duong_id',
        'ma_phong',
    ];

    protected $casts = [
    ];

    public function giangDuong(): BelongsTo
    {
        return $this->belongsTo(GiangDuong::class, 'giang_duong_id');
    }

    public function thoiKhoaBieus(): HasMany
    {
        return $this->hasMany(ThoiKhoaBieu::class, 'phong_hoc_id');
    }
}
