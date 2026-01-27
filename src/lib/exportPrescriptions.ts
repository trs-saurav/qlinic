export type Prescription = {
  id: string
  date: string
  doctor: string
  notes?: string
  meds: Array<{ name: string; dose: string; type?: string; refills?: number }>
}

export function exportPrescriptionsToCSV(prescriptions: Prescription[]) {
  const headers = ['Medication', 'Dosage', 'Doctor', 'Date', 'Status', 'Refills']

  const rows: string[][] = []
  prescriptions.forEach((p) => {
    p.meds.forEach((m) => {
      rows.push([
        m.name ?? '',
        m.dose ?? '',
        p.doctor ?? '',
        p.date ?? '',
        m.type ?? '',
        (m.refills ?? '').toString(),
      ])
    })
  })

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'prescriptions-export.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default exportPrescriptionsToCSV
