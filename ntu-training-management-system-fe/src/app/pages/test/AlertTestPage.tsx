import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Alert, { useAlert, type AlertVariant } from '../../../components/alert'

const VARIANT_LIST: AlertVariant[] = ['success', 'error', 'warning', 'info']

const LABELS: Record<AlertVariant, string> = {
  success: 'Thành công',
  error: 'Lỗi',
  warning: 'Cảnh báo',
  info: 'Thông tin',
}

const MESSAGES: Record<AlertVariant, string> = {
  success: 'Dữ liệu đã được cập nhật thành công.',
  error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
  warning: 'Bạn còn 1 bước nữa để hoàn tất thao tác.',
  info: 'Đây là khu vực dùng để test component Alert.',
}

function AlertTriggerPanel() {
  const { showAlert, clearAlerts } = useAlert()

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Trigger Alert (Provider + Hook)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Bấm nút để hiển thị alert nổi ở góc phải màn hình.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {VARIANT_LIST.map((variant) => (
          <button
            key={variant}
            type="button"
            onClick={() =>
              showAlert({
                variant,
                title: LABELS[variant],
                message: MESSAGES[variant],
                dismissible: true,
              })
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Test {LABELS[variant]}
          </button>
        ))}

        <button
          type="button"
          onClick={clearAlerts}
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
        >
          Xóa tất cả alert
        </button>
      </div>
    </div>
  )
}

export default function AlertTestPage() {
  const [activeVariant, setActiveVariant] = useState<AlertVariant>('info')
  const [showInlineDismissible, setShowInlineDismissible] = useState(true)

  const variantTitle = useMemo(() => LABELS[activeVariant], [activeVariant])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p>
            <Link
              to="/component-test"
              className="text-sm font-medium text-sky-700 underline underline-offset-4 hover:text-sky-800"
            >
              Quay lại danh sách component
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Component Test: Alert</h1>
          <p className="mt-2 text-sm text-slate-600">
            Trang này dùng để kiểm tra giao diện và hành vi của component Alert.
          </p>
        </header>

        <AlertTriggerPanel />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Alert Inline</h2>
          <p className="mt-1 text-sm text-slate-600">
            Chuyển đổi variant để xem giao diện từng loại alert.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {VARIANT_LIST.map((variant) => (
              <button
                key={variant}
                type="button"
                onClick={() => setActiveVariant(variant)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  activeVariant === variant
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {LABELS[variant]}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <Alert
              variant={activeVariant}
              title={`${variantTitle} (có tiêu đề)`}
              message={MESSAGES[activeVariant]}
            />

            <Alert
              variant={activeVariant}
              message={`Dạng không có tiêu đề của alert ${variantTitle.toLowerCase()}.`}
            />

            {showInlineDismissible && (
              <Alert
                variant={activeVariant}
                title="Có thể đóng"
                message="Alert này sử dụng dismissible và onDismiss để ẩn chính nó."
                dismissible
                onDismiss={() => setShowInlineDismissible(false)}
              />
            )}

            {!showInlineDismissible && (
              <button
                type="button"
                onClick={() => setShowInlineDismissible(true)}
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
              >
                Hiện lại alert dismissible
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
