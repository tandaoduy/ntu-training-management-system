<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NganhDaoTao extends Model
{
    use HasFactory;

    protected $table = 'nganh_dao_taos';

    protected $fillable = [
        'ma_nganh',
        'ten_nganh',
        'don_vi_id',
        'he_dao_tao',
    ];

    public function donVi(): BelongsTo
    {
        return $this->belongsTo(DonVi::class, 'don_vi_id');
    }
}
