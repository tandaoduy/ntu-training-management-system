import { Link, Navigate, useParams } from 'react-router-dom'

import { getComponentTestEntry } from './componentTestRegistry'

export default function ComponentPreviewPage() {
  const { componentId } = useParams()
  const entry = getComponentTestEntry(componentId)

  if (!entry) {
    return <Navigate to="/component-test" replace />
  }

  const Preview = entry.Component

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <Link
            to="/component-test"
            className="text-sm font-medium text-sky-700 underline underline-offset-4 hover:text-sky-800"
          >
            Quay lại danh sách component
          </Link>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {entry.category}
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {entry.testCases.length} kịch bản
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">Test component: {entry.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{entry.description}</p>
            </div>
            <code className="w-fit rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
              @/components/{entry.id}
            </code>
          </div>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Preview />
        </section>
      </div>
    </main>
  )
}
