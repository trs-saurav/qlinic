"use client"
import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Droplet, Heart, Microscope, Info, X } from 'lucide-react'

export default function LabResultsPage() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setTests([
        { id: 'LAB-001', name: 'Complete Blood Count', date: '2026-01-12', status: 'Normal', icon: Droplet, values: [{ key: 'Hemoglobin', value: '13.5 g/dL', range: '13.0-17.0' }] },
        { id: 'LAB-002', name: 'Lipid Profile', date: '2026-01-08', status: 'Pending', icon: Microscope, values: [] },
        { id: 'LAB-003', name: 'ECG Biomarkers', date: '2025-12-20', status: 'Abnormal', icon: Heart, values: [{ key: 'Troponin I', value: '0.45 ng/mL', range: '0.00-0.04' }] }
      ])
      setLoading(false)
    }, 420)
    return () => clearTimeout(t)
  }, [])

  const total = tests.length
  const pending = tests.filter(t => t.status === 'Pending').length
  const recent = useMemo(() => tests.reduce((d, t) => (t.date > d ? t.date : d), tests[0]?.date || ''), [tests])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Lab Results</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Review your recent lab test results.</p>
          </div>
          <Link href="/user" className="text-sm text-gray-600 dark:text-gray-300 underline">Back</Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <Droplet className="w-6 h-6 text-sky-600" />
                <div>
                  <div className="text-xs text-gray-500">Total results</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{loading ? '—' : total}</div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <Microscope className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="text-xs text-gray-500">Pending tests</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{loading ? '—' : pending}</div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <Info className="w-6 h-6 text-amber-600" />
                <div>
                  <div className="text-xs text-gray-500">Most recent</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{loading ? '—' : recent}</div>
                </div>
              </motion.div>
            </div>

          </div>

          <div className="mb-3 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400" />
            <span>Your lab results are for informational purposes and do not replace a doctor's advice.</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="p-3">Test</th>
                  <th className="p-3 w-32">Date</th>
                  <th className="p-3 w-36">Status</th>
                  <th className="p-3 w-36 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="p-3" colSpan={4}><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} /></td>
                    </tr>
                  ))
                ) : (
                  tests.map(t => (
                    <motion.tr key={t.id} className="border-t border-gray-100 dark:border-gray-700 group hover:shadow-md hover:bg-white dark:hover:bg-gray-900 transform transition" whileHover={{ y: -4 }}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <t.icon className="w-6 h-6 text-slate-500" />
                          <div>
                            <div className="font-medium text-gray-800 dark:text-white">{t.name}</div>
                            <div className="text-xs text-gray-500">{t.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">{t.date}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${t.status === 'Normal' ? 'bg-emerald-50 text-emerald-700' : t.status === 'Abnormal' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'}`}>{t.status}</span>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => setSelected(t)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition transform hover:scale-102">
                          View Report
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal / side panel */}
          {selected ? (
            <div className="fixed inset-0 z-50 flex">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40" onClick={() => setSelected(null)} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300 }} className="ml-auto w-full sm:w-96 bg-white dark:bg-gray-800 h-full shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-500">{selected.name}</div>
                    <div className="text-xs text-gray-400">{selected.id} • {selected.date}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {selected.values && selected.values.length ? (
                    selected.values.map((v, i) => (
                      <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{v.key}</div>
                          <div className="text-sm text-gray-600">{v.value}</div>
                        </div>
                        <div className="text-xs text-gray-500">Normal range: {v.range}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="text-sm text-gray-600">Results are pending for this test. We'll notify you when they're available.</div>
                    </div>
                  )}

                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
                    For any concerns, consult your doctor.
                  </div>
                </div>
              </motion.div>
            </div>
          ) : null}

        </motion.div>
      </div>
    </div>
  )
}
