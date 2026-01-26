import { Input } from '@/components/ui/input'
import { useEffect } from 'react'

export default function VitalsForm({ vitals, onChange }) {
  const handleChange = (field, value) => {
    console.log(`🔄 VitalsForm: Changing ${field} from '${vitals[field]}' to '${value}'`);
    onChange({ ...vitals, [field]: value })
  }

  // Helper to determine if a vital field has a value
  const hasValue = (field) => {
    const val = vitals[field];
    return val !== undefined && val !== null && val !== '';
  };

  // Helper to get display class based on whether value exists
  const getInputClass = (field) => {
    const baseClass = "h-8 text-sm px-2";
    return hasValue(field) 
      ? `${baseClass} bg-green-50 border-green-200 focus:border-green-400 focus:ring-green-400` 
      : `${baseClass} bg-background`;
  };

  // Log vitals whenever they change
  useEffect(() => {
    console.log('📋 VitalsForm: Current vitals state:', vitals);
  }, [vitals]);

  return (
    <div className="bg-background p-4 rounded-xl border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Vitals Check</h4>
        {hasValue('bpSystolic') || hasValue('bpDiastolic') || hasValue('temperature') || hasValue('weight') || hasValue('spo2') || hasValue('heartRate') ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Values recorded
          </span>
        ) : (
          <span className="text-xs text-foreground/40">Enter values</span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
         <div>
            <label className="text-xs text-foreground/60 mb-1 block">BP (mmHg)</label>
            <div className="flex items-center gap-1">
               <Input 
                  placeholder="120" 
                  className={getInputClass('bpSystolic')}
                  value={vitals.bpSystolic || ''}
                  onChange={e => handleChange('bpSystolic', e.target.value)}
               />
               <span className="text-slate-300">/</span>
               <Input 
                  placeholder="80" 
                  className={getInputClass('bpDiastolic')}
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
              <label className="text-xs text-foreground/60 mb-1 block flex items-center gap-1">
                {field.label}
                {hasValue(field.key) && (
                  <span className="text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </label>
              <Input 
                 placeholder={field.ph} 
                 className={getInputClass(field.key)}
                 value={vitals[field.key] || ''}
                 onChange={e => handleChange(field.key, e.target.value)}
              />
           </div>
         ))}
      </div>
    </div>
  )
}