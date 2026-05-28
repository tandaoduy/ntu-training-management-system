import RoleLayout from '../../../layout/RoleLayout'
import CurriculumPlanPage from '../../curriculum/CurriculumPlanPage'

export default function LecturerStudyPlanPage() {
  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="GIẢNG VIÊN"
      roleColor="blue"
      homeRoute="/canbo"
      roleTitle="Giảng viên"
    >
      <CurriculumPlanPage
        mode="curriculum"
        roleLabel="Giảng viên"
        backLink="/canbo"
        title="Theo dõi kế hoạch học tập"
        description="Tra cứu chương trình đào tạo và học phần để hỗ trợ cố vấn học tập."
        staffEndpointPrefix="/curriculum-programs"
        hideToolbar
        hideHeading
      />
    </RoleLayout>
  )
}
