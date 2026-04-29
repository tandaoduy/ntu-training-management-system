<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DanToc extends Model
{
    use HasFactory;

    protected $table = 'dan_tocs';

    protected $fillable = [
        'ten_dan_toc',
        'thu_tu',
    ];
}
