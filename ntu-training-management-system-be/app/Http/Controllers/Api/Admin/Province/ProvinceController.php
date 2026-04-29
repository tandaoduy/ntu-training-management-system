<?php

namespace App\Http\Controllers\Api\Admin\Province;

use App\Http\Controllers\Controller;
use App\Models\District;
use App\Models\Province;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Collection;

class ProvinceController extends Controller
{
    private const VIETNAM_PROVINCES_API = 'https://open.routingapi.com/api/v2';
    private const PROVINCES_2025 = [
        '01' => 'Thành phố Hà Nội',
        '04' => 'Tỉnh Cao Bằng',
        '08' => 'Tỉnh Tuyên Quang',
        '11' => 'Tỉnh Điện Biên',
        '12' => 'Tỉnh Lai Châu',
        '14' => 'Tỉnh Sơn La',
        '15' => 'Tỉnh Lào Cai',
        '19' => 'Tỉnh Thái Nguyên',
        '20' => 'Tỉnh Lạng Sơn',
        '22' => 'Tỉnh Quảng Ninh',
        '24' => 'Tỉnh Bắc Ninh',
        '25' => 'Tỉnh Phú Thọ',
        '31' => 'Thành phố Hải Phòng',
        '33' => 'Tỉnh Hưng Yên',
        '37' => 'Tỉnh Ninh Bình',
        '38' => 'Tỉnh Thanh Hóa',
        '40' => 'Tỉnh Nghệ An',
        '42' => 'Tỉnh Hà Tĩnh',
        '44' => 'Tỉnh Quảng Trị',
        '46' => 'Thành phố Huế',
        '48' => 'Thành phố Đà Nẵng',
        '51' => 'Tỉnh Quảng Ngãi',
        '52' => 'Tỉnh Gia Lai',
        '56' => 'Tỉnh Khánh Hòa',
        '66' => 'Tỉnh Đắk Lắk',
        '68' => 'Tỉnh Lâm Đồng',
        '75' => 'Tỉnh Đồng Nai',
        '79' => 'Thành phố Hồ Chí Minh',
        '80' => 'Tỉnh Tây Ninh',
        '82' => 'Tỉnh Đồng Tháp',
        '86' => 'Tỉnh Vĩnh Long',
        '91' => 'Tỉnh An Giang',
        '92' => 'Thành phố Cần Thơ',
        '96' => 'Tỉnh Cà Mau',
    ];

    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function normalizeName(string $name): string
    {
        return mb_strtolower(trim($name));
    }

    private function normalizeProvinceCode(?string $code): ?string
    {
        if (!$code) {
            return null;
        }

        $normalized = ltrim($code, '0');

        if ($normalized === '') {
            return null;
        }

        return str_pad($normalized, 2, '0', STR_PAD_LEFT);
    }

    private function provinceCodeVariants(): array
    {
        $codes = [];

        foreach (array_keys(self::PROVINCES_2025) as $code) {
            $codes[] = $code;
            $codes[] = ltrim($code, '0') ?: $code;
        }

        return array_values(array_unique($codes));
    }

    /**
     * Pick the correct 2025 province row when legacy seed data contains duplicate/wrong codes.
     */
    private function provinces2025(bool $withDistricts = false): Collection
    {
        $query = Province::query()
            ->select(['id', 'name', 'code'])
            ->where(function ($query): void {
                $query
                    ->whereIn('code', $this->provinceCodeVariants())
                    ->orWhereIn('name', array_values(self::PROVINCES_2025));
            });

        if ($withDistricts) {
            $query->with('districts:id,province_id,name,code');
        }

        /** @var EloquentCollection<int, Province> $candidates */
        $candidates = $query->get();
        $ordered = collect();

        foreach (self::PROVINCES_2025 as $code => $name) {
            $normalizedName = $this->normalizeName($name);
            $unpaddedCode = ltrim($code, '0') ?: $code;

            $province = $candidates->first(
                fn (Province $candidate): bool => $this->normalizeName($candidate->name) === $normalizedName,
            ) ?? $candidates->first(
                fn (Province $candidate): bool => in_array((string) $candidate->code, [$code, $unpaddedCode], true),
            );

            if (!$province) {
                $province = Province::create([
                    'name' => $name,
                    'code' => $code,
                ]);
            }

            $province->name = $name;
            $province->code = $code;
            $province->save();
            $ordered->push($province);
        }

        return $ordered;
    }

    private function shouldRefreshWardCache(Province $province): bool
    {
        $wardCount = $province->districts()->count();
        $provinceCode = $this->normalizeProvinceCode((string) $province->code);
        $newProvinceName = $provinceCode ? (self::PROVINCES_2025[$provinceCode] ?? null) : null;
        $firstWardName = $province->districts()
            ->orderBy('name')
            ->value('name');

        if ($wardCount === 0) {
            return true;
        }

        if ($provinceCode === '56' && $wardCount < 50) {
            return true;
        }

        if ($newProvinceName && $this->normalizeName($province->name) !== $this->normalizeName($newProvinceName)) {
            return true;
        }

        if (is_string($firstWardName) && !preg_match('/^(Xã|Phường|Đặc khu)\s/u', $firstWardName)) {
            return true;
        }

        return false;
    }

    private function provinceFromRequest(array $payload): Province
    {
        $code = $this->normalizeProvinceCode($payload['province_code'] ?? null);

        if ($code && isset(self::PROVINCES_2025[$code])) {
            $name = self::PROVINCES_2025[$code];
            $normalizedName = $this->normalizeName($name);
            $unpaddedCode = ltrim($code, '0') ?: $code;

            $province = Province::query()
                ->where('name', $name)
                ->orWhere(function ($query) use ($code, $unpaddedCode, $normalizedName): void {
                    $query
                        ->whereIn('code', [$code, $unpaddedCode])
                        ->whereRaw('LOWER(name) = ?', [$normalizedName]);
                })
                ->first();

            if (!$province) {
                $province = Province::create([
                    'name' => $name,
                    'code' => $code,
                ]);
            }

            $province->name = $name;
            $province->code = $code;
            $province->save();

            return $province;
        }

        return Province::query()
            ->select(['id', 'name', 'code'])
            ->findOrFail((int) $payload['province_id']);
    }

    private function refreshWardCache(Province $province): bool
    {
        if (!$province->code) {
            return false;
        }

        $apiCode = ltrim((string) $province->code, '0') ?: (string) $province->code;
        $response = Http::timeout(30)->get(
            self::VIETNAM_PROVINCES_API . "/p/{$apiCode}",
            ['depth' => 2],
        );

        if (!$response->successful()) {
            return false;
        }

        $provinceData = $response->json();
        $wards = $provinceData['wards'] ?? [];

        if (!is_array($wards) || count($wards) === 0) {
            return false;
        }

        District::query()
            ->where('province_id', $province->id)
            ->delete();

        foreach ($wards as $wardData) {
            District::create([
                'province_id' => $province->id,
                'name' => $wardData['name'],
                'code' => $wardData['code'] ?? null,
            ]);
        }

        return true;
    }

    /**
     * Get all provinces with their ward-level divisions.
     */
    public function index(): JsonResponse
    {
        $provinces = $this->provinces2025(withDistricts: true);

        return $this->jsonResponse([
            'data' => $provinces,
        ]);
    }

    /**
     * Get provinces only.
     */
    public function provinces(): JsonResponse
    {
        $provinces = $this->provinces2025();

        return $this->jsonResponse([
            'data' => $provinces,
        ]);
    }

    /**
     * Get ward-level divisions by province.
     */
    public function districts(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'province_id' => ['nullable', 'integer', 'exists:provinces,id'],
            'province_code' => ['nullable', 'string'],
            'province_name' => ['nullable', 'string'],
        ]);

        $province = $this->provinceFromRequest($payload);

        if ($this->shouldRefreshWardCache($province)) {
            $this->refreshWardCache($province);
        }

        $districts = District::query()
            ->select(['id', 'province_id', 'name', 'code'])
            ->where('province_id', $province->id)
            ->orderBy('name')
            ->get();

        $provinceCode = $this->normalizeProvinceCode((string) $province->code);

        if ($districts->isEmpty() && $provinceCode && isset(self::PROVINCES_2025[$provinceCode])) {
            return $this->jsonResponse([
                'message' => 'Chưa đồng bộ được xã/phường/đặc khu từ OpenAPI. Vui lòng kiểm tra kết nối mạng của backend hoặc chạy lại seeder.',
                'data' => [],
            ], 502);
        }

        return $this->jsonResponse([
            'data' => $districts,
        ]);
    }
}
