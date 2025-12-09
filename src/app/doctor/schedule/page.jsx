// app/doctor/schedule/page.jsx
import ScheduleManager from '@/components/doctor/ScheduleManager'

export default function SchedulePage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Work Schedule
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Set your availability and working hours at different hospitals
        </p>
      </div>
      <ScheduleManager />
    </>
  )
}
