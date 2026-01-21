import React from 'react'
import Link from 'next/link'

const MOCK = {
  'LAB-001': { id: 'LAB-001', name: 'Complete Blood Count', date: '2026-01-12', status: 'Available', results: [ { name: 'WBC', value: '6.1', unit: '10^3/uL' }, { name: 'RBC', value: '4.8', unit: '10^6/uL' } ] },
  'LAB-002': { id: 'LAB-002', name: 'Lipid Profile', date: '2026-01-08', status: 'Pending', results: [] }
}

export default function LabResultDetails({ params }) {
  const { id } = params || {}
  const t = MOCK[id]

  if (!t) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Test not found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Test {id} was not found in demo data.</p>
          <div className="mt-6">
            <Link href="/user/lab-results" className="text-blue-600 underline">Back to lab results</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t.name}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.date} • {t.status}</p>
          </div>
          <Link href="/user/lab-results" className="text-sm text-gray-600 dark:text-gray-300 underline">Back</Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          {t.status === 'Pending' ? (
            <div className="text-gray-600 dark:text-gray-400">Results are pending. You will be notified when available.</div>
          ) : (
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Results</h2>
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {t.results.map((r, i) => (
                  <li key={i} className="py-3 flex justify-between text-gray-700 dark:text-gray-200">{r.name} <span>{r.value} {r.unit}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
