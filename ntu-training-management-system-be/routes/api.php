<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\EmailVerificationController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\Admin\Account\AdminAccountController;
use App\Http\Controllers\Api\Admin\AcademicTerm\AcademicTermController;
use App\Http\Controllers\Api\Admin\Backup\AdminBackupController;
use App\Http\Controllers\Api\Admin\Classes\LopController;
use App\Http\Controllers\Api\Admin\Curriculum\StudentCurriculumController;
use App\Http\Controllers\Api\Admin\GradeEntry\GradeInputPeriodController;
use App\Http\Controllers\Api\Admin\Permission\AdminPermissionController;
use App\Http\Controllers\Api\AcademicCatalogController;
use App\Http\Controllers\Api\Admin\Province\ProvinceController;
use App\Http\Controllers\Api\Grades\GradeViewController;
use App\Http\Controllers\Api\Student\Curriculum\StudentCurriculumController as StudentCurriculumApiController;
use App\Http\Controllers\Api\StudentDashboardController;
use App\Http\Controllers\Api\StudyPlanRegistrationController;
use App\Http\Controllers\Api\CourseRegistrationController;
use App\Http\Controllers\Api\Lecturer\GradeEntry\GradeEntryController;
use App\Http\Controllers\Api\Lecturer\Timetable\LecturerTimetableController;
use App\Http\Controllers\Api\TrainingOfficer\TimetableController;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json([
        'message' => 'Backend OK'
    ]);
});

Route::get('/student-images/{path}', function (string $path) {
    abort_if(str_contains($path, '..') || ! Storage::disk('public')->exists($path), 404);

    return response()->file(Storage::disk('public')->path($path));
})->where('path', '.*');

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
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
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/extend-session', [AuthController::class, 'extendSession']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::get('/email/verification-status', [EmailVerificationController::class, 'status']);
        Route::post('/email/verification-notification', [EmailVerificationController::class, 'send'])
            ->middleware('throttle:6,1');
    });
});

Route::middleware(['auth:sanctum', 'student.role'])
    ->get('/student/dashboard', [StudentDashboardController::class, 'index'])
    ->middleware('permission:student.dashboard.view');

Route::middleware(['auth:sanctum', 'student.role'])
    ->put('/student/profile', [StudentDashboardController::class, 'updateProfile'])
    ->middleware('permission:student.profile.edit');

Route::middleware(['auth:sanctum', 'student.role'])
    ->get('/student/curriculum', [StudentCurriculumApiController::class, 'mine'])
    ->middleware('permission:student.curriculum.view');

Route::middleware(['auth:sanctum', 'student.role'])->group(function (): void {
    Route::get('/student/study-plan-registration', [StudyPlanRegistrationController::class, 'studentStatus'])->middleware('permission:student.study-plan.view');
    Route::post('/student/study-plan-registration', [StudyPlanRegistrationController::class, 'submitStudentPlan'])->middleware('permission:student.study-plan.edit');
    Route::get('/student/course-registration', [CourseRegistrationController::class, 'studentStatus'])->middleware('permission:student.course-registration.view');
    Route::get('/student/course-registration/classes/{lopHocPhanDangKy}/timetable', [CourseRegistrationController::class, 'studentClassTimetable'])->middleware('permission:student.course-registration.view');
    Route::post('/student/course-registration', [CourseRegistrationController::class, 'register'])->middleware('permission:student.course-registration.edit');
    Route::post('/student/course-registration/{dangKyHocPhan}/confirm', [CourseRegistrationController::class, 'confirm'])->middleware('permission:student.course-registration.edit');
    Route::put('/student/course-registration/{dangKyHocPhan}/change-class', [CourseRegistrationController::class, 'changeClass'])->middleware('permission:student.course-registration.edit');
    Route::delete('/student/course-registration/{dangKyHocPhan}', [CourseRegistrationController::class, 'cancel'])->middleware('permission:student.course-registration.edit');
    Route::get('/student/grades', [GradeViewController::class, 'student'])->middleware('permission:student.grades.view');
});

Route::middleware(['auth:sanctum', 'permission:lecturer.grade-entry.manage'])->prefix('lecturer/grade-entry')->group(function (): void {
    Route::get('/periods', [GradeEntryController::class, 'periods']);
    Route::get('/classes', [GradeEntryController::class, 'classes']);
    Route::get('/classes/{lopHocPhanDangKy}', [GradeEntryController::class, 'showClass']);
    Route::put('/classes/{lopHocPhanDangKy}/weights', [GradeEntryController::class, 'saveWeights']);
    Route::put('/classes/{lopHocPhanDangKy}/grades', [GradeEntryController::class, 'saveGrades']);
});

Route::middleware(['auth:sanctum', 'permission:lecturer.timetable.view'])->prefix('lecturer')->group(function (): void {
    Route::get('/timetable', [LecturerTimetableController::class, 'index']);
});

Route::middleware(['auth:sanctum'])->group(function (): void {
    Route::get('/academic-catalog/nam-hocs', [AcademicCatalogController::class, 'namHocs']);
    Route::get('/academic-catalog/hoc-kys', [AcademicCatalogController::class, 'hocKys']);
    Route::get('/academic-catalog/hoc-phans', [AcademicCatalogController::class, 'hocPhans']);
    Route::get('/academic-catalog/current-term', [AcademicCatalogController::class, 'currentTerm']);
    Route::get('/provinces', [ProvinceController::class, 'provinces']);
    Route::get('/provinces/with-districts', [ProvinceController::class, 'index']);
    Route::get('/districts', [ProvinceController::class, 'districts']);
});

Route::middleware(['auth:sanctum', 'permission:admin.config.manage'])->group(function (): void {
    Route::get('/admin/academic-terms', [AcademicTermController::class, 'index']);
    Route::get('/admin/academic-terms/current', [AcademicTermController::class, 'current']);
    Route::get('/admin/student-profile-edit-window', [AcademicTermController::class, 'profileEditWindow']);
    Route::post('/admin/student-profile-edit-window', [AcademicTermController::class, 'saveProfileEditWindow']);
    Route::post('/admin/academic-years', [AcademicTermController::class, 'storeAcademicYear']);
    Route::post('/admin/academic-terms/current', [AcademicTermController::class, 'switchCurrent']);
    Route::post('/admin/academic-terms/switch', [AcademicTermController::class, 'switchCurrent']);
    Route::put('/admin/academic-terms/{academicTerm}', [AcademicTermController::class, 'update']);
});

Route::middleware(['auth:sanctum'])->group(function (): void {
    Route::middleware('permission:student.curriculum.view|lecturer.curriculum.view|manager.curriculum.view|training_officer.curriculum.view|admin.curriculum.manage')->group(function (): void {
        Route::get('/curriculum-programs', [StudentCurriculumController::class, 'programs']);
        Route::get('/curriculum-programs/{chuongTrinhDaoTao}', [StudentCurriculumController::class, 'programDetail']);
        Route::get('/curriculum-versions', [StudentCurriculumController::class, 'versions']);
        Route::get('/curriculum-versions/{phienBanCtdt}', [StudentCurriculumController::class, 'versionDetail']);
    });

    Route::get('/admin/permissions', [AdminPermissionController::class, 'index'])->middleware('permission:admin.permission.manage');
    Route::put('/admin/permissions/roles/{role}', [AdminPermissionController::class, 'sync'])->middleware('permission:admin.permission.manage');

    Route::middleware('permission:admin.backup.manage')->group(function (): void {
        Route::get('/admin/backups', [AdminBackupController::class, 'index']);
        Route::post('/admin/backups', [AdminBackupController::class, 'store']);
        Route::post('/admin/backups/upload', [AdminBackupController::class, 'upload']);
        Route::post('/admin/backups/{file}/restore', [AdminBackupController::class, 'restore']);
        Route::get('/admin/backups/{file}/download', [AdminBackupController::class, 'download']);
        Route::delete('/admin/backups/{file}', [AdminBackupController::class, 'destroy']);
    });

    Route::middleware('permission:admin.account.manage|manager.student-info.view|training_officer.student-info.manage')->group(function (): void {
        Route::get('/admin/accounts', [AdminAccountController::class, 'index']);
        Route::get('/admin/accounts/student-catalog', [AdminAccountController::class, 'studentCatalog']);
    });

    Route::middleware('permission:admin.account.manage')->group(function (): void {
        Route::post('/admin/accounts', [AdminAccountController::class, 'store']);
        Route::post('/admin/accounts/students', [AdminAccountController::class, 'storeStudent']);
        Route::post('/admin/accounts/lecturers', [AdminAccountController::class, 'storeLecturer']);
        Route::post('/admin/accounts/managers', [AdminAccountController::class, 'storeManager']);
        Route::post('/admin/accounts/training-officers', [AdminAccountController::class, 'storeTrainingOfficer']);
        Route::put('/admin/accounts/{user}', [AdminAccountController::class, 'update']);
        Route::post('/admin/accounts/{user}/reset-password', [AdminAccountController::class, 'resetPassword']);
        Route::post('/admin/accounts/{user}/lock', [AdminAccountController::class, 'lock']);
        Route::post('/admin/accounts/{user}/unlock', [AdminAccountController::class, 'unlock']);
        Route::delete('/admin/accounts/{user}', [AdminAccountController::class, 'destroy']);
        Route::post('/admin/accounts/{user}/upload-image', [AdminAccountController::class, 'uploadStudentImage']);
    });

    Route::middleware('permission:admin.curriculum.manage')->group(function (): void {
        Route::get('/admin/curriculum-programs', [StudentCurriculumController::class, 'programs']);
        Route::get('/admin/curriculum-programs/{chuongTrinhDaoTao}', [StudentCurriculumController::class, 'programDetail']);
        Route::get('/admin/curriculum-versions', [StudentCurriculumController::class, 'versions']);
        Route::get('/admin/curriculum-versions/{phienBanCtdt}', [StudentCurriculumController::class, 'versionDetail']);
        Route::get('/admin/students/{sinhVien}/curriculum', [StudentCurriculumController::class, 'show']);
        Route::post('/admin/students/{sinhVien}/curriculum', [StudentCurriculumController::class, 'store']);
    });

    Route::get('/admin/study-plan-registration-periods', [StudyPlanRegistrationController::class, 'index'])->middleware('permission:admin.study-plan.manage');
    Route::post('/admin/study-plan-registration-periods', [StudyPlanRegistrationController::class, 'store'])->middleware('permission:admin.study-plan.manage');
    Route::get('/admin/course-registration-periods', [CourseRegistrationController::class, 'periods'])->middleware('permission:admin.course-registration.manage');
    Route::post('/admin/course-registration-periods', [CourseRegistrationController::class, 'storePeriod'])->middleware('permission:admin.course-registration.manage');
    Route::middleware('permission:admin.room.manage')->group(function (): void {
        Route::get('/admin/timetable-management/catalogs', [TimetableController::class, 'catalogs']);
        Route::post('/admin/timetable-management/week-configs', [TimetableController::class, 'saveWeekConfig']);
        Route::post('/admin/timetable-management/buildings', [TimetableController::class, 'storeBuilding']);
        Route::put('/admin/timetable-management/buildings/{giangDuong}', [TimetableController::class, 'updateBuilding']);
        Route::delete('/admin/timetable-management/buildings/{giangDuong}', [TimetableController::class, 'deleteBuilding']);
        Route::post('/admin/timetable-management/rooms', [TimetableController::class, 'storeRoom']);
        Route::put('/admin/timetable-management/rooms/{phongHoc}', [TimetableController::class, 'updateRoom']);
        Route::delete('/admin/timetable-management/rooms/{phongHoc}', [TimetableController::class, 'deleteRoom']);
    });

    Route::get('/training-officer/study-plan-statistics', [StudyPlanRegistrationController::class, 'statistics'])->middleware('permission:training_officer.study-plan-statistics.view');
    Route::get('/training-officer/study-plan-statistics/courses/{hocPhan}/students', [StudyPlanRegistrationController::class, 'courseRegistrations'])->middleware('permission:training_officer.study-plan-statistics.view');
    Route::middleware('permission:training_officer.timetable.manage')->group(function (): void {
        Route::get('/training-officer/timetable', [TimetableController::class, 'index']);
        Route::post('/training-officer/timetable', [TimetableController::class, 'store']);
        Route::put('/training-officer/timetable/{thoiKhoaBieu}', [TimetableController::class, 'update']);
        Route::delete('/training-officer/timetable/{thoiKhoaBieu}', [TimetableController::class, 'destroy']);
        Route::get('/training-officer/timetable/catalogs', [TimetableController::class, 'catalogs']);
        Route::post('/training-officer/timetable/class-sections', [TimetableController::class, 'storeClassSection']);
        Route::post('/training-officer/timetable/break-weeks', [TimetableController::class, 'saveBreakWeeks']);
    });
    Route::middleware('permission:training_officer.course-registration.manage')->group(function (): void {
        Route::get('/training-officer/course-registration/classes', [CourseRegistrationController::class, 'officerClasses']);
        Route::get('/training-officer/course-registration/classes/{lopHocPhanDangKy}', [CourseRegistrationController::class, 'classDetail']);
        Route::put('/training-officer/course-registration/classes/{lopHocPhanDangKy}', [CourseRegistrationController::class, 'updateClass']);
        Route::delete('/training-officer/course-registration/classes/{lopHocPhanDangKy}', [CourseRegistrationController::class, 'deleteClass']);
        Route::post('/training-officer/course-registration/classes/{lopHocPhanDangKy}/students', [CourseRegistrationController::class, 'addStudentToClass']);
    });
    Route::get('/training-officer/grades', [GradeViewController::class, 'trainingOfficer'])->middleware('permission:training_officer.grades.view');
    Route::get('/training-officer/grades/students/{code}', [GradeViewController::class, 'trainingOfficerStudent'])->middleware('permission:training_officer.grades.view');
    Route::put('/training-officer/grades/registrations/{dangKyHocPhan}', [GradeViewController::class, 'updateByTrainingOfficer'])->middleware('permission:training_officer.grades.edit');
    Route::post('/training-officer/grades/students/{code}/completed-courses', [GradeViewController::class, 'addCompletedCourse'])->middleware('permission:training_officer.grades.edit');
    Route::get('/manager/grades', [GradeViewController::class, 'manager'])->middleware('permission:manager.grades.view');
    Route::get('/manager/grades/students/{code}', [GradeViewController::class, 'managerStudent'])->middleware('permission:manager.grades.view');
    Route::put('/training-officer/students/{user}/academic-info', [AdminAccountController::class, 'updateStudentAcademicInfo'])->middleware('permission:training_officer.student-info.manage');

    Route::get('/admin/grade-input-periods', [GradeInputPeriodController::class, 'index'])->middleware('permission:admin.grade-entry.lock.manage');
    Route::post('/admin/grade-input-periods', [GradeInputPeriodController::class, 'store'])->middleware('permission:admin.grade-entry.lock.manage');
    Route::put('/admin/grade-input-periods/{gradeInputPeriod}', [GradeInputPeriodController::class, 'update'])->middleware('permission:admin.grade-entry.lock.manage');
    Route::delete('/admin/grade-input-periods/{gradeInputPeriod}', [GradeInputPeriodController::class, 'destroy'])->middleware('permission:admin.grade-entry.lock.manage');

    Route::middleware('permission:admin.class.manage')->group(function (): void {
        Route::get('/admin/don-vis', [LopController::class, 'donVis']);
        Route::get('/admin/lops', [LopController::class, 'index']);
        Route::post('/admin/lops', [LopController::class, 'store']);
        Route::put('/admin/lops/{lop}', [LopController::class, 'update']);
        Route::post('/admin/lops/{lop}/toggle-status', [LopController::class, 'toggleStatus']);
        Route::delete('/admin/lops/{lop}', [LopController::class, 'destroy']);
    });
});
