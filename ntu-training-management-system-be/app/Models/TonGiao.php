<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TonGiao extends Model
{
    use HasFactory;

    protected $table = 'ton_giaos';

    protected $fillable = [
        'ten_ton_giao',
        'thu_tu',
    ];
}
