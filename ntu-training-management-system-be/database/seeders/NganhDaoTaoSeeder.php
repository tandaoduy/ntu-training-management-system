<?php

namespace Database\Seeders;

use App\Models\DonVi;
use App\Models\NganhDaoTao;
use Illuminate\Database\Seeder;

class NganhDaoTaoSeeder extends Seeder
{
    private const HE_DAO_TAO = 'Đại học Chính quy';
    private const DEFAULT_TRAINING_DURATION = 4.0;
    private const EXTENDED_TRAINING_DURATION = 4.5;

    public function run(): void
    {
        $donViIdsByCode = DonVi::query()
            ->whereIn('ma_don_vi', ['TTSKHSS', 'TKTCN', 'TKTKD', 'KCNTT', 'KNN', 'KKHXHNV', 'KDL'])
            ->pluck('id', 'ma_don_vi');

        $nganhDaoTaos = [
            ['TTSKHSS', '7620304', 'Khai thác thủy sản'],
            ['TTSKHSS', '7620303', 'Khoa học thủy sản'],
            ['TTSKHSS', '7620305', 'Quản lý thủy sản'],
            ['TTSKHSS', '7620302', 'Bệnh học thủy sản'],
            ['TTSKHSS', '7620301', 'Nuôi trồng thủy sản'],
            ['TTSKHSS', '7620301MP', 'Nuôi trồng thủy sản (Chương trình Minh Phú-NTU)'],
            ['TTSKHSS', '7420201', 'Công nghệ sinh học'],
            ['TTSKHSS', '7420201MP', 'Công nghệ sinh học (Chương trình Minh Phú-NTU)'],
            ['TTSKHSS', '7540105', 'Công nghệ chế biến thủy sản'],
            ['TTSKHSS', '7540105HV', 'Công nghệ chế biến thủy sản (Chương trình Hải Vương - NTU)'],
            ['TTSKHSS', '7540105MP', 'Công nghệ chế biến thủy sản (Chương trình Minh Phú-NTU)'],
            ['TTSKHSS', '7540101', 'Công nghệ thực phẩm'],
            ['TTSKHSS', '7540106', 'Đảm bảo chất lượng và an toàn thực phẩm'],
            ['TTSKHSS', '7520301', 'Kỹ thuật hoá học'],
            ['TTSKHSS', '7520320', 'Kỹ thuật môi trường'],
            ['TKTCN', '7510202', 'Công nghệ chế tạo máy'],
            ['TKTCN', '7520114', 'Kỹ thuật cơ điện tử'],
            ['TKTCN', '7520103', 'Kỹ thuật cơ khí'],
            ['TKTCN', '7520103MP', 'Cơ khí thuỷ sản thông minh (Chương trình Minh Phú-NTU)'],
            ['TKTCN', '7520115', 'Kỹ thuật nhiệt'],
            ['TKTCN', '7840106', 'Khoa học hàng hải'],
            ['TKTCN', '7520206', 'Kỹ thuật biển'],
            ['TKTCN', '7520122', 'Kỹ thuật tàu thủy'],
            ['TKTCN', '7520116', 'Kỹ thuật cơ khí động lực'],
            ['TKTCN', '7520130', 'Kỹ thuật ô tô'],
            ['TKTCN', '7580201', 'Kỹ thuật xây dựng'],
            ['TKTCN', '7580205', 'Kỹ thuật xây dựng công trình giao thông'],
            ['TKTCN', '7520201', 'Kỹ thuật điện'],
            ['TKTCN', '7520216', 'Kỹ thuật điều khiển và tự động hóa'],
            ['TKTKD', '7310101', 'Kinh tế'],
            ['TKTKD', '7310105', 'Kinh tế phát triển'],
            ['TKTKD', '7340121', 'Kinh doanh thương mại'],
            ['TKTKD', '7340115', 'Marketing'],
            ['TKTKD', '7340101', 'Quản trị kinh doanh'],
            ['TKTKD', '7340101A', 'Quản trị kinh doanh (Chương trình đào tạo đặc biệt)'],
            ['TKTKD', '7340301', 'Kế toán'],
            ['TKTKD', '7340301A', 'Kế toán (Chương trình đào tạo đặc biệt)'],
            ['TKTKD', '7340302', 'Kiểm toán'],
            ['TKTKD', '7340201', 'Tài chính - Ngân hàng'],
            ['TKTKD', '7340201A', 'Tài chính - Ngân hàng (Chương trình đào tạo đặc biệt)'],
            ['KCNTT', '7480201', 'Công nghệ thông tin'],
            ['KCNTT', '7480201VN', 'Công nghệ thông tin Việt - Nhật'],
            ['KCNTT', '7480201A', 'Công nghệ thông tin (Chương trình đào tạo đặc biệt)'],
            ['KCNTT', '7340405', 'Hệ thống thông tin quản lý'],
            ['KCNTT', '7480101', 'Khoa học máy tính'],
            ['KNN', '7220201', 'Ngôn ngữ Anh'],
            ['KKHXHNV', '7380101', 'Luật'],
            ['KDL', '7810103', 'Quản trị dịch vụ du lịch và lữ hành'],
            ['KDL', '7810103PV', 'Quản trị dịch vụ du lịch và lữ hành (Chương trình song ngữ Pháp - Việt)'],
            ['KDL', '7810103A', 'Quản trị dịch vụ du lịch và lữ hành (Chương trình đào tạo đặc biệt)'],
            ['KDL', '7810201', 'Quản trị Khách sạn'],
            ['KDL', '7810201A', 'Quản trị Khách sạn (Chương trình đào tạo đặc biệt)'],
        ];

        foreach ($nganhDaoTaos as [$maDonVi, $maNganh, $tenNganh]) {
            $donViId = $donViIdsByCode[$maDonVi] ?? null;

            if (! $donViId) {
                continue;
            }

            $thoiGianDaoTao = preg_match('/(HV|MP)$/u', $maNganh)
                ? self::EXTENDED_TRAINING_DURATION
                : self::DEFAULT_TRAINING_DURATION;

            NganhDaoTao::query()->updateOrCreate(
                ['ma_nganh' => $maNganh],
                [
                    'ten_nganh' => $tenNganh,
                    'don_vi_id' => $donViId,
                    'he_dao_tao' => self::HE_DAO_TAO,
                    'thoi_gian_dao_tao' => $thoiGianDaoTao,
                ],
            );
        }

        $this->command->info('✓ Danh sách ngành đào tạo đã được cập nhật.');
    }
}
