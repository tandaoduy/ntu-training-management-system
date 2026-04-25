<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\EmailVerificationController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
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