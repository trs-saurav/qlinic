// src/app/hospital/inventory/page.jsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Plus, AlertTriangle, Search, Edit, Trash2, Package, MinusCircle, PlusCircle } from 'lucide-react'
import { useHospitalAdmin } from '@/context/HospitalAdminContext'
import AddInventoryDialog from '@/components/hospital/inventory/AddInventoryDialog'
import EditInventoryDialog from '@/components/hospital/inventory/EditInventoryDialog'
import toast from 'react-hot-toast'

export default function InventoryPage() {
  const {
    inventory,
    inventoryStats,
    inventoryLoading,
    fetchInventory,
    deleteInventoryItem,
    updateInventoryItem,
  } = useHospitalAdmin()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [localFilters, setLocalFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
  })

  // Quick quantity update state
  const [qtyUpdateOpen, setQtyUpdateOpen] = useState(null)
  const [qtyInput, setQtyInput] = useState('')

  // Fetch inventory when filters change with debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory(localFilters)
    }, localFilters.search ? 500 : 0) // 500ms debounce for search

    return () => clearTimeout(timer)
  }, [localFilters, fetchInventory])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    await deleteInventoryItem(id)
  }

  const handleQuickQtyUpdate = async (item, operation, customAmount = null) => {
    let newQuantity = item.quantity

    if (operation === 'add') {
      newQuantity += customAmount || 1
    } else if (operation === 'subtract') {
      newQuantity = Math.max(0, newQuantity - (customAmount || 1))
    } else if (operation === 'set' && customAmount !== null) {
      newQuantity = Math.max(0, customAmount)
    }

    const result = await updateInventoryItem(item._id, {
      quantity: newQuantity,
      updateNotes: `Quantity updated from ${item.quantity} to ${newQuantity}`
    })

    if (result.success) {
      setQtyUpdateOpen(null)
      setQtyInput('')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'low-stock':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
      case 'out-of-stock':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Inventory Management
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
            Track medical supplies and equipment
          </p>
        </div>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{inventoryStats.totalItems || 0}</div>
            <p className="text-xs text-slate-500 mt-1">{inventoryStats.categories || 0} categories</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-orange-900 dark:text-orange-100">
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-orange-600">
              {inventoryStats.lowStock || 0}
            </div>
            <p className="text-xs text-orange-600 mt-1">Needs reordering</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm text-red-900 dark:text-red-100">
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-red-600">
              {inventoryStats.outOfStock || 0}
            </div>
            <p className="text-xs text-red-600 mt-1">Urgent action needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">
              ₹{(inventoryStats.totalValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">Inventory worth</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle className="text-lg sm:text-xl">Inventory Items</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search items..."
                  className="pl-10 w-full sm:w-64"
                  value={localFilters.search}
                  onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                />
              </div>
              <Select
                value={localFilters.category}
                onValueChange={(value) => setLocalFilters({ ...localFilters, category: value })}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                  <SelectItem value="Medications">Medications</SelectItem>
                  <SelectItem value="Medical Equipment">Medical Equipment</SelectItem>
                  <SelectItem value="Surgical Instruments">Surgical Instruments</SelectItem>
                  <SelectItem value="Laboratory Supplies">Laboratory Supplies</SelectItem>
                  <SelectItem value="Administrative Supplies">Administrative Supplies</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={localFilters.status}
                onValueChange={(value) => setLocalFilters({ ...localFilters, status: value })}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inventoryLoading ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-slate-300 animate-pulse" />
              <p className="text-slate-500 mt-2">Loading inventory...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-slate-500 mt-2">
                {localFilters.search || localFilters.category !== 'all' || localFilters.status !== 'all'
                  ? 'No items match your filters'
                  : 'No items in inventory'}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Item Name</TableHead>
                    <TableHead className="hidden sm:table-cell">SKU</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="hidden lg:table-cell">Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden xl:table-cell">Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span>{item.itemName}</span>
                            <span className="text-xs text-slate-500 sm:hidden">{item.sku}</span>
                          </div>
                          {/* FIX: Only show warning for low-stock and out-of-stock */}
                          {(item.status === 'low-stock' || item.status === 'out-of-stock') && (
                            <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-slate-500">{item.sku}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm">{item.category}</span>
                      </TableCell>
                      <TableCell>
                        <Popover 
                          open={qtyUpdateOpen === item._id} 
                          onOpenChange={(open) => {
                            setQtyUpdateOpen(open ? item._id : null)
                            setQtyInput('')
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1 h-auto"
                            >
                              {item.quantity}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64" align="start">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm">Quick Quantity Update</h4>
                              
                              {/* Quick buttons */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleQuickQtyUpdate(item, 'subtract', 1)}
                                  disabled={item.quantity === 0}
                                >
                                  <MinusCircle className="w-4 h-4 mr-1" />
                                  -1
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleQuickQtyUpdate(item, 'add', 1)}
                                >
                                  <PlusCircle className="w-4 h-4 mr-1" />
                                  +1
                                </Button>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleQuickQtyUpdate(item, 'subtract', 10)}
                                  disabled={item.quantity < 10}
                                >
                                  -10
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleQuickQtyUpdate(item, 'add', 10)}
                                >
                                  +10
                                </Button>
                              </div>

                              {/* Custom amount */}
                              <div className="space-y-2">
                                <label className="text-xs text-slate-600">Set Custom Amount</label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="Enter quantity"
                                    value={qtyInput}
                                    onChange={(e) => setQtyInput(e.target.value)}
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const amount = parseInt(qtyInput)
                                        if (!isNaN(amount) && amount >= 0) {
                                          handleQuickQtyUpdate(item, 'set', amount)
                                        } else {
                                          toast.error('Please enter a valid quantity')
                                        }
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const amount = parseInt(qtyInput)
                                      if (!isNaN(amount) && amount >= 0) {
                                        handleQuickQtyUpdate(item, 'set', amount)
                                      } else {
                                        toast.error('Please enter a valid quantity')
                                      }
                                    }}
                                    disabled={!qtyInput}
                                  >
                                    Set
                                  </Button>
                                </div>
                              </div>

                              <div className="text-xs text-slate-500 pt-2 border-t">
                                <p>Min threshold: {item.minThreshold} {item.unit}</p>
                                {item.reorderPoint && <p>Reorder point: {item.reorderPoint} {item.unit}</p>}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-slate-600">{item.unit}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-slate-600">{item.location || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item)
                              setEditDialogOpen(true)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 h-8 w-8 p-0"
                            onClick={() => handleDelete(item._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddInventoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <EditInventoryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={selectedItem}
      />
    </div>
  )
}
