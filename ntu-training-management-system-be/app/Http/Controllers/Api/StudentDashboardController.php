<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()?->loadMissing(['student']);

        return response()->json([
            'message' => 'Student dashboard data',
            'student' => $user?->student,
            'permissions' => $user?->permissionCodes()->values() ?? [],
        ]);
    }
}
