<?php

namespace App\Http\Controllers\Api\Admin\Permission;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class AdminPermissionController extends Controller
{
    public function index(): JsonResponse
    {
        $permissions = Permission::query()
            ->whereIn('module', ['training_officer', 'manager', 'lecturer', 'student'])
            ->orderBy('module')
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'module', 'description'])
            ->groupBy('module')
            ->map(fn ($items) => $items->values())
            ->toArray();

        $roles = Role::query()
            ->with(['permissions:id,code'])
            ->whereIn('code', ['training_officer', 'manager', 'lecturer', 'student'])
            ->orderByRaw("case code when 'training_officer' then 1 when 'manager' then 2 when 'lecturer' then 3 when 'student' then 4 else 9 end")
            ->get()
            ->map(fn (Role $role): array => [
                'id' => $role->id,
                'code' => $role->code,
                'name' => $role->name,
                'description' => $role->description,
                'permissions' => $role->permissions->pluck('code')->values()->all(),
            ])
            ->values();

        return response()->json([
            'data' => [
                'roles' => $roles,
                'permissions' => $permissions,
                'locked' => [],
            ],
        ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function sync(Request $request, Role $role): JsonResponse
    {
        $payload = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'code')],
        ]);

        abort_if($role->code === 'admin', 422, 'Không phân quyền động cho quản trị viên.');

        $permissionCodes = collect($payload['permissions'])
            ->map(fn ($code) => trim((string) $code))
            ->filter()
            ->filter(fn (string $code) => str_starts_with($code, $role->code . '.'))
            ->unique()
            ->values();

        $permissionIds = Permission::query()
            ->whereIn('code', $permissionCodes)
            ->pluck('id')
            ->all();

        $role->permissions()->sync($permissionIds);
        Cache::forget(sprintf('role_permissions:%d', $role->id));

        $role->load('permissions:id,code');

        return response()->json([
            'message' => 'Đã cập nhật phân quyền.',
            'data' => [
                'role' => [
                    'id' => $role->id,
                    'code' => $role->code,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('code')->values()->all(),
                ],
            ],
        ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
