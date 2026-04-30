import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { componentTestCategories, componentTestEntries } from './componentTestRegistry'

export default function ComponentTestPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return componentTestEntries.filter((component) => {
      const matchCategory = category === 'all' || component.category === category
      const matchQuery =
        normalizedQuery.length === 0 ||
        component.name.toLowerCase().includes(normalizedQuery) ||
        component.description.toLowerCase().includes(normalizedQuery) ||
        component.testCases.some((testCase) => testCase.toLowerCase().includes(normalizedQuery))

      return matchCategory && matchQuery
    })
  }, [category, query])

  const categorySummary = componentTestCategories.map((item) => ({
    name: item,
    count: componentTestEntries.filter((entry) => entry.category === item).length,
  }))

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Kiểm thử component</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Trung tâm test component</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Mỗi component có trang test riêng với kịch bản thao tác, trạng thái trực tiếp và các biến thể
                cần kiểm tra trước khi dùng vào màn hình nghiệp vụ.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Component" value={componentTestEntries.length} />
              <Metric label="Nhóm" value={componentTestCategories.length} />
              <Metric
                label="Kịch bản"
                value={componentTestEntries.reduce((total, entry) => total + entry.testCases.length, 0)}
              />
            </div>
          </div>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              <span>Tìm component hoặc test case</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ví dụ: input, vô hiệu hóa, trạng thái rỗng..."
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-slate-700">
              <span>Nhóm</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                <option value="all">Tất cả</option>
                {componentTestCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả {componentTestEntries.length}
            </button>
            {categorySummary.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setCategory(item.name)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  category === item.name
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.name} {item.count}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEntries.map((component) => (
            <Link
              key={component.id}
              to={`/component-test/${component.id}`}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {component.category}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{component.name}</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Có thể test
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{component.description}</p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
                {component.testCases.slice(0, 3).map((testCase) => (
                  <li key={testCase}>- {testCase}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm font-semibold text-sky-700">Mở trang test</p>
            </Link>
          ))}
        </section>

        {filteredEntries.length === 0 && (
          <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            Không tìm thấy component phù hợp với bộ lọc hiện tại.
          </section>
        )}
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
  )
}
