<?php

namespace App\Http\Controllers\Api\Admin\Classes;

use App\Http\Controllers\Controller;
use App\Models\DonVi;
use App\Models\Lop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LopController extends Controller
{
    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function index(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'don_vi_id' => ['sometimes', 'integer', 'exists:don_vis,id'],
            'q' => ['sometimes', 'string', 'max:100'],
        ]);

        $lops = Lop::query()
            ->with('donVi:id,ma_don_vi,ten_don_vi,loai_don_vi')
            ->when(isset($payload['don_vi_id']), fn ($query) => $query->where('don_vi_id', $payload['don_vi_id']))
            ->when(isset($payload['q']), function ($query) use ($payload): void {
                $keyword = trim((string) $payload['q']);

                if ($keyword !== '') {
                    $query->where(function ($subQuery) use ($keyword): void {
                        $subQuery
                            ->where('lop_hoc_phan', 'like', "%{$keyword}%")
                            ->orWhere('ten_hoc_phan', 'like', "%{$keyword}%")
                            ->orWhere('ten_giang_vien', 'like', "%{$keyword}%")
                            ->orWhere('ma_khoi', 'like', "%{$keyword}%")
                            ->orWhere('ma_don_vi', 'like', "%{$keyword}%")
                            ->orWhere('ten_don_vi', 'like', "%{$keyword}%");
                    });
                }
            })
            ->orderBy('ma_don_vi')
            ->orderBy('ma_khoi')
            ->get()
            ->map(fn (Lop $lop): array => $this->toPayload($lop))
            ->values();

        return $this->jsonResponse(['data' => $lops->all()]);
    }

    public function donVis(): JsonResponse
    {
        $donVis = DonVi::query()
            ->select(['id', 'ma_don_vi', 'ten_don_vi', 'loai_don_vi'])
            ->orderBy('ma_don_vi')
            ->get();

        return $this->jsonResponse(['data' => $donVis->all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'don_vi_id' => ['required', 'integer', 'exists:don_vis,id'],
            'lop_hoc_phan' => ['required', 'string', 'max:255'],
            'ten_hoc_phan' => ['nullable', 'string', 'max:255'],
            'ten_giang_vien' => ['nullable', 'string', 'max:255'],
            'mo_hinh_dao_tao' => ['nullable', 'string', 'max:100'],
            'ma_khoi' => ['required', 'string', 'max:100'],
            'ten_khoi' => ['nullable', 'string', 'max:255'],
        ]);

        $donVi = DonVi::query()->findOrFail($payload['don_vi_id']);

        $lop = Lop::query()->create([
            'don_vi_id' => $donVi->id,
            'lop_hoc_phan' => trim($payload['lop_hoc_phan']),
            'ten_hoc_phan' => trim($payload['ten_hoc_phan'] ?? '') ?: null,
            'ten_giang_vien' => trim($payload['ten_giang_vien'] ?? '') ?: null,
            'si_so' => 0,
            'mo_hinh_dao_tao' => trim($payload['mo_hinh_dao_tao'] ?? 'Tín chỉ') ?: 'Tín chỉ',
            'ma_khoi' => trim($payload['ma_khoi']),
            'ten_khoi' => trim($payload['ten_khoi'] ?? $payload['ma_khoi']),
            'ma_don_vi' => $donVi->ma_don_vi,
            'ten_don_vi' => $donVi->ten_don_vi,
            'trang_thai' => true,
        ]);

        return $this->jsonResponse([
            'message' => 'Đã tạo lớp thành công',
            'data' => $this->toPayload($lop->fresh('donVi')),
        ], 201);
    }

    public function update(Request $request, Lop $lop): JsonResponse
    {
        $payload = $request->validate([
            'don_vi_id' => ['required', 'integer', 'exists:don_vis,id'],
            'lop_hoc_phan' => ['required', 'string', 'max:255'],
            'ten_hoc_phan' => ['nullable', 'string', 'max:255'],
            'ten_giang_vien' => ['nullable', 'string', 'max:255'],
            'mo_hinh_dao_tao' => ['nullable', 'string', 'max:100'],
            'ma_khoi' => ['required', 'string', 'max:100'],
            'ten_khoi' => ['nullable', 'string', 'max:255'],
        ]);

        $donVi = DonVi::query()->findOrFail($payload['don_vi_id']);

        $lop->fill([
            'don_vi_id' => $donVi->id,
            'lop_hoc_phan' => trim($payload['lop_hoc_phan']),
            'ten_hoc_phan' => trim($payload['ten_hoc_phan'] ?? '') ?: null,
            'ten_giang_vien' => trim($payload['ten_giang_vien'] ?? '') ?: null,
            'ma_khoi' => trim($payload['ma_khoi']),
            'ten_khoi' => trim($payload['ten_khoi'] ?? $payload['ma_khoi']),
            'mo_hinh_dao_tao' => trim($payload['mo_hinh_dao_tao'] ?? $lop->mo_hinh_dao_tao ?: 'Tín chỉ'),
            'ma_don_vi' => $donVi->ma_don_vi,
            'ten_don_vi' => $donVi->ten_don_vi,
        ])->save();

        return $this->jsonResponse([
            'message' => 'Đã cập nhật lớp thành công',
            'data' => $this->toPayload($lop->fresh('donVi')),
        ]);
    }

    public function toggleStatus(Lop $lop): JsonResponse
    {
        $lop->forceFill(['trang_thai' => ! $lop->trang_thai])->save();

        return $this->jsonResponse([
            'message' => 'Đã cập nhật trạng thái lớp',
            'data' => $this->toPayload($lop->fresh('donVi')),
        ]);
    }

    public function destroy(Lop $lop): JsonResponse
    {
        $lop->delete();

        return $this->jsonResponse(['message' => 'Đã xóa lớp thành công']);
    }

    private function toPayload(Lop $lop): array
    {
        $lop->loadMissing('donVi:id,ma_don_vi,ten_don_vi,loai_don_vi');

        return [
            'id' => $lop->id,
            'don_vi_id' => $lop->don_vi_id,
            'lop_hoc_phan' => $lop->lop_hoc_phan,
            'ten_hoc_phan' => $lop->ten_hoc_phan,
            'ten_giang_vien' => $lop->ten_giang_vien,
            'si_so' => $lop->si_so,
            'mo_hinh_dao_tao' => $lop->mo_hinh_dao_tao,
            'ma_khoi' => $lop->ma_khoi,
            'ten_khoi' => $lop->ten_khoi,
            'ma_don_vi' => $lop->ma_don_vi,
            'ten_don_vi' => $lop->ten_don_vi,
            'trang_thai' => $lop->trang_thai,
            'don_vi' => $lop->donVi,
        ];
    }
}
