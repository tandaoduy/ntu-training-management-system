<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DonVi extends Model
{
    use HasFactory;

    protected $table = 'don_vis';

    protected $fillable = [
        'ma_don_vi',
        'ten_don_vi',
        'loai_don_vi',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all hoc_phans for this don_vi
     */
    public function hocPhans(): HasMany
    {
        return $this->hasMany(HocPhan::class, 'don_vi_id');
    }

    public function lops(): HasMany
    {
        return $this->hasMany(Lop::class, 'don_vi_id');
    }

    public function nganhDaoTaos(): HasMany
    {
        return $this->hasMany(NganhDaoTao::class, 'don_vi_id');
    }
}
