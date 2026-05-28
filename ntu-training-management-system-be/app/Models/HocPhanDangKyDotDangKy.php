<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HocPhanDangKyDotDangKy extends Model
{
    use HasFactory;

    protected $table = 'hoc_phan_dang_ky_dot_dang_kys';

    protected $fillable = [
        'hoc_ky_id',
        'starts_at',
        'ends_at',
        'status',
    ];

    protected $casts = [
        'hoc_ky_id' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class, 'hoc_ky_id');
    }
}
