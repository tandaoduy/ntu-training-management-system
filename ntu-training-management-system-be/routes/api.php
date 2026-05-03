<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\EmailVerificationController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\Admin\Account\AdminAccountController;
use App\Http\Controllers\Api\Admin\AcademicTerm\AcademicTermController;
use App\Http\Controllers\Api\Admin\Classes\LopController;
use App\Http\Controllers\Api\Admin\Curriculum\StudentCurriculumController;
use App\Http\Controllers\Api\AcademicCatalogController;
use App\Http\Controllers\Api\Admin\Province\ProvinceController;
use App\Http\Controllers\Api\Student\Curriculum\StudentCurriculumController as StudentCurriculumApiController;
use App\Http\Controllers\Api\StudentDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json([
        'message' => 'Backend OK'
    ]);
});

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/forgot-password/captcha', [PasswordResetController::class, 'captcha'])
        ->middleware('throttle:15,1');
    Route::post('/check-email', [PasswordResetController::class, 'checkEmail'])->name('auth.check-email');
    Route::post('/forgot-password', [PasswordResetController::class, 'forgot'])->name('password.forgot');
    Route::post('/verify-reset-token', [PasswordResetController::class, 'verify'])->name('password.verify');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->name('password.reset');
    Route::get('/email/verify/{user}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware('signed:relative')
        ->name('auth.verification.verify');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::get('/email/verification-status', [EmailVerificationController::class, 'status']);
        Route::post('/email/verification-notification', [EmailVerificationController::class, 'send'])
            ->middleware('throttle:6,1');
    });
});

Route::middleware(['auth:sanctum', 'email.verified.profile', 'permission:student.dashboard.view'])
    ->get('/student/dashboard', [StudentDashboardController::class, 'index']);

Route::middleware(['auth:sanctum', 'email.verified.profile'])
    ->get('/student/curriculum', [StudentCurriculumApiController::class, 'mine']);

Route::middleware(['auth:sanctum'])->group(function (): void {
    Route::get('/academic-catalog/nam-hocs', [AcademicCatalogController::class, 'namHocs']);
    Route::get('/academic-catalog/hoc-kys', [AcademicCatalogController::class, 'hocKys']);
    Route::get('/academic-catalog/current-term', [AcademicCatalogController::class, 'currentTerm']);
    Route::get('/provinces', [ProvinceController::class, 'provinces']);
    Route::get('/provinces/with-districts', [ProvinceController::class, 'index']);
    Route::get('/districts', [ProvinceController::class, 'districts']);
});

Route::middleware(['auth:sanctum', 'permission:admin.academic-term.manage'])->group(function (): void {
    Route::get('/admin/academic-terms', [AcademicTermController::class, 'index']);
    Route::get('/admin/academic-terms/current', [AcademicTermController::class, 'current']);
    Route::post('/admin/academic-years', [AcademicTermController::class, 'storeAcademicYear']);
    Route::post('/admin/academic-terms/current', [AcademicTermController::class, 'switchCurrent']);
    Route::post('/admin/academic-terms/switch', [AcademicTermController::class, 'switchCurrent']);
    Route::put('/admin/academic-terms/{academicTerm}', [AcademicTermController::class, 'update']);
});

Route::middleware(['auth:sanctum'])->group(function (): void {
    Route::get('/curriculum-programs', [StudentCurriculumController::class, 'programs']);
    Route::get('/curriculum-programs/{chuongTrinhDaoTao}', [StudentCurriculumController::class, 'programDetail']);
    Route::get('/curriculum-versions', [StudentCurriculumController::class, 'versions']);
    Route::get('/curriculum-versions/{phienBanCtdt}', [StudentCurriculumController::class, 'versionDetail']);

    Route::get('/admin/accounts', [AdminAccountController::class, 'index']);
    Route::get('/admin/accounts/student-catalog', [AdminAccountController::class, 'studentCatalog']);
    Route::get('/admin/curriculum-programs', [StudentCurriculumController::class, 'programs']);
    Route::get('/admin/curriculum-programs/{chuongTrinhDaoTao}', [StudentCurriculumController::class, 'programDetail']);
    Route::get('/admin/curriculum-versions', [StudentCurriculumController::class, 'versions']);
    Route::get('/admin/curriculum-versions/{phienBanCtdt}', [StudentCurriculumController::class, 'versionDetail']);
    Route::get('/admin/students/{sinhVien}/curriculum', [StudentCurriculumController::class, 'show']);
    Route::post('/admin/students/{sinhVien}/curriculum', [StudentCurriculumController::class, 'store']);
    Route::post('/admin/accounts', [AdminAccountController::class, 'store']);
    Route::post('/admin/accounts/students', [AdminAccountController::class, 'storeStudent']);
    Route::post('/admin/accounts/lecturers', [AdminAccountController::class, 'storeLecturer']);
    Route::post('/admin/accounts/managers', [AdminAccountController::class, 'storeManager']);
    Route::post('/admin/accounts/training-officers', [AdminAccountController::class, 'storeTrainingOfficer']);
    Route::put('/admin/accounts/{user}', [AdminAccountController::class, 'update']);
    Route::post('/admin/accounts/{user}/reset-password', [AdminAccountController::class, 'resetPassword']);
    Route::post('/admin/accounts/{user}/lock', [AdminAccountController::class, 'lock']);
    Route::post('/admin/accounts/{user}/unlock', [AdminAccountController::class, 'unlock']);
    Route::post('/admin/accounts/{user}/upload-image', [AdminAccountController::class, 'uploadStudentImage']);

    Route::get('/admin/don-vis', [LopController::class, 'donVis']);
    Route::get('/admin/lops', [LopController::class, 'index']);
    Route::post('/admin/lops', [LopController::class, 'store']);
    Route::put('/admin/lops/{lop}', [LopController::class, 'update']);
    Route::post('/admin/lops/{lop}/toggle-status', [LopController::class, 'toggleStatus']);
    Route::delete('/admin/lops/{lop}', [LopController::class, 'destroy']);
});
