import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CalendarPlus } from 'lucide-react'

export default function RescheduleModal({ isOpen, onClose, data, setData, onConfirm }) {
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1) // Minimum 1 day in advance
  const minDateStr = minDate.toISOString().split('T')[0]

  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3) // Maximum 3 months ahead
  const maxDateStr = maxDate.toISOString().split('T')[0]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CalendarPlus className="w-6 h-6 text-blue-600" />
            Reschedule Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Please reschedule at least 24 hours before your appointment time.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                New Appointment Date
              </label>
              <Input
                type="date"
                value={data.newDate}
                onChange={(e) => setData({ ...data, newDate: e.target.value })}
                min={minDateStr}
                max={maxDateStr}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Preferred Time
              </label>
              <Input
                type="time"
                value={data.newTime}
                onChange={(e) => setData({ ...data, newTime: e.target.value })}
                className="w-full"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Consultation hours: 9:00 AM - 6:00 PM
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Reason for Reschedule
              </label>
              <Input
                value={data.reason}
                onChange={(e) => setData({ ...data, reason: e.target.value })}
                placeholder="e.g., Personal emergency, conflicting appointment"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Additional Instructions
              </label>
              <Textarea
                value={data.instructions}
                onChange={(e) => setData({ ...data, instructions: e.target.value })}
                placeholder="Any special instructions for the clinic..."
                className="w-full"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onConfirm} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <CalendarPlus className="w-4 h-4 mr-2" />
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
