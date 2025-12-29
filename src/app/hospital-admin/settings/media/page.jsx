'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  Info,
  Building2,
  ImagePlus,
  Trash2,
  Eye,
  Sparkles,
  Image as ImageIcon,
  AlertCircle,
  Download,
  Maximize2
} from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useHospitalAdmin } from '@/context/HospitalAdminContext'

export default function HospitalMediaGalleryPage() {
  const { hospital } = useHospitalAdmin()
  
  const [hospitalId, setHospitalId] = useState(null)
  const [hospitalName, setHospitalName] = useState('')
  const [media, setMedia] = useState({
    logo: null,
    coverPhoto: null,
    facilityPhotos: [null, null, null, null, null, null]
  })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})
  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {
    if (hospital?._id) {
      fetchMedia()
    }
  }, [hospital?._id])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/hospital/media')
      const data = await res.json()

      if (res.ok) {
        setHospitalId(data.hospitalId)
        setHospitalName(data.hospitalName || 'Hospital')
        setMedia({
          logo: data.media.logo,
          coverPhoto: data.media.coverPhoto,
          facilityPhotos: data.media.facilityPhotos?.length 
            ? [...data.media.facilityPhotos, ...Array(6 - data.media.facilityPhotos.length).fill(null)].slice(0, 6)
            : [null, null, null, null, null, null]
        })
      } else {
        toast.error(data.error || 'Failed to load media')
      }
    } catch (error) {
      console.error('Failed to fetch media:', error)
      toast.error('Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (file, type, index) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file', { icon: '⚠️' })
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image must be less than 3MB', { icon: '⚠️' })
      return
    }

    const uploadKey = index !== undefined ? `facilityPhoto${index}` : type
    setUploading(prev => ({ ...prev, [uploadKey]: true }))
    setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }))

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [uploadKey]: Math.min((prev[uploadKey] || 0) + 10, 90)
        }))
      }, 200)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type === 'facilityPhoto' ? 'facilityPhoto' : type)
      
      const idToUse = hospitalId || hospital?._id
      if (idToUse) {
        formData.append('hospitalId', idToUse)
      }

      const uploadRes = await fetch('/api/hospital/media/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || uploadData.details || 'Upload failed')
      }

      setUploadProgress(prev => ({ ...prev, [uploadKey]: 100 }))

      const updateRes = await fetch('/api/hospital/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type === 'facilityPhoto' ? 'facilityPhoto' : type,
          url: uploadData.url,
          index: index
        })
      })

      const updateData = await updateRes.json()

      if (!updateRes.ok) {
        throw new Error(updateData.error || 'Failed to save')
      }

      setMedia({
        logo: updateData.media.logo,
        coverPhoto: updateData.media.coverPhoto,
        facilityPhotos: updateData.media.facilityPhotos?.length 
          ? [...updateData.media.facilityPhotos, ...Array(6 - updateData.media.facilityPhotos.length).fill(null)].slice(0, 6)
          : [null, null, null, null, null, null]
      })

      const uploadedSize = (uploadData.size / 1024).toFixed(0)
      const savings = (((file.size - uploadData.size) / file.size) * 100).toFixed(0)
      
      toast.success(`Uploaded! ${savings}% smaller`, { icon: '✅', duration: 3000 })

    } catch (error) {
      console.error('❌ Upload error:', error)
      toast.error(error.message || 'Upload failed', { icon: '❌' })
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }))
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[uploadKey]
          return newProgress
        })
      }, 1000)
    }
  }

  const handleDelete = async (type, index) => {
    if (!confirm('Delete this photo?')) return

    try {
      const params = new URLSearchParams({ type })
      if (index !== undefined) {
        params.append('index', index.toString())
      }

      const res = await fetch(`/api/hospital/media/delete?${params}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete')
      }

      setMedia({
        logo: data.media.logo,
        coverPhoto: data.media.coverPhoto,
        facilityPhotos: data.media.facilityPhotos?.length 
          ? [...data.media.facilityPhotos, ...Array(6 - data.media.facilityPhotos.length).fill(null)].slice(0, 6)
          : [null, null, null, null, null, null]
      })

      toast.success('Photo deleted', { icon: '🗑️' })

    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete')
    }
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <ImagePlus className="w-5 h-5 text-white" />
              </div>
              Media Gallery
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage {hospitalName}'s photos and branding
            </p>
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <span className="font-semibold">Image Requirements:</span> Max 3MB • Auto-optimized to WebP • Logo: 200x200 | Cover: 1000x300 | Facilities: 600x450
              </p>
            </div>
          </div>
        </motion.div>

        {/* Logo & Cover - Side by Side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-lg font-semibold">Hospital Branding</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Logo - Smaller */}
                <CompactPhotoCard
                  label="Logo"
                  description="200x200px"
                  imageUrl={media.logo}
                  uploading={uploading.logo}
                  uploadProgress={uploadProgress.logo}
                  onSelect={(file) => handleFileSelect(file, 'logo')}
                  onDelete={() => handleDelete('logo')}
                  onPreview={() => setPreviewImage(media.logo)}
                  size="small"
                  icon={Building2}
                />

                {/* Cover - Wider */}
                <div className="lg:col-span-2">
                  <CompactPhotoCard
                    label="Cover Photo"
                    description="1000x300px banner"
                    imageUrl={media.coverPhoto}
                    uploading={uploading.coverPhoto}
                    uploadProgress={uploadProgress.coverPhoto}
                    onSelect={(file) => handleFileSelect(file, 'coverPhoto')}
                    onDelete={() => handleDelete('coverPhoto')}
                    onPreview={() => setPreviewImage(media.coverPhoto)}
                    size="wide"
                    icon={ImageIcon}
                  />
                </div>

              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Facility Photos - Compact Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImagePlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-lg font-semibold">Facility Gallery</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {media.facilityPhotos.filter(Boolean).length}/6 photos
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <CompactPhotoCard
                    key={index}
                    label={`Photo ${index + 1}`}
                    description={getFacilityPhotoDescription(index)}
                    imageUrl={media.facilityPhotos[index]}
                    uploading={uploading[`facilityPhoto${index}`]}
                    uploadProgress={uploadProgress[`facilityPhoto${index}`]}
                    onSelect={(file) => handleFileSelect(file, 'facilityPhoto', index)}
                    onDelete={() => handleDelete('facilityPhoto', index)}
                    onPreview={() => setPreviewImage(media.facilityPhotos[index])}
                    size="medium"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  )
}

// ==================== Compact Photo Card ====================

function CompactPhotoCard({ 
  label, 
  description, 
  imageUrl, 
  uploading, 
  uploadProgress = 0,
  onSelect, 
  onDelete,
  onPreview,
  size = 'medium',
  icon: Icon
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const sizeClasses = {
    small: 'aspect-square',      // 1:1 for logo
    medium: 'aspect-[4/3]',      // 4:3 for facilities
    wide: 'aspect-[10/3]'        // Wide for cover
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onSelect(file)
  }, [onSelect])

  const handleFileInput = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) onSelect(file)
  }, [onSelect])

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Label */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
            {imageUrl && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <div className={`relative ${sizeClasses[size]} rounded-xl overflow-hidden border-2 transition-all ${
        isDragOver 
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
          : imageUrl 
            ? 'border-emerald-200 dark:border-emerald-800/50' 
            : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600'
      }`}>
        
        <AnimatePresence mode="wait">
          {imageUrl ? (
            <div className="relative w-full h-full bg-slate-100 dark:bg-slate-800">
              <Image
                src={imageUrl}
                alt={label}
                fill
                className="object-cover"
                sizes={size === 'wide' ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 768px) 50vw, 33vw'}
              />
              
              {/* Overlay Controls */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center gap-2 p-3"
                  >
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={onPreview}
                      className="h-8 px-3 text-xs"
                    >
                      <Maximize2 className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileInput}
                        disabled={uploading}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="pointer-events-none h-8 px-3 text-xs"
                        disabled={uploading}
                      >
                        <Camera className="w-3 h-3 mr-1" />
                        Change
                      </Button>
                    </label>
                    
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={onDelete}
                      disabled={uploading}
                      className="h-8 px-3 text-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <label className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer ${
              isDragOver ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            } transition-colors`}>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
                disabled={uploading}
              />
              
              {uploading ? (
                <div className="flex flex-col items-center px-4">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Uploading...
                  </p>
                  <div className="w-full max-w-[120px]">
                    <Progress value={uploadProgress || 0} className="h-1.5" />
                    <p className="text-xs text-center text-slate-500 mt-1">
                      {uploadProgress || 0}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-2 shadow-lg">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                    {isDragOver ? 'Drop here' : 'Click or drag'}
                  </p>
                  <p className="text-xs text-slate-500">Max 3MB</p>
                </div>
              )}
            </label>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ==================== Image Preview Modal ====================

function ImagePreviewModal({ imageUrl, onClose }) {
  if (!imageUrl) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="relative max-w-7xl w-full" onClick={(e) => e.stopPropagation()}>
          <div className="absolute -top-16 right-0 flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/90 hover:bg-white"
              asChild
            >
              <a href={imageUrl} download>
                <Download className="w-4 h-4" />
              </a>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/90 hover:bg-white"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            <Image
              src={imageUrl}
              alt="Preview"
              width={1400}
              height={900}
              className="object-contain w-full h-auto max-h-[85vh] rounded-xl"
              priority
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ==================== Loading Skeleton ====================

function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

// ==================== Helper ====================

function getFacilityPhotoDescription(index) {
  const descriptions = [
    'Building',
    'Reception',
    'OPD',
    'ICU',
    'Lab',
    'Equipment'
  ]
  return descriptions[index]
}
