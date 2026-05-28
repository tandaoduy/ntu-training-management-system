<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentGrade extends Model
{
    use HasFactory;

    protected $table = 'student_grades';

    protected $fillable = [
        'dang_ky_hoc_phan_id',
        'sinh_vien_id',
        'hoc_ky_id',
        'lop_hoc_phan_id',
        'lop_hoc_phan_dang_ky_id',
        'giang_vien_id',
        'attendance_score',
        'midterm_score',
        'final_score',
        'average_score',
        'letter_grade',
        'grade_point',
        'result',
        'note',
        'graded_by',
        'graded_at',
        'locked_at',
    ];

    protected $casts = [
        'dang_ky_hoc_phan_id' => 'integer',
        'sinh_vien_id' => 'integer',
        'hoc_ky_id' => 'integer',
        'lop_hoc_phan_id' => 'integer',
        'lop_hoc_phan_dang_ky_id' => 'integer',
        'giang_vien_id' => 'integer',
        'attendance_score' => 'decimal:1',
        'midterm_score' => 'decimal:1',
        'final_score' => 'decimal:1',
        'average_score' => 'decimal:1',
        'grade_point' => 'decimal:2',
        'graded_by' => 'integer',
        'graded_at' => 'datetime',
        'locked_at' => 'datetime',
    ];

    public function registration(): BelongsTo
    {
        return $this->belongsTo(DangKyHocPhan::class, 'dang_ky_hoc_phan_id');
    }

    public function sinhVien(): BelongsTo
    {
        return $this->belongsTo(SinhVien::class, 'sinh_vien_id');
    }

    public function lopHocPhan(): BelongsTo
    {
        return $this->belongsTo(LopHocPhan::class, 'lop_hoc_phan_id');
    }

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class, 'hoc_ky_id');
    }

    public function giangVien(): BelongsTo
    {
        return $this->belongsTo(CanBo::class, 'giang_vien_id');
    }
}
