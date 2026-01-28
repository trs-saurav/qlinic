import React from 'react'
import Link from 'next/link'

const MOCK = {
  'INV-1001': { id: 'INV-1001', date: '2026-01-05', amount: '₹1,200', status: 'Paid', items: [ { desc: 'Consultation', amount: '₹800' }, { desc: 'ECG', amount: '₹400' } ] },
  'INV-1002': { id: 'INV-1002', date: '2025-12-15', amount: '₹3,450', status: 'Unpaid', items: [ { desc: 'Lab Tests', amount: '₹2,500' }, { desc: 'Medication', amount: '₹950' } ] }
}

export default function InvoiceDetails({ params }) {
  const { id } = params || {}
  const inv = MOCK[id]

  if (!inv) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice not found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Invoice {id} was not found in demo data.</p>
          <div className="mt-6">
            <Link href="/user/billing" className="text-blue-600 underline">Back to billing</Link>
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
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Invoice {inv.id}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{inv.date} • {inv.status}</p>
          </div>
          <Link href="/user/billing" className="text-sm text-gray-600 dark:text-gray-300 underline">Back</Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Items</h2>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {inv.items.map((it, i) => (
              <li key={i} className="py-3 flex justify-between text-gray-700 dark:text-gray-200">{it.desc} <span>{it.amount}</span></li>
            ))}
          </ul>

          <div className="mt-4 text-right font-bold text-gray-900 dark:text-white">Total: {inv.amount}</div>
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 rounded bg-blue-600 text-white">Download</button>
            {inv.status !== 'Paid' && <button className="px-4 py-2 rounded border">Pay Now</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
