<?php

namespace App\Services\Admin;

/**
 * Mock service for Vietnam administrative locations (provinces, districts, wards)
 * This service provides structured data matching the openapi.json schema
 */
class LocationService
{
    /**
     * List of Vietnamese provinces with their codes
     */
    private static array $provinces = [
        ['code' => 1, 'name' => 'Thành phố Hà Nội', 'codename' => 'ha_noi', 'phone_code' => 24],
        ['code' => 4, 'name' => 'Tỉnh Hải Phòng', 'codename' => 'hai_phong', 'phone_code' => 31],
        ['code' => 8, 'name' => 'Tỉnh Quảng Ninh', 'codename' => 'quang_ninh', 'phone_code' => 33],
        ['code' => 11, 'name' => 'Tỉnh Bắc Kạn', 'codename' => 'bac_kan', 'phone_code' => 206],
        ['code' => 12, 'name' => 'Tỉnh Cao Bằng', 'codename' => 'cao_bang', 'phone_code' => 206],
        ['code' => 14, 'name' => 'Tỉnh Tuyên Quang', 'codename' => 'tuyen_quang', 'phone_code' => 207],
        ['code' => 15, 'name' => 'Tỉnh Lạng Sơn', 'codename' => 'lang_son', 'phone_code' => 205],
        ['code' => 19, 'name' => 'Tỉnh Hòa Bình', 'codename' => 'hoa_binh', 'phone_code' => 218],
        ['code' => 20, 'name' => 'Tỉnh Yên Bái', 'codename' => 'yen_bai', 'phone_code' => 214],
        ['code' => 22, 'name' => 'Tỉnh Thái Nguyên', 'codename' => 'thai_nguyen', 'phone_code' => 208],
        ['code' => 24, 'name' => 'Tỉnh Phú Thọ', 'codename' => 'phu_tho', 'phone_code' => 210],
        ['code' => 25, 'name' => 'Tỉnh Vĩnh Phúc', 'codename' => 'vinh_phuc', 'phone_code' => 211],
        ['code' => 31, 'name' => 'Tỉnh Hải Dương', 'codename' => 'hai_duong', 'phone_code' => 320],
        ['code' => 33, 'name' => 'Tỉnh Hưng Yên', 'codename' => 'hung_yen', 'phone_code' => 321],
        ['code' => 37, 'name' => 'Tỉnh Thái Bình', 'codename' => 'thai_binh', 'phone_code' => 36],
        ['code' => 38, 'name' => 'Tỉnh Nam Định', 'codename' => 'nam_dinh', 'phone_code' => 350],
        ['code' => 40, 'name' => 'Tỉnh Ninh Bình', 'codename' => 'ninh_binh', 'phone_code' => 30],
        ['code' => 42, 'name' => 'Tỉnh Thanh Hóa', 'codename' => 'thanh_hoa', 'phone_code' => 37],
        ['code' => 44, 'name' => 'Tỉnh Nghệ An', 'codename' => 'nghe_an', 'phone_code' => 38],
        ['code' => 46, 'name' => 'Tỉnh Hà Tĩnh', 'codename' => 'ha_tinh', 'phone_code' => 39],
        ['code' => 48, 'name' => 'Tỉnh Quảng Bình', 'codename' => 'quang_binh', 'phone_code' => 52],
        ['code' => 51, 'name' => 'Tỉnh Quảng Trị', 'codename' => 'quang_tri', 'phone_code' => 53],
        ['code' => 52, 'name' => 'Tỉnh Thừa Thiên Huế', 'codename' => 'thua_thien_hue', 'phone_code' => 54],
        ['code' => 56, 'name' => 'Thành phố Đà Nẵng', 'codename' => 'da_nang', 'phone_code' => 236],
        ['code' => 66, 'name' => 'Tỉnh Quảng Nam', 'codename' => 'quang_nam', 'phone_code' => 510],
        ['code' => 68, 'name' => 'Tỉnh Quảng Ngãi', 'codename' => 'quang_ngai', 'phone_code' => 55],
        ['code' => 75, 'name' => 'Tỉnh Bình Định', 'codename' => 'binh_dinh', 'phone_code' => 56],
        ['code' => 79, 'name' => 'Tỉnh Khánh Hòa', 'codename' => 'khanh_hoa', 'phone_code' => 58],
        ['code' => 80, 'name' => 'Tỉnh Phú Yên', 'codename' => 'phu_yen', 'phone_code' => 57],
        ['code' => 82, 'name' => 'Tỉnh Gia Lai', 'codename' => 'gia_lai', 'phone_code' => 269],
        ['code' => 86, 'name' => 'Tỉnh Đắk Lắk', 'codename' => 'dak_lak', 'phone_code' => 262],
        ['code' => 91, 'name' => 'Tỉnh Đắk Nông', 'codename' => 'dak_nong', 'phone_code' => 261],
        ['code' => 92, 'name' => 'Tỉnh Lâm Đồng', 'codename' => 'lam_dong', 'phone_code' => 263],
        ['code' => 96, 'name' => 'Tỉnh Bình Thuận', 'codename' => 'binh_thuan', 'phone_code' => 252],
    ];

    /**
     * Districts/Wards data - organized by province code
     */
    private static array $districts = [
        // Khánh Hòa (79)
        79 => [
            ['code' => 1574, 'name' => 'Thành phố Nha Trang', 'codename' => 'thanh_pho_nha_trang', 'type' => 'thành phố'],
            ['code' => 1575, 'name' => 'Thị xã Cam Ranh', 'codename' => 'thi_xa_cam_ranh', 'type' => 'thị xã'],
            ['code' => 1576, 'name' => 'Huyện Khánh Sơn', 'codename' => 'huyen_khanh_son', 'type' => 'huyện'],
            ['code' => 1577, 'name' => 'Huyện Vạn Ninh', 'codename' => 'huyen_van_ninh', 'type' => 'huyện'],
            ['code' => 1578, 'name' => 'Huyện Cam Lâm', 'codename' => 'huyen_cam_lam', 'type' => 'huyện'],
            ['code' => 1579, 'name' => 'Huyện Ninh Hòa', 'codename' => 'huyen_ninh_hoa', 'type' => 'huyện'],
        ],
        // Hà Nội (1)
        1 => [
            ['code' => 1, 'name' => 'Quận Ba Đình', 'codename' => 'quan_ba_dinh', 'type' => 'quận'],
            ['code' => 2, 'name' => 'Quận Hoàn Kiếm', 'codename' => 'quan_hoan_kiem', 'type' => 'quận'],
            ['code' => 3, 'name' => 'Quận Tây Hồ', 'codename' => 'quan_tay_ho', 'type' => 'quận'],
            ['code' => 4, 'name' => 'Quận Cầu Giấy', 'codename' => 'quan_cau_giay', 'type' => 'quận'],
            ['code' => 5, 'name' => 'Quận Đống Đa', 'codename' => 'quan_dong_da', 'type' => 'quận'],
            ['code' => 6, 'name' => 'Quận Hai Bà Trưng', 'codename' => 'quan_hai_ba_trung', 'type' => 'quận'],
            ['code' => 7, 'name' => 'Quận Hoàng Mai', 'codename' => 'quan_hoang_mai', 'type' => 'quận'],
            ['code' => 8, 'name' => 'Quận Long Biên', 'codename' => 'quan_long_bien', 'type' => 'quận'],
        ],
    ];

    /**
     * Wards data - organized by district code
     */
    private static array $wards = [
        // Nha Trang (1574)
        1574 => [
            ['code' => 26560, 'name' => 'Phường Bà Rịa', 'codename' => 'phuong_ba_ria', 'type' => 'phường'],
            ['code' => 26561, 'name' => 'Phường Xương Huân', 'codename' => 'phuong_xuong_huan', 'type' => 'phường'],
            ['code' => 26562, 'name' => 'Phường Phước Tài', 'codename' => 'phuong_phuoc_tai', 'type' => 'phường'],
            ['code' => 26563, 'name' => 'Phường Tứ Kỳ', 'codename' => 'phuong_tu_ky', 'type' => 'phường'],
            ['code' => 26564, 'name' => 'Phường Thống Nhất', 'codename' => 'phuong_thong_nhat', 'type' => 'phường'],
        ],
        // Ba Đình (1)
        1 => [
            ['code' => 101, 'name' => 'Phường Phúc Tân', 'codename' => 'phuong_phuc_tan', 'type' => 'phường'],
            ['code' => 102, 'name' => 'Phường Quảng An', 'codename' => 'phuong_quang_an', 'type' => 'phường'],
            ['code' => 103, 'name' => 'Phường Trúc Bạch', 'codename' => 'phuong_truc_bach', 'type' => 'phường'],
        ],
    ];

    /**
     * Get all provinces
     */
    public static function getProvinces(): array
    {
        return array_map(fn ($province) => array_merge(
            $province,
            ['division_type' => 'tỉnh', 'wards' => []]
        ), self::$provinces);
    }

    /**
     * Get single province with its districts
     */
    public static function getProvince(int $code): ?array
    {
        $province = collect(self::$provinces)->firstWhere('code', $code);
        
        if (!$province) {
            return null;
        }

        $wards = self::$districts[$code] ?? [];
        
        return array_merge(
            $province,
            ['division_type' => 'tỉnh', 'wards' => $wards]
        );
    }

    /**
     * Search provinces by name or codename
     */
    public static function searchProvinces(string $search): array
    {
        $search = strtolower(trim($search));
        
        return collect(self::$provinces)
            ->filter(fn ($province) => 
                str_contains(strtolower($province['name']), $search) ||
                str_contains(strtolower($province['codename']), $search)
            )
            ->map(fn ($province) => array_merge(
                $province,
                ['division_type' => 'tỉnh', 'wards' => []]
            ))
            ->values()
            ->toArray();
    }

    /**
     * Get districts by province code
     */
    public static function getDistricts(int $provinceCode): array
    {
        return self::$districts[$provinceCode] ?? [];
    }

    /**
     * Get single district with its wards
     */
    public static function getDistrict(int $code): ?array
    {
        foreach (self::$districts as $provinceCode => $districts) {
            $district = collect($districts)->firstWhere('code', $code);
            if ($district) {
                $wards = self::$wards[$code] ?? [];
                return array_merge($district, ['wards' => $wards, 'province_code' => $provinceCode]);
            }
        }
        
        return null;
    }

    /**
     * Get all wards
     */
    public static function getWards(int $provinceCode = 0, string $search = ''): array
    {
        $allWards = [];
        
        if ($provinceCode === 0) {
            // Return all wards
            foreach (self::$wards as $wards) {
                $allWards = array_merge($allWards, $wards);
            }
        } else {
            // Return wards from districts in the province
            if (isset(self::$districts[$provinceCode])) {
                foreach (self::$districts[$provinceCode] as $district) {
                    if (isset(self::$wards[$district['code']])) {
                        $allWards = array_merge($allWards, self::$wards[$district['code']]);
                    }
                }
            }
        }

        // Filter by search term if provided
        if (!empty($search)) {
            $search = strtolower(trim($search));
            $allWards = collect($allWards)
                ->filter(fn ($ward) => 
                    str_contains(strtolower($ward['name']), $search) ||
                    str_contains(strtolower($ward['codename']), $search)
                )
                ->values()
                ->toArray();
        }

        return $allWards;
    }

    /**
     * Get single ward
     */
    public static function getWard(int $code): ?array
    {
        foreach (self::$wards as $wards) {
            $ward = collect($wards)->firstWhere('code', $code);
            if ($ward) {
                return array_merge($ward, ['province_code' => 79]); // Default to Khánh Hòa
            }
        }
        
        return null;
    }

    /**
     * Get ward by legacy code (for backward compatibility)
     */
    public static function getWardFromLegacy(string $legacyName = '', int $legacyCode = 0): array
    {
        // This is a mock implementation for backward compatibility
        // In real implementation, you would query a migration mapping table
        $results = [];
        
        if (!empty($legacyName)) {
            foreach (self::$wards as $wards) {
                $found = collect($wards)->firstWhere('name', $legacyName);
                if ($found) {
                    $results[] = [
                        'source_code' => $legacyCode ?: $found['code'],
                        'ward' => array_merge($found, ['province_code' => 79]),
                    ];
                }
            }
        }
        
        return $results;
    }
}
