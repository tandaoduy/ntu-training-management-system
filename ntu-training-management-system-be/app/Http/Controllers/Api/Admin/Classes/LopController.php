<?php

namespace App\Http\Controllers\Api\Admin\Classes;

use App\Http\Controllers\Controller;
use App\Models\DonVi;
use App\Models\Lop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

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
                    $query->where(function ($classQuery) use ($keyword): void {
                        $classQuery
                            ->where('lop_hoc_phan', 'like', "%{$keyword}%")
                            ->orWhere('ma_khoi', 'like', "%{$keyword}%")
                            ->orWhere('ten_khoi', 'like', "%{$keyword}%")
                            ->orWhere('ma_don_vi', 'like', "%{$keyword}%")
                            ->orWhere('ten_don_vi', 'like', "%{$keyword}%");
                    });
                }
            })
            ->orderBy('ma_khoi')
            ->get();

        return $this->jsonResponse(['data' => $lops->map(fn (Lop $lop) => $this->toPayload($lop))->values()->all()]);
    }

    public function donVis(): JsonResponse
    {
        $donVis = DonVi::query()
            ->select(['id', 'ma_don_vi', 'ten_don_vi', 'loai_don_vi'])
            ->orderBy('ma_don_vi')
            ->get();

        return $this->jsonResponse([
            'data' => $donVis,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'don_vi_id' => ['required', 'integer', 'exists:don_vis,id'],
            'lop_hoc_phan' => ['required', 'string', 'max:255'],
            'ma_khoi' => ['required', 'string', 'max:100'],
            'ten_khoi' => ['nullable', 'string', 'max:255'],
            'mo_hinh_dao_tao' => ['sometimes', 'string', 'max:50'],
            'trang_thai' => ['sometimes', 'boolean'],
        ]);

        $donVi = DonVi::query()->findOrFail($payload['don_vi_id']);

        $attributes = [
            'don_vi_id' => $payload['don_vi_id'],
            'lop_hoc_phan' => trim($payload['lop_hoc_phan']),
            'si_so' => 0,
            'mo_hinh_dao_tao' => trim((string) ($payload['mo_hinh_dao_tao'] ?? '')) ?: 'Tín chỉ',
            'ma_khoi' => trim($payload['ma_khoi']),
            'ten_khoi' => trim((string) ($payload['ten_khoi'] ?? '')) ?: trim($payload['ma_khoi']),
            'ma_don_vi' => $donVi->ma_don_vi,
            'ten_don_vi' => $donVi->ten_don_vi,
            'trang_thai' => (bool) ($payload['trang_thai'] ?? true),
        ];

        if (Schema::hasColumn('lops', 'ma_lop')) {
            $attributes['ma_lop'] = $attributes['lop_hoc_phan'];
        }

        if (Schema::hasColumn('lops', 'ten_lop')) {
            $attributes['ten_lop'] = $attributes['ten_khoi'];
        }

        $lop = Lop::query()->create($attributes);

        return $this->jsonResponse([
            'message' => 'Đã tạo lớp hành chính thành công',
            'data' => $this->toPayload($lop->fresh('donVi')),
        ], 201);
    }

    public function update(Request $request, Lop $lop): JsonResponse
    {
        $payload = $request->validate([
            'don_vi_id' => ['required', 'integer', 'exists:don_vis,id'],
            'lop_hoc_phan' => ['required', 'string', 'max:255'],
            'ma_khoi' => ['required', 'string', 'max:100'],
            'ten_khoi' => ['nullable', 'string', 'max:255'],
            'trang_thai' => ['sometimes', 'boolean'],
        ]);

        $donVi = DonVi::query()->findOrFail($payload['don_vi_id']);

        $lop->fill([
            'don_vi_id' => $payload['don_vi_id'],
            'lop_hoc_phan' => trim($payload['lop_hoc_phan']),
            'ma_khoi' => trim($payload['ma_khoi']),
            'ten_khoi' => trim((string) ($payload['ten_khoi'] ?? '')) ?: trim($payload['ma_khoi']),
            'ma_don_vi' => $donVi->ma_don_vi,
            'ten_don_vi' => $donVi->ten_don_vi,
            'trang_thai' => (bool) ($payload['trang_thai'] ?? $lop->trang_thai),
        ]);

        if (Schema::hasColumn('lops', 'ma_lop')) {
            $lop->setAttribute('ma_lop', $lop->lop_hoc_phan);
        }

        if (Schema::hasColumn('lops', 'ten_lop')) {
            $lop->setAttribute('ten_lop', $lop->ten_khoi);
        }

        $lop->save();

        return $this->jsonResponse([
            'message' => 'Đã cập nhật lớp thành công',
            'data' => $this->toPayload($lop->fresh('donVi')),
        ]);
    }

    public function toggleStatus(Lop $lop): JsonResponse
    {
        $lop->forceFill(['trang_thai' => ! $lop->trang_thai])->save();

        return $this->jsonResponse([
            'message' => $lop->trang_thai ? 'Đã mở khóa lớp' : 'Đã khóa lớp',
            'data' => $this->toPayload($lop->fresh('donVi')),
        ]);
    }

    public function destroy(Lop $lop): JsonResponse
    {
        if ($lop->sinhViens()->exists()) {
            return $this->jsonResponse([
                'message' => 'Không thể xóa lớp vì đã có sinh viên thuộc lớp này.',
            ], 422);
        }

        $lop->delete();

        return $this->jsonResponse([
            'message' => 'Đã xóa lớp thành công',
        ]);
    }

    private function toPayload(Lop $lop): array
    {
        $lop->loadMissing('donVi:id,ma_don_vi,ten_don_vi,loai_don_vi');

        return [
            'id' => $lop->id,
            'don_vi_id' => $lop->don_vi_id,
            'lop_hoc_phan' => $lop->lop_hoc_phan,
            'si_so' => $lop->si_so,
            'mo_hinh_dao_tao' => $lop->mo_hinh_dao_tao,
            'ma_khoi' => $lop->ma_khoi,
            'ten_khoi' => $lop->ten_khoi,
            'ma_don_vi' => $lop->ma_don_vi,
            'ten_don_vi' => $lop->ten_don_vi,
            'trang_thai' => (bool) $lop->trang_thai,
            'don_vi' => $lop->donVi,
            'created_at' => $lop->created_at,
            'updated_at' => $lop->updated_at,
        ];
    }
}
