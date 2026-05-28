import RoleLayout from '../../../layout/RoleLayout'
import CurriculumPlanPage from '../../curriculum/CurriculumPlanPage'

export default function ManagerCurriculumPage() {
  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="QUẢN LÝ"
      roleColor="teal"
      homeRoute="/quanly"
      roleTitle="Quản lý"
    >
      <CurriculumPlanPage
        mode="curriculum"
        roleLabel="Quản lý đơn vị"
        backLink="/quanly"
        title="Chương trình đào tạo phụ trách"
        description="Theo dõi các phiên bản CTĐT và học phần để phục vụ duyệt yêu cầu mở học phần của đơn vị."
        staffEndpointPrefix="/curriculum-programs"
        hideToolbar
        hideHeading
      />
    </RoleLayout>
  )
}
