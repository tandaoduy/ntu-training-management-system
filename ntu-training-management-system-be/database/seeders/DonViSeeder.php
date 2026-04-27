<?php

namespace Database\Seeders;

use App\Models\DonVi;
use Illuminate\Database\Seeder;

class DonViSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $donVis = [
            [
                'ma_don_vi' => 'KCNTT',
                'ten_don_vi' => 'Khoa Công nghệ thông tin',
                'loai_don_vi' => 'Đào tạo',
            ],
            [
                'ma_don_vi' => 'KNN',
                'ten_don_vi' => 'Khoa Ngoại Ngữ',
                'loai_don_vi' => 'Đào tạo',
            ],
            [
                'ma_don_vi' => 'KDL',
                'ten_don_vi' => 'Khoa Du lịch',
                'loai_don_vi' => 'Đào tạo',
            ],
            [
                'ma_don_vi' => 'KKHXHNV',
                'ten_don_vi' => 'Khoa Khoa học Xã hội và Nhân văn',
                'loai_don_vi' => 'Đào tạo',
            ],
            [
                'ma_don_vi' => 'TTSKHSS',
                'ten_don_vi' => 'Trường Thủy sản và Khoa học sự sống',
                'loai_don_vi' => 'Đào tạo',
            ],
            [
                'ma_don_vi' => 'TKTCN',
                'ten_don_vi' => 'Trường Kỹ thuật và Công nghệ',
                'loai_don_vi' => 'Đào tạo',
            ],
            [
                'ma_don_vi' => 'TKTKD',
                'ten_don_vi' => 'Trường Kinh tế và Kinh doanh',
                'loai_don_vi' => 'Đào tạo',
            ],
            [
                'ma_don_vi' => 'TTDTT',
                'ten_don_vi' => 'Trung tâm Thể dục và Thể thao',
                'loai_don_vi' => 'Quản lý',
            ],
            [
                'ma_don_vi' => 'TTGDQPAN',
                'ten_don_vi' => 'Trung tâm Giáo dục Quốc phòng và An ninh',
                'loai_don_vi' => 'Quản lý',
            ],
        ];

        foreach ($donVis as $donVi) {
            DonVi::firstOrCreate(
                ['ma_don_vi' => $donVi['ma_don_vi']],
                $donVi
            );
        }

        $this->command->info('✓ 9 đơn vị đã được thêm vào hệ thống.');
    }
}
