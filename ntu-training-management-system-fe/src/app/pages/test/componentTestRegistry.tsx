import { useMemo, useState } from 'react'
import type { ChangeEvent, ComponentType, ReactNode } from 'react'

import { Accordion } from '@/components/accordion'
import Alert, { type AlertVariant, useAlert } from '@/components/alert'
import { Avatar } from '@/components/avatar'
import { Badge } from '@/components/badge'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/card'
import { Checkbox } from '@/components/checkbox'
import { DatePicker } from '@/components/date-picker'
import { GroupButtons } from '@/components/group-buttons'
import { Input } from '@/components/input'
import { Modal } from '@/components/modal'
import { Navbar } from '@/components/navbar'
import { Pagination } from '@/components/pagination'
import { RadioGroup } from '@/components/radio'
import { SearchInput } from '@/components/search-input'
import { Select } from '@/components/select'
import { Sidebar } from '@/components/sidebar'
import { Spinner } from '@/components/spinner'
import { Table, TablePagination, type TableColumn } from '@/components/table'
import { Tabs } from '@/components/tabs'
import { Textarea } from '@/components/textarea'
import { Toggle } from '@/components/toggle'
import { Tooltip } from '@/components/tooltip'
import { Upload } from '@/components/upload'

export type ComponentTestEntry = {
  id: string
  name: string
  description: string
  category: 'Hiển thị' | 'Biểu mẫu' | 'Điều hướng' | 'Phản hồi' | 'Bố cục' | 'Dữ liệu'
  testCases: string[]
  Component: ComponentType
}

type DemoStudent = {
  id: string
  code: string
  name: string
  className: string
  status: 'Đang học' | 'Cần bổ sung' | 'Đã xác nhận'
}

const students: DemoStudent[] = [
  { id: 'sv001', code: '64130001', name: 'Nguyễn Văn A', className: '64.CNTT-1', status: 'Đang học' },
  { id: 'sv002', code: '64130002', name: 'Trần Thị B', className: '64.CNTT-2', status: 'Đã xác nhận' },
  { id: 'sv003', code: '64130003', name: 'Lê Minh C', className: '64.KTPM-1', status: 'Cần bổ sung' },
]

const studentColumns: TableColumn<DemoStudent>[] = [
  { key: 'code', header: 'Mã SV' },
  { key: 'name', header: 'Họ tên' },
  { key: 'className', header: 'Lớp' },
  {
    key: 'status',
    header: 'Trạng thái',
    render: (row) => (
      <Badge variant={row.status === 'Cần bổ sung' ? 'warning' : 'success'}>{row.status}</Badge>
    ),
  },
]

const entryStatusClassName =
  'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700'

const formControlClassName =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100'

function TestWorkbench({
  title,
  testCases,
  state,
  controls,
  children,
}: {
  title: string
  testCases: string[]
  state?: Record<string, string | number | boolean | string[]>
  controls?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</h2>
            <span className={entryStatusClassName}>Có thể thao tác</span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">{children}</div>
        </div>

        {controls && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Điều khiển test</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">{controls}</div>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Kịch bản cần test</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {testCases.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {state && <StateViewer state={state} />}
      </aside>
    </div>
  )
}

function StateViewer({ state }: { state: Record<string, string | number | boolean | string[]> }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100 shadow-sm">
      <h3 className="text-sm font-semibold text-white">Trạng thái trực tiếp</h3>
      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap">
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  )
}

function AccordionDemo() {
  const [allowClose, setAllowClose] = useState(true)

  return (
    <TestWorkbench
      title="Hành vi Accordion"
      testCases={[
        'Bấm từng mục để kiểm tra đóng/mở đúng nội dung.',
        'Tắt allowClose và bấm lại mục đang mở: mục đó không bị đóng.',
        'Mục disabled không được focus/trigger bằng chuột.',
      ]}
      state={{ allowClose }}
      controls={
        <Checkbox
          label="Cho phép đóng mục đang mở"
          checked={allowClose}
          onChange={(event) => setAllowClose(event.target.checked)}
        />
      }
    >
      <Accordion
        key={String(allowClose)}
        allowClose={allowClose}
        defaultOpenId="overview"
        items={[
          { id: 'overview', title: 'Thông tin chung', content: 'Nội dung mở sẵn để kiểm tra layout.' },
          { id: 'schedule', title: 'Tiến độ đào tạo', content: 'Kiểm tra chiều cao nội dung khi đổi section.' },
          { id: 'disabled', title: 'Mục bị khóa', content: 'Không mở được', disabled: true },
        ]}
      />
    </TestWorkbench>
  )
}

function AlertDemo() {
  const alertVariants: AlertVariant[] = ['success', 'error', 'warning', 'info']
  const [lastAlert, setLastAlert] = useState('Chưa bắn toast')
  const { showAlert, clearAlerts } = useAlert()

  return (
    <TestWorkbench
      title="Alert inline và toast"
      testCases={[
        'Kiểm tra đủ màu inline cho success, error, warning, info.',
        'Bấm nút toast để kiểm tra AlertProvider hiện notification.',
        'Bấm clear để đảm bảo toast có thể xóa hết.',
      ]}
      state={{ lastAlert }}
      controls={
        <>
          {alertVariants.map((variant) => (
            <Button
              key={variant}
              variant={variant === 'error' ? 'danger' : variant === 'info' ? 'secondary' : variant}
              onClick={() => {
                setLastAlert(variant)
                showAlert({
                  variant,
                  title: `Toast ${variant}`,
                  description: 'Thông báo này được tạo từ useAlert trong trang test.',
                  duration: 3500,
                })
              }}
            >
              Toast {variant === 'success' ? 'thành công' : variant === 'error' ? 'lỗi' : variant === 'warning' ? 'cảnh báo' : 'thông tin'}
            </Button>
          ))}
          <Button variant="ghost" onClick={clearAlerts}>
            Xóa tất cả
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {alertVariants.map((variant) => (
          <Alert
            key={variant}
            variant={variant}
            title={`Alert ${variant}`}
            message="Component hỗ trợ inline và provider notification."
          />
        ))}
      </div>
    </TestWorkbench>
  )
}

function AvatarDemo() {
  const [status, setStatus] = useState('online')

  return (
    <TestWorkbench
      title="Kích thước và status Avatar"
      testCases={[
        'Kiểm tra initials khi không có ảnh đại diện.',
        'Đổi status và xác nhận indicator hiện đúng.',
        'So sánh kích thước md, lg, xl trong cùng một hàng.',
      ]}
      state={{ status }}
      controls={
        <Field label="Trạng thái">
          <select className={formControlClassName} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="online">Đang online</option>
            <option value="busy">Đang bận</option>
            <option value="away">Tạm vắng</option>
            <option value="offline">Offline</option>
          </select>
        </Field>
      }
    >
      <div className="flex flex-wrap items-center gap-5">
        <Avatar name="Nguyễn Văn A" status={status as never} />
        <Avatar name="Trần Thị B" size="lg" status={status as never} />
        <Avatar name="Lê Minh C" size="xl" status={status as never} />
      </div>
    </TestWorkbench>
  )
}

function BadgeDemo() {
  const [showDot, setShowDot] = useState(true)
  const [pill, setPill] = useState(false)

  return (
    <TestWorkbench
      title="Các variant của Badge"
      testCases={[
        'Kiểm tra tất cả variant mặc định, success, warning, danger, info.',
        'Bật/tắt dot và pill để xem spacing có bị vỡ không.',
        'Kiểm tra badge khi text dài hơn bình thường.',
      ]}
      state={{ showDot, pill }}
      controls={
        <>
          <Checkbox label="Hiện dot" checked={showDot} onChange={(event) => setShowDot(event.target.checked)} />
          <Checkbox label="Dạng pill" checked={pill} onChange={(event) => setPill(event.target.checked)} />
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Badge dot={showDot} pill={pill}>Mặc định</Badge>
        <Badge variant="success" dot={showDot} pill={pill}>Đã xác nhận</Badge>
        <Badge variant="warning" dot={showDot} pill={pill}>Cần bổ sung hồ sơ</Badge>
        <Badge variant="danger" dot={showDot} pill={pill}>Từ chối</Badge>
        <Badge variant="info" dot={showDot} pill={pill}>Thông tin</Badge>
      </div>
    </TestWorkbench>
  )
}

function BreadcrumbsDemo() {
  const [depth, setDepth] = useState(3)
  const items = [
    { label: 'Trang chủ', href: '#' },
    { label: 'Quản trị', href: '#' },
    { label: 'Tài khoản', href: '#' },
    { label: 'Chi tiết sinh viên' },
  ].slice(0, depth)

  return (
    <TestWorkbench
      title="Độ sâu Breadcrumb"
      testCases={[
        'Đổi số cấp và kiểm tra separator không lặp sai.',
        'Cấp cuối không cần href và cần hiện như trang hiện tại.',
        'Kiểm tra trên hàng hẹp khi label dài.',
      ]}
      state={{ depth, current: items[items.length - 1]?.label ?? '' }}
      controls={
        <Field label="Số cấp">
          <input
            className={formControlClassName}
            type="range"
            min={2}
            max={4}
            value={depth}
            onChange={(event) => setDepth(Number(event.target.value))}
          />
        </Field>
      }
    >
      <Breadcrumbs items={items} />
    </TestWorkbench>
  )
}

function ButtonDemo() {
  const [clicks, setClicks] = useState(0)
  const [disabled, setDisabled] = useState(false)
  const [outline, setOutline] = useState(false)
  const buttonLabels = {
    primary: 'Chính',
    secondary: 'Phụ',
    success: 'Thành công',
    danger: 'Nguy hiểm',
    warning: 'Cảnh báo',
    ghost: 'Ẩn nền',
  }

  return (
    <TestWorkbench
      title="Hành động Button"
      testCases={[
        'Bấm các variant và xem counter tăng đúng.',
        'Bật disabled để đảm bảo nút không trigger onClick.',
        'Bật outline để xem style outline của từng variant.',
      ]}
      state={{ clicks, disabled, outline }}
      controls={
        <>
          <Checkbox label="Vô hiệu hóa" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} />
          <Checkbox label="Outline" checked={outline} onChange={(event) => setOutline(event.target.checked)} />
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        {(['primary', 'secondary', 'success', 'danger', 'warning', 'ghost'] as const).map((variant) => (
          <Button
            key={variant}
            variant={variant}
            outline={outline}
            disabled={disabled}
            onClick={() => setClicks((value) => value + 1)}
          >
            {buttonLabels[variant]}
          </Button>
        ))}
      </div>
    </TestWorkbench>
  )
}

function CardDemo() {
  const [footer, setFooter] = useState(true)

  return (
    <TestWorkbench
      title="Cấu trúc Card"
      testCases={[
        'Kiểm tra header, content, footer có spacing ổn định.',
        'Tắt footer để xem border/cuối card có bị thừa khoảng trắng không.',
        'Kiểm tra nội dung dài trong CardContent.',
      ]}
      state={{ footer }}
      controls={<Checkbox label="Hiện footer" checked={footer} onChange={(event) => setFooter(event.target.checked)} />}
    >
      <Card>
        <CardHeader title="Thông tin học phần" description="CardHeader, CardContent và CardFooter." />
        <CardContent>
          <p className="text-sm leading-6 text-slate-600">
            Học phần demo dùng để kiểm tra cách card giữ bố cục khi nội dung có nhiều dòng và hành động nằm ở footer.
          </p>
        </CardContent>
        {footer && (
          <CardFooter>
            <Button variant="secondary">Đóng</Button>
            <Button>Lưu thay đổi</Button>
          </CardFooter>
        )}
      </Card>
    </TestWorkbench>
  )
}

function CheckboxDemo() {
  const [email, setEmail] = useState(true)
  const [sms, setSms] = useState(false)

  return (
    <TestWorkbench
      title="Checkbox có điều khiển"
      testCases={[
        'Tick/untick và xem live state cập nhật.',
        'Kiểm tra helper description không làm lệch label.',
        'Checkbox disabled không thay đổi giá trị.',
      ]}
      state={{ email, sms }}
    >
      <div className="space-y-3">
        <Checkbox
          label="Nhận email thông báo"
          description="Bật thông báo từ hệ thống."
          checked={email}
          onChange={(event) => setEmail(event.target.checked)}
        />
        <Checkbox
          label="Nhận SMS"
          description="Dùng cho thông báo khẩn."
          checked={sms}
          onChange={(event) => setSms(event.target.checked)}
        />
        <Checkbox label="Lựa chọn bị khóa" disabled checked />
      </div>
    </TestWorkbench>
  )
}

function DatePickerDemo() {
  const [date, setDate] = useState('2026-04-30')
  const hasError = date < '2026-01-01'

  return (
    <TestWorkbench
      title="Validation DatePicker"
      testCases={[
        'Đổi ngày và kiểm tra value controlled.',
        'Chọn ngày trước 2026-01-01 để hiện error.',
        'Kiểm tra kích thước lg và helper text.',
      ]}
      state={{ date, hasError }}
    >
      <DatePicker
        label="Ngày bắt đầu"
        helperText="Chọn ngày trong học kỳ hiện tại."
        error={hasError ? 'Ngày bắt đầu không được trước năm 2026.' : undefined}
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />
    </TestWorkbench>
  )
}

function GroupButtonsDemo() {
  const [value, setValue] = useState('week')
  const [fullWidth, setFullWidth] = useState(false)

  return (
    <TestWorkbench
      title="Lựa chọn phân đoạn"
      testCases={[
        'Chọn Ngày/Tuần/Tháng và xem state đổi đúng.',
        'Bật fullWidth để kiểm tra layout ngang.',
        'Option disabled không được chọn.',
      ]}
      state={{ value, fullWidth }}
      controls={<Checkbox label="Toàn chiều ngang" checked={fullWidth} onChange={(event) => setFullWidth(event.target.checked)} />}
    >
      <GroupButtons
        value={value}
        onChange={setValue}
        fullWidth={fullWidth}
        options={[
          { label: 'Ngày', value: 'day' },
          { label: 'Tuần', value: 'week' },
          { label: 'Tháng', value: 'month' },
          { label: 'Năm học', value: 'year', disabled: true },
        ]}
      />
    </TestWorkbench>
  )
}

function InputDemo() {
  const [studentCode, setStudentCode] = useState('64130001')
  const isValid = /^\d{8}$/.test(studentCode)

  return (
    <TestWorkbench
      title="Validation Input"
      testCases={[
        'Nhập mã sinh viên 8 chữ số để hiện success.',
        'Nhập sai độ dài/ký tự để hiện error.',
        'Kiểm tra placeholder, helper text và controlled value.',
      ]}
      state={{ studentCode, isValid }}
    >
      <Input
        label="Mã sinh viên"
        helperText="Nhập 8 chữ số."
        error={!isValid ? 'Mã sinh viên phải gồm đúng 8 chữ số.' : undefined}
        state={isValid ? 'success' : 'error'}
        placeholder="64130001"
        value={studentCode}
        onChange={(event) => setStudentCode(event.target.value)}
      />
    </TestWorkbench>
  )
}

function ModalDemo() {
  const [modalOpen, setModalOpen] = useState(false)
  const [size, setSize] = useState('md')
  const [lastAction, setLastAction] = useState('Chưa có')

  return (
    <TestWorkbench
      title="Vòng đời Modal"
      testCases={[
        'Mở modal và đóng bằng nút X.',
        'Bấm action để xem autoClose và lastAction.',
        'Đổi size để kiểm tra max-width sm/md/lg/xl.',
      ]}
      state={{ modalOpen, size, lastAction }}
      controls={
        <>
          <Field label="Kích thước">
            <select className={formControlClassName} value={size} onChange={(event) => setSize(event.target.value)}>
              <option value="sm">sm</option>
              <option value="md">md</option>
              <option value="lg">lg</option>
              <option value="xl">xl</option>
            </select>
          </Field>
          <Button onClick={() => setModalOpen(true)}>Mở modal</Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">Trạng thái modal hiện tại: {modalOpen ? 'Đang mở' : 'Đang đóng'}.</p>
      {modalOpen && (
        <Modal
          modal={{
            id: 'component-test-modal',
            title: 'Modal test',
            size: size as never,
            content: 'Đây là modal demo trong trang component test.',
            dismissible: true,
            closeOnOverlayClick: true,
            actions: [
              { label: 'Hủy', variant: 'secondary', onClick: () => setLastAction('Hủy') },
              { label: 'Xác nhận', variant: 'primary', onClick: () => setLastAction('Xác nhận') },
            ],
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </TestWorkbench>
  )
}

function NavbarDemo() {
  const [active, setActive] = useState('dashboard')

  return (
    <TestWorkbench
      title="Mục active của Navbar"
      testCases={[
        'Đổi active item bằng panel điều khiển và xem navbar render đúng.',
        'Kiểm tra action bên phải không làm vỡ hàng.',
        'Kiểm tra brand và menu khi label ngắn/dài.',
      ]}
      state={{ active }}
      controls={
        <>
          <Button variant={active === 'dashboard' ? 'primary' : 'secondary'} onClick={() => setActive('dashboard')}>
            Dashboard
          </Button>
          <Button variant={active === 'classes' ? 'primary' : 'secondary'} onClick={() => setActive('classes')}>
            Lớp học
          </Button>
          <Button variant={active === 'settings' ? 'primary' : 'secondary'} onClick={() => setActive('settings')}>
            Cấu hình
          </Button>
        </>
      }
    >
      <Navbar
        brand="NTU"
        items={[
          { label: 'Dashboard', href: '#', active: active === 'dashboard' },
          { label: 'Lớp học', href: '#', active: active === 'classes' },
          { label: 'Cấu hình', href: '#', active: active === 'settings' },
        ]}
        actions={<Button variant="secondary">Tài khoản</Button>}
      />
    </TestWorkbench>
  )
}

function PaginationDemo() {
  const [page, setPage] = useState(2)
  const [totalPages, setTotalPages] = useState(8)

  return (
    <TestWorkbench
      title="Giới hạn Pagination"
      testCases={[
        'Bấm prev/next và số trang để kiểm tra onPageChange.',
        'Về trang 1/trang cuối để kiểm tra disabled boundary.',
        'Đổi totalPages và đảm bảo current page không vượt quá tổng trang.',
      ]}
      state={{ page, totalPages }}
      controls={
        <Field label="Tổng số trang">
          <input
            className={formControlClassName}
            type="number"
            min={1}
            max={15}
            value={totalPages}
            onChange={(event) => {
              const nextTotal = Number(event.target.value)
              setTotalPages(nextTotal)
              setPage((current) => Math.min(current, nextTotal))
            }}
          />
        </Field>
      }
    >
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </TestWorkbench>
  )
}

function RadioDemo() {
  const [value, setValue] = useState('credit')

  return (
    <TestWorkbench
      title="RadioGroup có điều khiển"
      testCases={[
        'Chọn từng mô hình và xem state đổi.',
        'Radio disabled không được chọn.',
        'Kiểm tra helper text và description từng option.',
      ]}
      state={{ value }}
    >
      <RadioGroup
        name="training-model"
        label="Mô hình đào tạo"
        value={value}
        onChange={setValue}
        helperText="Chọn một mô hình áp dụng cho lớp."
        options={[
          { label: 'Tín chỉ', value: 'credit', description: 'Đang áp dụng cho chương trình hiện tại.' },
          { label: 'Niên chế', value: 'yearly' },
          { label: 'Tạm khóa', value: 'locked', disabled: true },
        ]}
      />
    </TestWorkbench>
  )
}

function SearchInputDemo() {
  const [searchValue, setSearchValue] = useState('đào tạo')
  const results = useMemo(
    () => students.filter((student) => student.name.toLowerCase().includes(searchValue.toLowerCase()) || student.code.includes(searchValue)),
    [searchValue],
  )

  return (
    <TestWorkbench
      title="Bộ lọc SearchInput"
      testCases={[
        'Nhập tên/mã sinh viên và xem số kết quả cập nhật.',
        'Bấm clear để xóa value.',
        'Kiểm tra placeholder khi value rỗng.',
      ]}
      state={{ searchValue, results: results.length }}
    >
      <div className="space-y-3">
        <SearchInput
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          onClear={() => setSearchValue('')}
          placeholder="Tìm theo tên hoặc mã sinh viên..."
        />
        <p className="text-sm text-slate-600">Tìm thấy {results.length} kết quả.</p>
      </div>
    </TestWorkbench>
  )
}

function SelectDemo() {
  const [role, setRole] = useState('')
  const hasError = role === ''

  return (
    <TestWorkbench
      title="Validation Select"
      testCases={[
        'Chọn vai trò và xem live state cập nhật.',
        'Để rỗng để hiện error bắt buộc.',
        'Option disabled không được chọn.',
      ]}
      state={{ role, hasError }}
    >
      <Select
        label="Vai trò"
        placeholder="Chọn vai trò"
        value={role}
        error={hasError ? 'Vui lòng chọn vai trò.' : undefined}
        onChange={(event) => setRole(event.target.value)}
        options={[
          { label: 'Sinh viên', value: 'student' },
          { label: 'Giảng viên', value: 'lecturer' },
          { label: 'Quản trị', value: 'admin' },
          { label: 'Đã khóa', value: 'locked', disabled: true },
        ]}
      />
    </TestWorkbench>
  )
}

function SidebarDemo() {
  const [active, setActive] = useState('overview')

  return (
    <TestWorkbench
      title="Điều hướng Sidebar"
      testCases={[
        'Đổi active item bằng panel điều khiển và xem sidebar render đúng.',
        'Item disabled không đổi active.',
        'Footer nằm ở cuối sidebar trong khung có chiều cao cố định.',
      ]}
      state={{ active }}
      controls={
        <>
          <Button variant={active === 'overview' ? 'primary' : 'secondary'} onClick={() => setActive('overview')}>
            Tổng quan
          </Button>
          <Button variant={active === 'accounts' ? 'primary' : 'secondary'} onClick={() => setActive('accounts')}>
            Tài khoản
          </Button>
        </>
      }
    >
      <div className="h-80 overflow-hidden rounded-lg border border-slate-200">
        <Sidebar
          brand="NTU Admin"
          items={[
            { label: 'Tổng quan', href: '#', active: active === 'overview', icon: <span>01</span> },
            { label: 'Tài khoản', href: '#', active: active === 'accounts', icon: <span>02</span> },
            { label: 'Cấu hình', href: '#', disabled: true, icon: <span>03</span> },
          ]}
          footer={<span className="text-xs text-slate-500">v1.0</span>}
        />
      </div>
    </TestWorkbench>
  )
}

function SpinnerDemo() {
  const [loading, setLoading] = useState(true)

  return (
    <TestWorkbench
      title="Kích thước Spinner"
      testCases={[
        'Bật/tắt loading để kiểm tra fallback content.',
        'So sánh sm/md/lg và label.',
        'Kiểm tra spinner không làm shift layout quá lớn.',
      ]}
      state={{ loading }}
      controls={<Checkbox label="Đang tải" checked={loading} onChange={(event) => setLoading(event.target.checked)} />}
    >
      {loading ? (
        <div className="flex flex-wrap items-center gap-4">
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" variant="success" label="Đang tải" />
        </div>
      ) : (
        <Alert variant="success" title="Đã tải xong" message="Nội dung fallback hiển thị đúng." />
      )}
    </TestWorkbench>
  )
}

function TableDemo() {
  const [tablePage, setTablePage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<string[]>(['sv001'])
  const [showEmpty, setShowEmpty] = useState(false)
  const visibleData = showEmpty ? [] : students

  return (
    <TestWorkbench
      title="Chọn dòng và phân trang Table"
      testCases={[
        'Tick từng dòng và checkbox select all để kiểm tra selectedRows.',
        'Bật empty state để kiểm tra emptyText.',
        'Bấm pagination để kiểm tra page state.',
      ]}
      state={{ selectedRows, tablePage, rows: visibleData.length }}
      controls={<Checkbox label="Hiện empty state" checked={showEmpty} onChange={(event) => setShowEmpty(event.target.checked)} />}
    >
      <div className="space-y-0">
        <Table
          columns={studentColumns}
          data={visibleData}
          rowKey="id"
          selectable
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          emptyText="Không có sinh viên phù hợp"
        />
        <TablePagination page={tablePage} pageSize={10} total={26} onPageChange={setTablePage} />
      </div>
    </TestWorkbench>
  )
}

function TabsDemo() {
  const [activeId, setActiveId] = useState('general')

  return (
    <TestWorkbench
      title="Tabs có điều khiển"
      testCases={[
        'Bấm từng tab và xem activeId cập nhật.',
        'Tab disabled không được active.',
        'Nội dung tab thay đổi mà không shift layout quá lớn.',
      ]}
      state={{ activeId }}
    >
      <Tabs
        activeId={activeId}
        onChange={setActiveId}
        items={[
          { id: 'general', label: 'Chung', content: 'Thông tin chung của đối tượng.' },
          { id: 'history', label: 'Lịch sử', content: 'Các thay đổi gần đây.' },
          { id: 'disabled', label: 'Khóa', content: 'Không truy cập', disabled: true },
        ]}
      />
    </TestWorkbench>
  )
}

function TextareaDemo() {
  const [note, setNote] = useState('Nội dung demo')
  const maxLength = 120
  const hasError = note.length > 100

  return (
    <TestWorkbench
      title="Bộ đếm Textarea"
      testCases={[
        'Nhập nội dung và xem bộ đếm ký tự.',
        'Vượt 100 ký tự để hiện warning/error.',
        'Kiểm tra maxLength chặn ở 120 ký tự.',
      ]}
      state={{ length: note.length, hasError }}
    >
      <Textarea
        label="Ghi chú"
        helperText="Tối đa 120 ký tự."
        error={hasError ? 'Ghi chú đang hơi dài, nên rút gọn trước khi lưu.' : undefined}
        maxLength={maxLength}
        showCount
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
    </TestWorkbench>
  )
}

function ToggleDemo() {
  const [enabled, setEnabled] = useState(true)

  return (
    <TestWorkbench
      title="Toggle có điều khiển"
      testCases={[
        'Bật/tắt toggle và xem checked state.',
        'Kiểm tra label và description canh hàng.',
        'Kiểm tra disabled toggle không thay đổi.',
      ]}
      state={{ enabled }}
    >
      <div className="space-y-4">
        <Toggle
          label="Trạng thái hoạt động"
          description="Dùng để bật/tắt cấu hình."
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        <Toggle label="Cấu hình bị khóa" description="Không thể thay đổi." checked disabled />
      </div>
    </TestWorkbench>
  )
}

function TooltipDemo() {
  const [placementText, setPlacementText] = useState('Hover nút bên dưới')

  return (
    <TestWorkbench
      title="Tooltip khi hover"
      testCases={[
        'Hover vào nút để xem tooltip hiện đúng nội dung.',
        'Focus bằng bàn phím để kiểm tra khả năng truy cập nếu component hỗ trợ.',
        'Đổi nội dung tooltip để kiểm tra text dài.',
      ]}
      state={{ placementText }}
      controls={
        <Field label="Nội dung tooltip">
          <input className={formControlClassName} value={placementText} onChange={(event) => setPlacementText(event.target.value)} />
        </Field>
      }
    >
      <div className="flex min-h-24 items-center justify-center">
        <Tooltip content={placementText}>
          <Button variant="secondary">Hover để xem tooltip</Button>
        </Tooltip>
      </div>
    </TestWorkbench>
  )
}

function UploadDemo() {
  const [fileName, setFileName] = useState('Chưa chọn tệp')
  const [accept, setAccept] = useState('.pdf,.doc,.docx')

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.files?.[0]?.name ?? 'Chưa chọn tệp')
  }

  return (
    <TestWorkbench
      title="Input Upload"
      testCases={[
        'Chọn tệp và xem tên tệp trong live state.',
        'Đổi accept để kiểm tra text accepted.',
        'Kiểm tra drag/drop area và helper text.',
      ]}
      state={{ fileName, accept }}
      controls={
        <Field label="Định dạng nhận">
          <input className={formControlClassName} value={accept} onChange={(event) => setAccept(event.target.value)} />
        </Field>
      }
    >
      <Upload
        id="component-upload"
        label="Tải lên tệp"
        helperText={`Tệp đã chọn: ${fileName}`}
        accept={accept}
        browseText="Chọn tệp"
        onChange={handleFileChange}
      />
    </TestWorkbench>
  )
}

export const componentTestEntries: ComponentTestEntry[] = [
  {
    id: 'accordion',
    name: 'Accordion',
    category: 'Hiển thị',
    description: 'Khu vực nội dung đóng mở.',
    testCases: ['Bật/tắt mở đóng', 'Mục vô hiệu hóa', 'Hành vi allowClose'],
    Component: AccordionDemo,
  },
  {
    id: 'alert',
    name: 'Alert',
    category: 'Phản hồi',
    description: 'Thông báo inline và toast qua AlertProvider.',
    testCases: ['Các variant inline', 'Kích hoạt toast', 'Xóa thông báo'],
    Component: AlertDemo,
  },
  {
    id: 'avatar',
    name: 'Avatar',
    category: 'Hiển thị',
    description: 'Ảnh đại diện, initials và status indicator.',
    testCases: ['Kích thước', 'Màu trạng thái', 'Fallback initials'],
    Component: AvatarDemo,
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'Hiển thị',
    description: 'Nhãn trạng thái và nhãn phân loại.',
    testCases: ['Các variant', 'Dot', 'Dạng pill'],
    Component: BadgeDemo,
  },
  {
    id: 'breadcrumbs',
    name: 'Breadcrumbs',
    category: 'Điều hướng',
    description: 'Điều hướng phân cấp.',
    testCases: ['Đổi độ sâu', 'Mục hiện tại', 'Label dài'],
    Component: BreadcrumbsDemo,
  },
  {
    id: 'button',
    name: 'Button',
    category: 'Biểu mẫu',
    description: 'Nút hành động theo variant và state.',
    testCases: ['Sự kiện click', 'Vô hiệu hóa', 'Các variant outline'],
    Component: ButtonDemo,
  },
  {
    id: 'card',
    name: 'Card',
    category: 'Bố cục',
    description: 'Khung nội dung gồm header, content, footer.',
    testCases: ['Header/content/footer', 'Footer tùy chọn', 'Nội dung dài'],
    Component: CardDemo,
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'Biểu mẫu',
    description: 'Lựa chọn bật tắt riêng lẻ.',
    testCases: ['Checked có điều khiển', 'Vô hiệu hóa', 'Mô tả'],
    Component: CheckboxDemo,
  },
  {
    id: 'date-picker',
    name: 'DatePicker',
    category: 'Biểu mẫu',
    description: 'Nhập ngày tháng và validation.',
    testCases: ['Value có điều khiển', 'Trạng thái lỗi', 'Helper text'],
    Component: DatePickerDemo,
  },
  {
    id: 'group-buttons',
    name: 'GroupButtons',
    category: 'Biểu mẫu',
    description: 'Nhóm nút chọn một giá trị.',
    testCases: ['Value có điều khiển', 'Option vô hiệu hóa', 'Toàn chiều ngang'],
    Component: GroupButtonsDemo,
  },
  {
    id: 'input',
    name: 'Input',
    category: 'Biểu mẫu',
    description: 'Ô nhập một dòng có validation.',
    testCases: ['Input có điều khiển', 'Trạng thái success', 'Trạng thái error'],
    Component: InputDemo,
  },
  {
    id: 'modal',
    name: 'Modal',
    category: 'Phản hồi',
    description: 'Hộp thoại nổi trên giao diện.',
    testCases: ['Mở/đóng', 'Hành động', 'Kích thước'],
    Component: ModalDemo,
  },
  {
    id: 'navbar',
    name: 'Navbar',
    category: 'Điều hướng',
    description: 'Thanh điều hướng ngang.',
    testCases: ['Mục active', 'Hành động', 'Spacing responsive'],
    Component: NavbarDemo,
  },
  {
    id: 'pagination',
    name: 'Pagination',
    category: 'Điều hướng',
    description: 'Điều hướng trang.',
    testCases: ['Đổi trang', 'Giới hạn vô hiệu hóa', 'Đổi tổng số trang'],
    Component: PaginationDemo,
  },
  {
    id: 'radio',
    name: 'RadioGroup',
    category: 'Biểu mẫu',
    description: 'Nhóm lựa chọn đơn.',
    testCases: ['Value có điều khiển', 'Option vô hiệu hóa', 'Mô tả'],
    Component: RadioDemo,
  },
  {
    id: 'search-input',
    name: 'SearchInput',
    category: 'Biểu mẫu',
    description: 'Ô tìm kiếm có nút xóa và demo filter.',
    testCases: ['Nhập liệu', 'Nút xóa', 'Số kết quả'],
    Component: SearchInputDemo,
  },
  {
    id: 'select',
    name: 'Select',
    category: 'Biểu mẫu',
    description: 'Danh sách lựa chọn có validation.',
    testCases: ['Giá trị select', 'Placeholder', 'Option vô hiệu hóa'],
    Component: SelectDemo,
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    category: 'Điều hướng',
    description: 'Thanh điều hướng dọc.',
    testCases: ['Mục active', 'Mục vô hiệu hóa', 'Footer'],
    Component: SidebarDemo,
  },
  {
    id: 'spinner',
    name: 'Spinner',
    category: 'Phản hồi',
    description: 'Trạng thái đang tải.',
    testCases: ['Kích thước', 'Label', 'Bật/tắt loading'],
    Component: SpinnerDemo,
  },
  {
    id: 'table',
    name: 'Table',
    category: 'Dữ liệu',
    description: 'Bảng dữ liệu, chọn dòng và phân trang.',
    testCases: ['Chọn dòng', 'Chọn tất cả', 'Empty state'],
    Component: TableDemo,
  },
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'Điều hướng',
    description: 'Chuyển đổi nội dung theo tab.',
    testCases: ['Tab active có điều khiển', 'Tab vô hiệu hóa', 'Đổi nội dung'],
    Component: TabsDemo,
  },
  {
    id: 'textarea',
    name: 'Textarea',
    category: 'Biểu mẫu',
    description: 'Ô nhập nhiều dòng có counter.',
    testCases: ['Value có điều khiển', 'Bộ đếm', 'Ngưỡng lỗi'],
    Component: TextareaDemo,
  },
  {
    id: 'toggle',
    name: 'Toggle',
    category: 'Biểu mẫu',
    description: 'Công tắc bật tắt.',
    testCases: ['Trạng thái checked', 'Vô hiệu hóa', 'Mô tả'],
    Component: ToggleDemo,
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'Phản hồi',
    description: 'Gợi ý hiện khi hover.',
    testCases: ['Kích hoạt hover', 'Nội dung động', 'Focus bàn phím'],
    Component: TooltipDemo,
  },
  {
    id: 'upload',
    name: 'Upload',
    category: 'Biểu mẫu',
    description: 'Vùng chọn tệp tải lên.',
    testCases: ['Chọn tệp', 'Định dạng hỗ trợ', 'Helper text'],
    Component: UploadDemo,
  },
]

export const componentTestCategories = Array.from(
  new Set(componentTestEntries.map((entry) => entry.category)),
)

export const getComponentTestEntry = (id: string | undefined) =>
  componentTestEntries.find((entry) => entry.id === id)
