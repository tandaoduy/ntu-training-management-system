import CurriculumPlanPage from '../../curriculum/CurriculumPlanPage'

export default function LecturerStudyPlanPage() {
  return (
    <CurriculumPlanPage
      mode="studyplan"
      roleLabel="Cán bộ"
      backLink="/canbo"
      title="Theo dõi kế hoạch học tập"
      description="Tra cứu chương trình đào tạo và học phần để hỗ trợ cố vấn học tập."
      staffEndpointPrefix="/curriculum-programs"
    />
  )
}
