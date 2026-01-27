export type Invoice = {
  id: string
  date: string
  amount: number | string
  status: 'Paid' | 'Unpaid' | string
}

export function exportInvoicesToCSV(invoices: Invoice[]) {
  const headers = ['Invoice ID', 'Date', 'Amount', 'Status']

  const rows = invoices.map(inv => [inv.id ?? '', inv.date ?? '', String(inv.amount ?? ''), inv.status ?? ''])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'billing-export.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default exportInvoicesToCSV
