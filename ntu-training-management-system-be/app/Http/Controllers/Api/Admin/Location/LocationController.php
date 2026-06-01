<?php

namespace App\Http\Controllers\Api\Admin\Location;

use App\Http\Controllers\Controller;
use App\Services\Admin\LocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * Get all provinces
     * GET /api/admin/locations/provinces
     */
    public function getProvinces(Request $request): JsonResponse
    {
        $provinces = LocationService::getProvinces();
        
        return response()->json([
            'data' => $provinces,
            'total' => count($provinces),
        ]);
    }

    /**
     * Search provinces
     * GET /api/admin/locations/provinces/search?q=Ha%20Noi
     */
    public function searchProvinces(Request $request): JsonResponse
    {
        $search = $request->query('q', '');
        $provinces = LocationService::searchProvinces($search);
        
        return response()->json([
            'data' => $provinces,
            'total' => count($provinces),
        ]);
    }

    /**
     * Get single province with districts
     * GET /api/admin/locations/provinces/{code}
     */
    public function getProvince(int $code): JsonResponse
    {
        $province = LocationService::getProvince($code);
        
        if (!$province) {
            return response()->json([
                'message' => 'Tỉnh/thành phố không tìm thấy',
                'error' => 'NOT_FOUND',
            ], 404);
        }
        
        return response()->json(['data' => $province]);
    }

    /**
     * Get districts by province
     * GET /api/admin/locations/provinces/{provinceCode}/districts
     */
    public function getDistrictsByProvince(int $provinceCode): JsonResponse
    {
        $districts = LocationService::getDistricts($provinceCode);
        
        if (empty($districts)) {
            return response()->json([
                'message' => 'Không tìm thấy quận/huyện cho tỉnh này',
                'error' => 'NOT_FOUND',
            ], 404);
        }
        
        return response()->json([
            'data' => $districts,
            'total' => count($districts),
            'province_code' => $provinceCode,
        ]);
    }

    /**
     * Get single district
     * GET /api/admin/locations/districts/{code}
     */
    public function getDistrict(int $code): JsonResponse
    {
        $district = LocationService::getDistrict($code);
        
        if (!$district) {
            return response()->json([
                'message' => 'Quận/huyện không tìm thấy',
                'error' => 'NOT_FOUND',
            ], 404);
        }
        
        return response()->json(['data' => $district]);
    }

    /**
     * Get all wards
     * GET /api/admin/locations/wards
     * Query params:
     *   - province_code: int (optional, default 0 = all)
     *   - q: string (optional, search by name)
     */
    public function getWards(Request $request): JsonResponse
    {
        $provinceCode = (int) $request->query('province_code', 0);
        $search = $request->query('q', '');
        
        $wards = LocationService::getWards($provinceCode, $search);
        
        return response()->json([
            'data' => $wards,
            'total' => count($wards),
            'province_code' => $provinceCode !== 0 ? $provinceCode : null,
        ]);
    }

    /**
     * Get single ward
     * GET /api/admin/locations/wards/{code}
     */
    public function getWard(int $code): JsonResponse
    {
        $ward = LocationService::getWard($code);
        
        if (!$ward) {
            return response()->json([
                'message' => 'Xã/phường không tìm thấy',
                'error' => 'NOT_FOUND',
            ], 404);
        }
        
        return response()->json(['data' => $ward]);
    }

    /**
     * Lookup ward from legacy code (backward compatibility)
     * GET /api/admin/locations/wards/legacy?legacy_name=Xã%20Tân%20Hải&legacy_code=22855
     */
    public function lookupWardFromLegacy(Request $request): JsonResponse
    {
        $legacyName = $request->query('legacy_name', '');
        $legacyCode = (int) $request->query('legacy_code', 0);
        
        $results = LocationService::getWardFromLegacy($legacyName, $legacyCode);
        
        return response()->json([
            'data' => $results,
            'total' => count($results),
        ]);
    }
}
