import logoImage from '@/assets/Logo_NTU.png'

export const SYSTEM_NAME = 'Hệ thống quản lý đào tạo'
export const SCHOOL_NAME = 'TRƯỜNG ĐẠI HỌC NHA TRANG'
export const MINISTRY_NAME = 'BỘ GIÁO DỤC VÀ ĐÀO TẠO'
export const TRAINING_DEPARTMENT_NAME = 'PHÒNG ĐÀO TẠO ĐẠI HỌC'
export const LOGO_IMAGE_URL = new URL(logoImage, window.location.origin).href
export const printFaviconLink = `<link rel="icon" type="image/png" href="${LOGO_IMAGE_URL}" />`

export const printBrandHtml = (extraLine = '') => `
  <div class="print-brand">
    <img src="${LOGO_IMAGE_URL}" alt="NTU" />
    <div>
      <div>${SCHOOL_NAME}</div>
      ${extraLine ? `<div>${extraLine}</div>` : ''}
    </div>
  </div>
`

export const printBrandStyles = `
  .print-brand{display:flex;align-items:center;justify-content:center;gap:10px;text-align:center;font-weight:700;line-height:1.35;margin-bottom:8px}
  .print-brand img{width:44px;height:44px;object-fit:contain}
`
