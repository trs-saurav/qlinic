import React from 'react'
import Link from 'next/link'

const MOCK = {
  'rx-001': { id: 'rx-001', date: '2026-01-10', doctor: 'Dr. Rajesh Kumar', meds: [ { name: 'Aspirin', dose: '75mg', freq: 'Once daily' } ], notes: 'Take once daily after food' },
  'rx-002': { id: 'rx-002', date: '2025-12-02', doctor: 'Dr. Priya Sharma', meds: [ { name: 'Amoxicillin', dose: '500mg', freq: 'Twice daily' } ], notes: 'Finish the full course.' }
}

export default function PrescriptionDetails({ params }) {
  const { id } = params || {}
  const rx = MOCK[id]

  if (!rx) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prescription not found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">The prescription ID <strong>{id}</strong> does not exist in the demo data.</p>
          <div className="mt-6">
            <Link href="/user/prescriptions" className="text-blue-600 underline">Back to prescriptions</Link>
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
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Prescription {rx.id}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Issued on {rx.date} by {rx.doctor}</p>
          </div>
          <Link href="/user/prescriptions" className="text-sm text-gray-600 dark:text-gray-300 underline">Back</Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Medications</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-200">
            {rx.meds.map((m, i) => (
              <li key={i}><strong>{m.name}</strong> — {m.dose} • {m.freq}</li>
            ))}
          </ul>

          {rx.notes && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <strong>Notes:</strong> {rx.notes}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Download PDF</button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">Request Refill</button>
          </div>
        </div>
      </div>
    </div>
  )
}
