import CurriculumPlanPage from '../../curriculum/CurriculumPlanPage'

export default function ManagerCurriculumPage() {
  return (
    <CurriculumPlanPage
      mode="curriculum"
      roleLabel="Quản lý đơn vị"
      backLink="/quanly"
      title="Chương trình đào tạo phụ trách"
      description="Theo dõi các phiên bản CTĐT và học phần để phục vụ duyệt yêu cầu mở học phần của đơn vị."
      staffEndpointPrefix="/curriculum-programs"
    />
  )
}
