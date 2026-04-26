<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HocKy extends Model
{
    use HasFactory;

    protected $table = 'hoc_kys';

    protected $fillable = [
        'nam_hoc_id',
        'hoc_ky',
    ];

    protected function casts(): array
    {
        return [
            'hoc_ky' => 'string',
            'nam_hoc_id' => 'integer',
        ];
    }

    public function namHoc(): BelongsTo
    {
        return $this->belongsTo(NamHoc::class, 'nam_hoc_id');
    }
}
