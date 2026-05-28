<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeWeightConfig extends Model
{
    use HasFactory;

    protected $table = 'grade_weight_configs';

    protected $fillable = [
        'lop_hoc_phan_id',
        'giang_vien_id',
        'attendance_weight',
        'midterm_weight',
        'final_weight',
        'grade_mode',
    ];

    protected $casts = [
        'lop_hoc_phan_id' => 'integer',
        'giang_vien_id' => 'integer',
        'attendance_weight' => 'decimal:2',
        'midterm_weight' => 'decimal:2',
        'final_weight' => 'decimal:2',
    ];

    public function lopHocPhan(): BelongsTo
    {
        return $this->belongsTo(LopHocPhan::class, 'lop_hoc_phan_id');
    }

    public function giangVien(): BelongsTo
    {
        return $this->belongsTo(CanBo::class, 'giang_vien_id');
    }
}
