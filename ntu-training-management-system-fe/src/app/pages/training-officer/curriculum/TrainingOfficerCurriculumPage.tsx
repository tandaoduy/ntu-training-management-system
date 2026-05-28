import TrainingOfficerLayout from '../../../layout/training-officer/TrainingOfficerLayout'
import CurriculumPlanPage from '../../curriculum/CurriculumPlanPage'

export default function TrainingOfficerCurriculumPage() {
  return (
    <TrainingOfficerLayout>
      <CurriculumPlanPage
        mode="curriculum"
        roleLabel="Chuyên viên đào tạo"
        backLink="/chuyenvien"
        title="Theo dõi kế hoạch học tập theo CTĐT"
        description="Xem tất cả ngành và chương trình đào tạo để phục vụ lập kế hoạch, thống kê nhu cầu và đề xuất mở học phần."
        staffEndpointPrefix="/curriculum-programs"
        hideToolbar
        hideHeading
      />
    </TrainingOfficerLayout>
  )
}
