import { Link } from 'react-router-dom'

export default function SubnavTestPage() {
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
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Component Test: Subnav</h1>
          <p className="mt-2 text-sm text-slate-600">
            Chưa có component Subnav trong dự án. Khi bạn thêm component Subnav, mình sẽ gắn bộ test tại trang này.
          </p>
        </header>
      </div>
    </main>
  )
}
