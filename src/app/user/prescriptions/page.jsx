"use client"
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, Pill as PillIcon, User, Download, Loader2 } from 'lucide-react'
import exportPrescriptionsToCSV from '../../../lib/exportPrescriptions'

export default function PrescriptionsPage() {
  const [loading, setLoading] = useState(true)
  const [prescriptions, setPrescriptions] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    // simulate fetch
    const t = setTimeout(() => {
      setPrescriptions([
        { id: 'rx-001', date: '2026-01-10', doctor: 'Dr. Rajesh Kumar', meds: [ { name: 'Aspirin', dose: '75mg', type: 'Ongoing', refills: 2 } ], notes: 'Take once daily after food' },
        { id: 'rx-002', date: '2025-12-02', doctor: 'Dr. Priya Sharma', meds: [ { name: 'Amoxicillin', dose: '500mg', type: 'Completed', refills: 0 } ], notes: 'Twice daily for 7 days' }
      ])
      setLoading(false)
    }, 550)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    return prescriptions.filter(p => {
      if (statusFilter !== 'all') {
        const any = p.meds.some(m => (statusFilter === 'ongoing') ? m.type === 'Ongoing' : m.type === 'Completed')
        if (!any) return false
      }
      if (query.trim()) {
        const q = query.toLowerCase()
        return p.doctor.toLowerCase().includes(q) || p.meds.some(m => m.name.toLowerCase().includes(q))
      }
      return true
    })
  }, [prescriptions, query, statusFilter])

  const activeCount = prescriptions.length
  const lastUpdated = prescriptions[0]?.date || ''
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState('')

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">Prescriptions</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">View your current and past prescriptions.</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={async () => {
                  try {
                    setExporting(true)
                    // export the currently visible (filtered) prescriptions
                    await new Promise((res) => setTimeout(res, 250))
                    exportPrescriptionsToCSV(filtered.length ? filtered : prescriptions)
                    setToast('Prescriptions export started')
                    setTimeout(() => setToast(''), 3000)
                  } catch (err) {
                    console.error('Export failed', err)
                    setToast('Export failed')
                    setTimeout(() => setToast(''), 3000)
                  } finally {
                    setExporting(false)
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                aria-disabled={exporting}
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting ? 'Exporting…' : 'Export Prescriptions'}
              </button>
            </div>
          </div>

          {/* Summary + filters */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <PillIcon className="w-4 h-4 text-amber-600" />
                <span className="font-medium">{activeCount} active prescriptions</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <User className="w-4 h-4 text-sky-600" />
                <span className="text-gray-500">Last updated {lastUpdated}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search doctor or medication" className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
                <option value="all">All</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Table / content */}
          <div className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="p-3 w-24">ID</th>
                    <th className="p-3 w-36">Date</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Medication</th>
                    <th className="p-3 w-24">Refills</th>
                    <th className="p-3 w-28">Status</th>
                    <th className="p-3 w-32 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    // skeleton rows
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="p-3" colSpan={7}>
                          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    filtered.map((r) => (
                      <motion.tr
                        key={r.id}
                        className="border-t border-gray-100 dark:border-gray-700 group"
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.18 }}
                      >
                        <td className="p-3 font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">{r.id}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.date}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-200">
                          <Link href={`/user/doctors/${r.doctor?.replace(/\s+/g, '-').toLowerCase()}`} className="text-blue-600 dark:text-blue-400 hover:underline">{r.doctor}</Link>
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-200">
                          {r.meds.map((m, idx) => (
                            <div key={idx} className="flex gap-2 flex-wrap items-center">
                              <span className="font-semibold text-slate-800 dark:text-white">{m.name} {m.dose}</span>
                            </div>
                          ))}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-200">{r.meds[0]?.refills ?? 0}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${r.meds[0]?.type === 'Ongoing' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                            {r.meds[0]?.type}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <motion.div whileHover={{ scale: 1.04 }} className="inline-flex">
                            <Link href={`/user/prescriptions/${r.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white">
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </motion.div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
            <div className="inline-flex items-center gap-2"><PillIcon className="w-4 h-4 text-amber-600" /> Medication</div>
            <div className="inline-flex items-center gap-2"><User className="w-4 h-4 text-sky-600" /> Prescribing doctor</div>
            <div className="inline-flex items-center gap-2"> <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs">Ongoing</span> active</div>
          </div>
          {toast ? (
            <div className="fixed right-4 bottom-6 z-50">
              <div className="px-4 py-2 rounded-lg bg-black text-white text-sm shadow-lg">{toast}</div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}
