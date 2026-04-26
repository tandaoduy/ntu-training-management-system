<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NamHoc extends Model
{
    use HasFactory;

    protected $table = 'nam_hocs';

    protected $fillable = [
        'nam_hoc',
    ];

    public function hocKys(): HasMany
    {
        return $this->hasMany(HocKy::class, 'nam_hoc_id');
    }
}
