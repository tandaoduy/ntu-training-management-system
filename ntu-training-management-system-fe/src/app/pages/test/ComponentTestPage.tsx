import { Link } from 'react-router-dom'

type ComponentEntry = {
  name: string
  path: string
  description: string
  status: 'ready' | 'pending'
}

const COMPONENTS: ComponentEntry[] = [
  {
    name: 'Alert',
    path: '/component-test/alert',
    description: 'Thông báo trạng thái theo variant success, error, warning, info.',
    status: 'ready',
  },
  {
    name: 'Subnav',
    path: '/component-test/subnav',
    description: 'Khu vực test riêng cho thanh điều hướng phụ (sub-navigation).',
    status: 'pending',
  },
]

export default function ComponentTestPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Component Test Hub</h1>
          <p className="mt-2 text-sm text-slate-600">
            Chọn một component bên dưới để đi đến trang test riêng.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {COMPONENTS.map((component) => (
            <Link
              key={component.name}
              to={component.path}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{component.name}</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    component.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {component.status === 'ready' ? 'Sẵn sàng' : 'Đang chuẩn bị'}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">{component.description}</p>
              <p className="mt-3 text-sm font-medium text-sky-700">Mở trang test</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
