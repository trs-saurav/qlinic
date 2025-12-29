// src/components/hospital/EditInventoryDialog.jsx
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHospitalAdmin } from '@/context/HospitalAdminContext'
import { Package, DollarSign, Truck, Calendar, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditInventoryDialog({ open, onOpenChange, item }) {
  const { updateInventoryItem } = useHospitalAdmin()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    if (item) {
      setFormData({
        itemName: item.itemName || '',
        description: item.description || '',
        sku: item.sku || '',
        category: item.category || '',
        quantity: item.quantity?.toString() || '',
        unit: item.unit || '',
        minThreshold: item.minThreshold?.toString() || '10',
        reorderPoint: item.reorderPoint?.toString() || '',
        reorderQuantity: item.reorderQuantity?.toString() || '',
        unitPrice: item.unitPrice?.toString() || '',
        supplierName: item.supplier?.name || '',
        supplierContact: item.supplier?.contact || '',
        supplierEmail: item.supplier?.email || '',
        expirationDate: item.expirationDate ? item.expirationDate.split('T')[0] : '',
        location: item.location || '',
        notes: item.notes || ''
      })
    }
  }, [item])

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
    if (!formData.quantity || formData.quantity === '') {
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

    const result = await updateInventoryItem(item._id, payload)
    
    setLoading(false)
    
    if (result.success) {
      onOpenChange(false)
    }
  }

  if (!item) return null

  // Check if item is low/out of stock
  const isLowStock = item.quantity <= item.minThreshold
  const isOutOfStock = item.quantity === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Edit Inventory Item
          </DialogTitle>
          <DialogDescription>
            Update item details and stock information
          </DialogDescription>
          {isOutOfStock && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 mt-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                This item is out of stock!
              </span>
            </div>
          )}
          {isLowStock && !isOutOfStock && (
            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md p-3 mt-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                Low stock alert - only {item.quantity} {item.unit} remaining!
              </span>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">
                <Package className="w-4 h-4 mr-1 hidden sm:inline" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs sm:text-sm">
                <DollarSign className="w-4 h-4 mr-1 hidden sm:inline" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="supplier" className="text-xs sm:text-sm">
                <Truck className="w-4 h-4 mr-1 hidden sm:inline" />
                Supplier
              </TabsTrigger>
              <TabsTrigger value="other" className="text-xs sm:text-sm">
                <Calendar className="w-4 h-4 mr-1 hidden sm:inline" />
                Other
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
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
                    required
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Item description..."
                  className="w-full resize-none"
                />
              </div>

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
                      <SelectValue />
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
                      <SelectValue />
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
            </TabsContent>

            {/* Pricing & Thresholds Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-4">
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
                  <p className="text-xs text-slate-500">Alert when stock drops below this</p>
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
                  <p className="text-xs text-slate-500">When to reorder stock</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
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
                  <p className="text-xs text-slate-500">How much to reorder</p>
                </div>
              </div>

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
                <p className="text-xs text-slate-500">Price per unit</p>
              </div>

              {formData.unitPrice && formData.quantity && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Calculated Values</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Total Value</p>
                      <p className="text-lg font-bold">
                        ₹{(parseFloat(formData.unitPrice) * parseInt(formData.quantity || 0)).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Per Unit</p>
                      <p className="text-lg font-bold">₹{parseFloat(formData.unitPrice).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Supplier Tab */}
            <TabsContent value="supplier" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Supplier Name</Label>
                <Input
                  id="supplierName"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  placeholder="Supplier company name"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierContact">Contact Number</Label>
                  <Input
                    id="supplierContact"
                    value={formData.supplierContact}
                    onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full"
                    inputMode="tel"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierEmail">Email Address</Label>
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

              {(formData.supplierName || formData.supplierContact || formData.supplierEmail) && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                    Supplier Information
                  </h4>
                  <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    {formData.supplierName && <p>Name: {formData.supplierName}</p>}
                    {formData.supplierContact && <p>Contact: {formData.supplierContact}</p>}
                    {formData.supplierEmail && <p>Email: {formData.supplierEmail}</p>}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Other Information Tab */}
            <TabsContent value="other" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="w-full"
                />
                {formData.expirationDate && (
                  <p className="text-xs text-slate-500">
                    {new Date(formData.expirationDate) < new Date() 
                      ? '⚠️ This item has expired!'
                      : `Expires in ${Math.ceil((new Date(formData.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))} days`
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Add any additional information about this item..."
                  className="w-full resize-none"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">Item Metadata</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    <p className="font-medium">Created</p>
                    <p>{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p>{new Date(item.updatedAt).toLocaleDateString()}</p>
                  </div>
                  {item.lastRestocked && (
                    <div>
                      <p className="font-medium">Last Restocked</p>
                      <p>{new Date(item.lastRestocked).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">Item ID</p>
                    <p className="font-mono">{item._id.slice(-8)}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? 'Updating...' : 'Update Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
