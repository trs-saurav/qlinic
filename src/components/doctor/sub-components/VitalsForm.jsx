import { Input } from '@/components/ui/input'

export default function VitalsForm({ vitals, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...vitals, [field]: value })
  }

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vitals Check</h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
         <div>
            <label className="text-xs text-slate-500 mb-1 block">BP (mmHg)</label>
            <div className="flex items-center gap-1">
               <Input 
                  placeholder="120" 
                  className="h-8 text-sm px-2" 
                  value={vitals.bpSystolic || ''}
                  onChange={e => handleChange('bpSystolic', e.target.value)}
               />
               <span className="text-slate-300">/</span>
               <Input 
                  placeholder="80" 
                  className="h-8 text-sm px-2"
                  value={vitals.bpDiastolic || ''}
                  onChange={e => handleChange('bpDiastolic', e.target.value)}
               />
            </div>
         </div>
         {[
           { label: 'Temp (°F)', key: 'temperature', ph: '98.6' },
           { label: 'Pulse (bpm)', key: 'heartRate', ph: '72' },
           { label: 'SpO2 (%)', key: 'spo2', ph: '99' },
           { label: 'Weight (kg)', key: 'weight', ph: '70' },
         ].map(field => (
           <div key={field.key}>
              <label className="text-xs text-slate-500 mb-1 block">{field.label}</label>
              <Input 
                 placeholder={field.ph} 
                 className="h-8 text-sm"
                 value={vitals[field.key] || ''}
                 onChange={e => handleChange(field.key, e.target.value)}
              />
           </div>
         ))}
      </div>
    </div>
  )
}
