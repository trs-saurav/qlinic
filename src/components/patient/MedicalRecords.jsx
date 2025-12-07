// src/components/patient/MedicalRecords.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'
import { 
  FileText, Upload, Download, Eye, Trash2, Calendar, User, 
  FileCheck, Image as ImageIcon, File, Share2 
} from 'lucide-react'

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

  useEffect(() => {
    fetchRecords()
    fetchFamilyMembers()
  }, [])

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/patient/records')
      const data = await response.json()

      if (data.records) {
        setRecords(data.records)
      }
    } catch (error) {
      console.error('Error fetching records:', error)
      toast.error('Failed to load medical records')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch('/api/patient/family')
      const data = await response.json()

      if (data.familyMembers) {
        setFamilyMembers(data.familyMembers)
        // Auto-select self
        const self = data.familyMembers.find(m => m.relationship === 'Self')
        if (self) {
          setUploadForm(prev => ({ ...prev, familyMemberId: self._id }))
        }
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPG, and PNG files are allowed')
        return
      }
      setSelectedFile(file)
      toast.success(`${file.name} selected`)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (!selectedFile) {
      toast.error('Please select a file')
      return
    }

    if (!uploadForm.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!uploadForm.familyMemberId) {
      toast.error('Please select a family member')
      return
    }

    const loadingToast = toast.loading('Uploading record...')

    try {
      setIsUploading(true)
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
        toast.success('✅ Record uploaded successfully', { id: loadingToast })
        setIsUploadModalOpen(false)
        setSelectedFile(null)
        setUploadForm({
          title: '',
          type: 'Lab Report',
          familyMemberId: '',
          date: new Date().toISOString().split('T')[0],
          notes: ''
        })
        fetchRecords()
      } else {
        toast.error(data.error || 'Upload failed', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error uploading record:', error)
      toast.error('Something went wrong', { id: loadingToast })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (recordId) => {
    if (!confirm('Are you sure you want to delete this record?')) return

    const loadingToast = toast.loading('Deleting record...')

    try {
      const response = await fetch(`/api/patient/records/${recordId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Record deleted successfully', { id: loadingToast })
        fetchRecords()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete record', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error('Something went wrong', { id: loadingToast })
    }
  }

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
      'Lab Report': 'bg-blue-100 text-blue-700', 'Prescription': 'bg-green-100 text-green-700',
      'X-Ray': 'bg-purple-100 text-purple-700', 'MRI Scan': 'bg-purple-100 text-purple-700',
      'CT Scan': 'bg-purple-100 text-purple-700', 'Ultrasound': 'bg-purple-100 text-purple-700',
      'ECG': 'bg-red-100 text-red-700', 'Blood Test': 'bg-orange-100 text-orange-700',
      'Vaccination': 'bg-green-100 text-green-700', 'Discharge Summary': 'bg-slate-100 text-slate-700',
      'Other': 'bg-slate-100 text-slate-700'
    }
    return colors[type] || colors['Other']
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Medical Records</h2>
          <p className="text-slate-500 mt-1">Store and manage your health documents</p>
        </div>

        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Upload className="w-5 h-5" />
              Upload Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Medical Record</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpload} className="space-y-6">
              {/* File Upload */}
              <div>
                <Label htmlFor="file">Select File <span className="text-red-500">*</span></Label>
                <div className="mt-2">
                  <label 
                    htmlFor="file" 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    {selectedFile ? (
                      <div className="text-center p-4">
                        <File className="w-8 h-8 mx-auto text-primary mb-2" />
                        <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="text-center p-6">
                        <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG (max 10MB)</p>
                      </div>
                    )}
                  </label>
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                    placeholder="e.g., Blood Test Report - 15 Dec 2025"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type <span className="text-red-500">*</span></Label>
                  <Select value={uploadForm.type} onValueChange={v => setUploadForm({...uploadForm, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {recordTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="member">For Family Member <span className="text-red-500">*</span></Label>
                  <Select value={uploadForm.familyMemberId} onValueChange={v => setUploadForm({...uploadForm, familyMemberId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select family member" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers.map(member => (
                        <SelectItem key={member._id} value={member._id}>
                          {member.firstName} {member.lastName} ({member.relationship})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="date"
                    type="date"
                    value={uploadForm.date}
                    onChange={e => setUploadForm({...uploadForm, date: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <textarea
                  id="notes"
                  rows={3}
                  value={uploadForm.notes}
                  onChange={e => setUploadForm({...uploadForm, notes: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-vertical"
                  placeholder="Any additional notes about this record..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isUploading || !selectedFile}>
                  {isUploading ? 'Uploading...' : 'Upload Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats & Records Grid - [Previous code remains same but fixed familyMemberId display] */}
      {/* ... rest of the component stays the same ... */}
      {records.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => {
            const RecordIcon = getRecordIcon(record.type)
            const memberName = record.familyMemberId?.firstName 
              ? `${record.familyMemberId.firstName} ${record.familyMemberId.lastName}`
              : 'Self'
            return (
              <Card key={record._id} className="hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <RecordIcon className="w-6 h-6 text-primary" />
                      </div>
                      <Badge className={getTypeColor(record.type)}>
                        {record.type}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-2">{record.title}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(record.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    {record.familyMemberId && (
                      <p className="text-sm text-slate-600 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {memberName}
                      </p>
                    )}
                    {record.notes && (
                      <p className="text-xs text-slate-500 line-clamp-2">{record.notes}</p>
                    )}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-1" />
                        <a href={record.fileUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">Download</a>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0"
                        onClick={() => handleDelete(record._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-slate-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No medical records yet</p>
              <p className="text-sm mt-2">Upload your reports and documents to keep them safe</p>
              <Button className="mt-4" onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload First Record
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
