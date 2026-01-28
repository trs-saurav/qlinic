'use client'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useHospitalAdmin } from '@/context/HospitalAdminContext'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

export default function AddInventoryDialog({ open, onOpenChange }) {
  const { addInventoryItem, hospital } = useHospitalAdmin()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    sku: '',
    category: '',
    quantity: '',
    unit: '',
    minThreshold: '10',
    reorderPoint: '',
    reorderQuantity: '',
    unitPrice: '',
    supplierName: '',
    supplierContact: '',
    supplierEmail: '',
    expirationDate: '',
    location: '',
    notes: ''
  })

  // Debug logging
  useEffect(() => {
    if (open) {
      console.log('🏥 Hospital ID:', hospital?._id || session?.user?.hospitalId)
    }
  }, [open, hospital, session])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate required fields
    if (!formData.itemName?.trim()) {
      toast.error('Item name is required')
      setLoading(false)
      return
    }
    if (!formData.sku?.trim()) {
      toast.error('SKU is required')
      setLoading(false)
      return
    }
    if (!formData.category) {
      toast.error('Category is required')
      setLoading(false)
      return
    }
    if (!formData.quantity || formData.quantity === '0') {
      toast.error('Quantity is required')
      setLoading(false)
      return
    }
    if (!formData.unit) {
      toast.error('Unit is required')
      setLoading(false)
      return
    }

    const payload = {
      itemName: formData.itemName.trim(),
      sku: formData.sku.trim(),
      category: formData.category,
      quantity: parseInt(formData.quantity),
      unit: formData.unit,
      minThreshold: formData.minThreshold ? parseInt(formData.minThreshold) : 10,
      ...(formData.description?.trim() && { description: formData.description.trim() }),
      ...(formData.reorderPoint && { reorderPoint: parseInt(formData.reorderPoint) }),
      ...(formData.reorderQuantity && { reorderQuantity: parseInt(formData.reorderQuantity) }),
      ...(formData.unitPrice && { unitPrice: parseFloat(formData.unitPrice) }),
      ...(formData.supplierName?.trim() && {
        supplier: {
          name: formData.supplierName.trim(),
          ...(formData.supplierContact?.trim() && { contact: formData.supplierContact.trim() }),
          ...(formData.supplierEmail?.trim() && { email: formData.supplierEmail.trim() })
        }
      }),
      ...(formData.expirationDate && { expirationDate: formData.expirationDate }),
      ...(formData.location?.trim() && { location: formData.location.trim() }),
      ...(formData.notes?.trim() && { notes: formData.notes.trim() })
    }

    console.log('📤 Submitting payload:', payload)

    const result = await addInventoryItem(payload)
    
    setLoading(false)
    
    if (result.success) {
      onOpenChange(false)
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      itemName: '',
      description: '',
      sku: '',
      category: '',
      quantity: '',
      unit: '',
      minThreshold: '10',
      reorderPoint: '',
      reorderQuantity: '',
      unitPrice: '',
      supplierName: '',
      supplierContact: '',
      supplierEmail: '',
      expirationDate: '',
      location: '',
      notes: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>
            Add a new item to your hospital inventory
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">
                Item Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="e.g., Surgical Gloves"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">
                SKU <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Unique identifier"
                required
                className="w-full"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Item description..."
              className="w-full resize-none"
            />
          </div>

          {/* Category, Quantity, Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                  <SelectItem value="Medications">Medications</SelectItem>
                  <SelectItem value="Medical Equipment">Medical Equipment</SelectItem>
                  <SelectItem value="Surgical Instruments">Surgical Instruments</SelectItem>
                  <SelectItem value="Laboratory Supplies">Laboratory Supplies</SelectItem>
                  <SelectItem value="Administrative Supplies">Administrative Supplies</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                required
                className="w-full"
                inputMode="numeric"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">
                Unit <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="boxes">Boxes</SelectItem>
                  <SelectItem value="bottles">Bottles</SelectItem>
                  <SelectItem value="packets">Packets</SelectItem>
                  <SelectItem value="units">Units</SelectItem>
                  <SelectItem value="kg">Kilograms</SelectItem>
                  <SelectItem value="liters">Liters</SelectItem>
                  <SelectItem value="ml">Milliliters</SelectItem>
                  <SelectItem value="mg">Milligrams</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Thresholds */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minThreshold">
                Min Threshold <span className="text-red-500">*</span>
              </Label>
              <Input
                id="minThreshold"
                type="number"
                min="0"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                required
                className="w-full"
                inputMode="numeric"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderPoint">Reorder Point</Label>
              <Input
                id="reorderPoint"
                type="number"
                min="0"
                value={formData.reorderPoint}
                onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                placeholder="Optional"
                className="w-full"
                inputMode="numeric"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderQuantity">Reorder Qty</Label>
              <Input
                id="reorderQuantity"
                type="number"
                min="0"
                value={formData.reorderQuantity}
                onChange={(e) => setFormData({ ...formData, reorderQuantity: e.target.value })}
                placeholder="Optional"
                className="w-full"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Price & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (₹)</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="0.00"
                className="w-full"
                inputMode="decimal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Room 101, Shelf A"
                className="w-full"
              />
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date</Label>
            <Input
              id="expirationDate"
              type="date"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Supplier Information */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-semibold text-sm">Supplier Information (Optional)</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Supplier Name</Label>
                <Input
                  id="supplierName"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  placeholder="Supplier name"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierContact">Contact</Label>
                <Input
                  id="supplierContact"
                  value={formData.supplierContact}
                  onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full"
                  inputMode="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierEmail">Email</Label>
              <Input
                id="supplierEmail"
                type="email"
                value={formData.supplierEmail}
                onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })}
                placeholder="supplier@example.com"
                className="w-full"
                inputMode="email"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Additional information..."
              className="w-full resize-none"
            />
          </div>

          {/* Footer Actions */}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                resetForm()
              }}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
