import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CalendarPlus } from 'lucide-react'

export default function NextVisitBookingModal({ isOpen, onClose, data, setData, onSuccess }) {
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async () => {
    setIsCreating(true)
    await onSuccess() // Parent handles the API call
    setIsCreating(false)
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CalendarPlus className="w-6 h-6 text-purple-600" />
            Book Follow-up Appointment
          </DialogTitle>    
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-800">
              <strong>Follow-up Visit:</strong> Schedule a follow-up appointment with the same doctor and hospital as your previous visit.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Appointment Date
              </label>
              <Input
                type="date"
                value={data.scheduledDate}
                onChange={(e) => setData({ ...data, scheduledDate: e.target.value })}
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
                value={data.scheduledTime}
                onChange={(e) => setData({ ...data, scheduledTime: e.target.value })}
                className="w-full" 
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Consultation hours: 9:00 AM - 6:00 PM
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Reason for Visit
              </label>
              <Input
                value={data.reason}
                onChange={(e) => setData({ ...data, reason: e.target.value })}
                placeholder="Follow-up for previous consultation..."
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
                placeholder="Any special instructions for the doctor..."
                className="w-full"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={isCreating}
            >
              {isCreating ? 'Booking...' : 'Book Appointment'}
              <CalendarPlus className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
