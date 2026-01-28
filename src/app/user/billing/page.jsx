"use client"
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, Download, Loader2, FileText, CheckCircle, AlertTriangle, Calendar, Search } from 'lucide-react'
import exportInvoicesToCSV from '../../../lib/exportInvoices'

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setInvoices([
        { id: 'INV-1001', date: '2026-01-05', amount: 1200, status: 'Paid' },
        { id: 'INV-1002', date: '2025-12-15', amount: 3450, status: 'Unpaid' },
        { id: 'INV-1003', date: '2026-01-11', amount: 800, status: 'Unpaid' }
      ])
      setLoading(false)
    }, 480)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (statusFilter !== 'All' && inv.status !== statusFilter) return false
      if (query && !inv.id.toLowerCase().includes(query.toLowerCase())) return false
      if (fromDate && new Date(inv.date) < new Date(fromDate)) return false
      if (toDate && new Date(inv.date) > new Date(toDate)) return false
      return true
    })
  }, [invoices, statusFilter, query, fromDate, toDate])

  const totalDueThisMonth = useMemo(() => filtered.reduce((s, i) => (i.status !== 'Paid' ? s + Number(i.amount) : s), 0), [filtered])
  const totalPaid = useMemo(() => invoices.reduce((s, i) => (i.status === 'Paid' ? s + Number(i.amount) : s), 0), [invoices])
  const outstanding = useMemo(() => invoices.filter(i => i.status !== 'Paid').length, [invoices])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Billing</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">View and manage your billing history and invoices.</p>
          </div>
          <Link href="/user" className="text-sm text-gray-600 dark:text-gray-300 underline">Back</Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow">
          {/* summary strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[{
              key: 'due', title: 'Total due this month', value: `₹${totalDueThisMonth}`, icon: AlertTriangle, color: 'text-amber-600'
            }, {
              key: 'paid', title: 'Total paid', value: `₹${totalPaid}`, icon: CheckCircle, color: 'text-emerald-600'
            }, {
              key: 'out', title: 'Outstanding invoices', value: outstanding, icon: FileText, color: 'text-sky-600'
            }].map((card) => (
              <motion.div key={card.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                  <div>
                    <div className="text-xs text-gray-500">{card.title}</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{card.value}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* filters + export */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
                <option>All</option>
                <option>Paid</option>
                <option>Unpaid</option>
              </select>
              <div className="flex items-center gap-2">
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
              </div>
              <div className="relative">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoice ID" className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="w-full sm:w-auto flex justify-start sm:justify-end">
              <button
                onClick={async () => {
                  try {
                    setExporting(true)
                    await new Promise((r) => setTimeout(r, 200))
                    exportInvoicesToCSV(filtered.length ? filtered : invoices)
                    setToast('Billing export started')
                    setTimeout(() => setToast(''), 3000)
                  } catch (err) {
                    console.error(err)
                    setToast('Export failed')
                    setTimeout(() => setToast(''), 3000)
                  } finally {
                    setExporting(false)
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition transform hover:scale-102 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting ? 'Exporting…' : 'Export Billing'}
              </button>
            </div>
          </div>

          {/* table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="p-3">Invoice</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 w-40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="p-3" colSpan={5}><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${60 + i * 8}%` }} /></td>
                    </tr>
                  ))
                ) : (
                  filtered.map(inv => (
                    <motion.tr key={inv.id} className="border-t border-gray-100 dark:border-gray-700 group hover:shadow-md hover:bg-white dark:hover:bg-gray-900 transform transition" whileHover={{ y: -4 }}>
                      <td className="p-3 font-medium whitespace-nowrap">{inv.id}</td>
                      <td className="p-3 whitespace-nowrap">{inv.date}</td>
                      <td className="p-3">₹{inv.amount}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{inv.status}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link href={`/user/billing/${inv.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                          <button onClick={() => {
                            try {
                              const blob = new Blob([`Invoice ${inv.id} - ₹${inv.amount}`], { type: 'text/plain' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${inv.id}.txt`
                              document.body.appendChild(a)
                              a.click()
                              a.remove()
                              setTimeout(() => URL.revokeObjectURL(url), 1000)
                              setToast('Download started')
                              setTimeout(() => setToast(''), 2000)
                            } catch (err) {
                              console.error(err)
                            }
                          }} className="inline-flex items-center p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 transition">
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {toast ? (<div className="fixed right-4 bottom-6 z-50"><div className="px-4 py-2 rounded-lg bg-black text-white text-sm shadow-lg">{toast}</div></div>) : null}
        </motion.div>
      </div>
    </div>
  )
}
