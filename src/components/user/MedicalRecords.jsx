'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import toast from 'react-hot-toast'
import { 
  FileText, Upload, Download, Eye, Trash2, Calendar, User, 
  FileCheck, Image as ImageIcon, File, AlertCircle, Loader2, Ban
} from 'lucide-react'

// You can move this limit to an ENV variable or config file later
const MAX_RECORDS = 4

export default function MedicalRecords() {
  const [records, setRecords] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'Lab Report',
    familyMemberId: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // Initial Fetch
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch both records and family members
      const [recordsRes, familyRes] = await Promise.all([
        fetch('/api/patient/records'),
        fetch('/api/patient/family')
      ])
      
      const recordsData = await recordsRes.json()
      const familyData = await familyRes.json()

      if (recordsData.success) {
        setRecords(recordsData.records || [])
      }

      if (familyData.success) {
        // Handle different API response structures (just in case)
        const members = familyData.familyMembers || familyData.members || []
        setFamilyMembers(members)
        
        // Auto-select "Self" if available
        const self = members.find(m => m.relationship === 'Self')
        if (self) {
            setUploadForm(prev => ({ ...prev, familyMemberId: self._id }))
        } else if (members.length > 0) {
            // Or just pick the first one
            setUploadForm(prev => ({ ...prev, familyMemberId: members[0]._id }))
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load records')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // 10MB Limit
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPG, and PNG files are allowed')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (records.length >= MAX_RECORDS) {
      toast.error('Record limit reached')
      return
    }
    if (!selectedFile) return toast.error('Please select a file')
    if (!uploadForm.title.trim()) return toast.error('Please enter a title')
    if (!uploadForm.familyMemberId) return toast.error('Please select a family member')

    const loadingToast = toast.loading('Uploading record...')
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', uploadForm.title)
      formData.append('type', uploadForm.type)
      formData.append('familyMemberId', uploadForm.familyMemberId)
      formData.append('date', uploadForm.date)
      formData.append('notes', uploadForm.notes)

      const response = await fetch('/api/patient/records', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ Uploaded successfully', { id: loadingToast })
        
        // Update Local State with the NEW populated record
        // This makes the UI update immediately without refresh
        if (data.record) {
             setRecords(prev => [data.record, ...prev])
        } else {
             fetchData() // Fallback if API doesn't return record
        }

        // Reset Form
        setIsUploadModalOpen(false)
        setSelectedFile(null)
        setUploadForm(prev => ({
          ...prev, title: '', notes: '', type: 'Lab Report'
        }))

      } else {
        toast.error(data.error || 'Upload failed', { id: loadingToast })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (recordId) => {
    if (!confirm('Permanently delete this record?')) return

    const loadingToast = toast.loading('Deleting...')
    try {
      const response = await fetch(`/api/patient/records/${recordId}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Deleted successfully', { id: loadingToast })
        // Update Local State
        setRecords(prev => prev.filter(r => r._id !== recordId))
      } else {
        toast.error('Failed to delete', { id: loadingToast })
      }
    } catch (error) {
      toast.error('Error deleting record', { id: loadingToast })
    }
  }

  // --- Helpers ---
  const recordTypes = [
    'Lab Report', 'Prescription', 'X-Ray', 'MRI Scan', 'CT Scan',
    'Ultrasound', 'ECG', 'Blood Test', 'Vaccination', 'Discharge Summary', 'Other'
  ]

  const getRecordIcon = (type) => {
    const icons = {
      'Lab Report': FileCheck, 'Prescription': FileText, 'X-Ray': ImageIcon,
      'MRI Scan': ImageIcon, 'CT Scan': ImageIcon, 'Ultrasound': ImageIcon,
      'ECG': FileCheck, 'Blood Test': FileCheck, 'Vaccination': FileText,
      'Discharge Summary': FileText, 'Other': File
    }
    return icons[type] || File
  }

  const getTypeColor = (type) => {
    const colors = {
      'Lab Report': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'Prescription': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      'X-Ray': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'ECG': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      'Blood Test': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    }
    return colors[type] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }

  // Limit Logic
  const usagePercentage = Math.min((records.length / MAX_RECORDS) * 100, 100)
  const isLimitReached = records.length >= MAX_RECORDS

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-1">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2 flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Medical Records</h2>
          <p className="text-muted-foreground">Keep track of your health history safely.</p>
          
          {/* Usage Bar */}
          <div className="max-w-xs space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-medium">
              <span className={isLimitReached ? "text-destructive" : "text-muted-foreground"}>
                {records.length} / {MAX_RECORDS} uploads used
              </span>
              {isLimitReached && <span className="text-destructive flex items-center gap-1"><Ban className="w-3 h-3"/> Limit Reached</span>}
            </div>
            <Progress value={usagePercentage} className={`h-2 ${isLimitReached ? "bg-destructive/20 [&>div]:bg-destructive" : ""}`} />
          </div>
        </div>

        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button size="lg" disabled={isLimitReached} className={isLimitReached ? "opacity-80" : "shadow-sm"}>
              <Upload className="w-4 h-4 mr-2" />
              {isLimitReached ? "Limit Reached" : "Upload Record"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpload} className="space-y-5 mt-2">
              
              {/* File Drop Area */}
              <div className="group relative">
                <input
                  type="file"
                  id="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                <div className={`
                  flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl transition-all
                  ${selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 bg-muted/30 group-hover:bg-muted/50 group-hover:border-primary/50'}
                `}>
                  {selectedFile ? (
                    <>
                      <FileCheck className="w-10 h-10 text-primary mb-2" />
                      <p className="text-sm font-medium text-primary">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-muted-foreground/50 mb-2 group-hover:text-primary/70 transition-colors" />
                      <p className="text-sm text-muted-foreground font-medium">Drop file here or click to browse</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">PDF, JPG, PNG (Max 10MB)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                  <Input id="title" value={uploadForm.title} onChange={e=>setUploadForm({...uploadForm, title:e.target.value})} placeholder="e.g. Blood Test" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={uploadForm.date} onChange={e=>setUploadForm({...uploadForm, date:e.target.value})} max={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={uploadForm.type} onValueChange={v=>setUploadForm({...uploadForm, type:v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {recordTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member">Family Member</Label>
                  <Select value={uploadForm.familyMemberId} onValueChange={v=>setUploadForm({...uploadForm, familyMemberId:v})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {familyMembers.map(m => (
                        <SelectItem key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.relationship})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <textarea 
                  id="notes" 
                  rows={2} 
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={uploadForm.notes}
                  onChange={e=>setUploadForm({...uploadForm, notes:e.target.value})}
                  placeholder="Add details..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={isUploading || !selectedFile}>
                  {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Upload
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content Grid */}
      {records.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {records.map((record) => {
            const RecordIcon = getRecordIcon(record.type)
            return (
              <Card key={record._id} className="group flex flex-col hover:shadow-lg transition-all dark:hover:border-primary/50 bg-card text-card-foreground overflow-hidden border-border/60">
                <CardContent className="p-5 flex-1 flex flex-col gap-4">
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-lg ${getTypeColor(record.type).split(' ')[0]}`}>
                      <RecordIcon className={`w-6 h-6 ${getTypeColor(record.type).split(' ')[1]}`} />
                    </div>
                    {/* Badge */}
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${getTypeColor(record.type)}`}>
                      {record.type}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-base leading-tight line-clamp-1" title={record.title}>{record.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/80 bg-muted/40 p-2 rounded-md mt-auto">
                    <User className="w-3.5 h-3.5" />
                    <span className="truncate">
                      {record.familyMemberId ? `${record.familyMemberId.firstName} ${record.familyMemberId.lastName}` : 'Self'}
                    </span>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5" asChild>
                      <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-3.5 h-3.5" /> View
                      </a>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(record._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No records found</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              Upload prescriptions, lab reports, and other medical documents to keep them organized.
            </p>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" /> Upload First Record
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
