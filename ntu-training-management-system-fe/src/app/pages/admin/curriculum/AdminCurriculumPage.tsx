import CurriculumPlanPage from '../../curriculum/CurriculumPlanPage'

export default function AdminCurriculumPage() {
  return (
    <CurriculumPlanPage
      mode="curriculum"
      roleLabel="Quản trị viên"
      backLink="/quantri"
      title="Quản lý chương trình đào tạo"
      description="Theo dõi toàn bộ ngành, chương trình đào tạo và danh mục học phần đã công bố."
      staffEndpointPrefix="/admin/curriculum-programs"
    />
  )
}
