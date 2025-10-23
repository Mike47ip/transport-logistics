'use client'

import { useState, useEffect } from 'react'
import { 
  X, Save, RefreshCw, MapPin, Package, User, Truck, 
  AlertCircle, Navigation, CheckCircle, XCircle, RotateCcw, 
  Clock, ArrowRight, AlertTriangle
} from 'lucide-react'
import { useSnackbar } from '@/context/SnackbarContext'
import EnhancedStatusUpdate from './EnhancedStatusUpdate'

export default function EditDeliveryModal({ 
  delivery, 
  onClose, 
  onDeliveryUpdated,
  getStatusColor
}) {
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  
  // Form data for editing - Initialize with empty strings to avoid controlled/uncontrolled issues
  const [editData, setEditData] = useState({
    clientId: '',
    vehicleId: '',
    driverId: '',
    pickupAddress: '',
    pickupDateTime: '',
    deliveryAddress: '',
    deliveryDateTime: '',
    cargoDescription: '',
    weight: '',
    dimensions: '',
    specialInstructions: '',
    priority: 'NORMAL',
    estimatedPrice: '',
    distance: '',
    estimatedDuration: '',
    scheduledAt: '',
    notes: ''
  })
  
  const [clients, setClients] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  
  // Status update form
  const [newUpdate, setNewUpdate] = useState({
    status: '',
    location: '',
    notes: '',
    issueType: '',
    issueDescription: ''
  })

  const { showSuccess, showError } = useSnackbar()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
    fetchFormData()
  }, [delivery.id])

  // Initialize edit data after clients are fetched
  useEffect(() => {
    if (!formLoading) {
      initializeEditData()
    }
  }, [formLoading, delivery])

  const initializeEditData = () => {
    // Ensure all fields have string values to avoid controlled/uncontrolled issues
    setEditData({
      clientId: delivery.clientId || '',
      vehicleId: delivery.vehicleId || '',
      driverId: delivery.driverId || '',
      pickupAddress: delivery.pickupAddress || '',
      pickupDateTime: delivery.pickupDateTime ? new Date(delivery.pickupDateTime).toISOString().slice(0, 16) : '',
      deliveryAddress: delivery.deliveryAddress || '',
      deliveryDateTime: delivery.deliveryDateTime ? new Date(delivery.deliveryDateTime).toISOString().slice(0, 16) : '',
      cargoDescription: delivery.cargoDescription || '',
      weight: delivery.weight?.toString() || '',
      dimensions: delivery.dimensions || '',
      specialInstructions: delivery.specialInstructions || '',
      priority: delivery.priority || 'NORMAL',
      estimatedPrice: delivery.estimatedPrice?.toString() || '',
      distance: delivery.distance?.toString() || '',
      estimatedDuration: delivery.estimatedDuration?.toString() || '',
      scheduledAt: delivery.scheduledAt ? new Date(delivery.scheduledAt).toISOString().slice(0, 16) : '',
      notes: delivery.notes || ''
    })
    
    // Initialize status update form
    setNewUpdate({
      status: delivery.status || '',
      location: '',
      notes: '',
      issueType: '',
      issueDescription: ''
    })
  }

  const fetchFormData = async () => {
    try {
      setFormLoading(true)
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [clientsRes, vehiclesRes, driversRes] = await Promise.all([
        fetch('/api/clients', { headers }),
        fetch('/api/vehicles', { headers }),
        fetch('/api/drivers', { headers })
      ])

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData)
      }

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json()
        setVehicles(vehiclesData.filter(v => v.status === 'AVAILABLE' || v.id === delivery.vehicleId))
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json()
        setDrivers(driversData.filter(d => d.isActive || d.id === delivery.driverId))
      }
    } catch (error) {
      console.error('Error fetching form data:', error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      setLoading(true)
      
      // Determine if status should auto-change to ASSIGNED
      const shouldAutoAssign = 
        delivery.status === 'PENDING' && 
        editData.driverId && 
        editData.vehicleId &&
        (!delivery.driverId || !delivery.vehicleId) // Only if not already assigned

      const updatePayload = {
        ...editData,
        weight: editData.weight ? parseFloat(editData.weight) : null,
        estimatedPrice: editData.estimatedPrice ? parseFloat(editData.estimatedPrice) : null,
        distance: editData.distance ? parseFloat(editData.distance) : null,
        estimatedDuration: editData.estimatedDuration ? parseInt(editData.estimatedDuration) : null,
        vehicleId: editData.vehicleId || null,
        driverId: editData.driverId || null,
        pickupDateTime: editData.pickupDateTime || null,
        deliveryDateTime: editData.deliveryDateTime || null,
        scheduledAt: editData.scheduledAt || null,
        // Auto-change status to ASSIGNED if driver and vehicle are assigned
        status: shouldAutoAssign ? 'ASSIGNED' : delivery.status
      }

      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatePayload)
      })

      if (response.ok) {
        const updatedDelivery = await response.json()
        onDeliveryUpdated(updatedDelivery)
        
        // Show appropriate success message
        if (shouldAutoAssign) {
          showSuccess('Delivery updated and automatically assigned to driver!')
        } else {
          showSuccess('Delivery updated successfully!')
        }
        
        onClose()
      } else {
        const error = await response.json()
        showError(error.message || 'Failed to update delivery')
      }
    } catch (error) {
      showError('Error updating delivery')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (payload) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/deliveries/${delivery.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const updatedDelivery = await response.json()
        onDeliveryUpdated(updatedDelivery)
        showSuccess('Delivery status updated successfully!')
      } else {
        const error = await response.json()
        showError(error.message || 'Failed to update delivery status')
      }
    } catch (error) {
      showError('Error updating delivery status')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUpdateChange = (field, value) => {
    setNewUpdate(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const canUpdateStatus = () => {
    if (!currentUser) return false
    if (['ADMIN', 'MANAGER'].includes(currentUser.role)) return true
    if (currentUser.role === 'DRIVER' && delivery.driverId === currentUser.id) return true
    return false
  }

  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      PENDING: ['ASSIGNED', 'CANCELLED'],
      ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['PICKED_UP', 'FAILED_DELIVERY', 'CANCELLED'],
      PICKED_UP: ['IN_TRANSIT', 'FAILED_DELIVERY'],
      IN_TRANSIT: ['OUT_FOR_DELIVERY', 'FAILED_DELIVERY', 'DELAYED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED_DELIVERY'],
      DELIVERED: [],
      FAILED_DELIVERY: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'RETURNED'],
      DELAYED: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'FAILED_DELIVERY'],
      RETURNED: ['ASSIGNED', 'CANCELLED'],
      CANCELLED: []
    }
    return statusFlow[currentStatus] || []
  }

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      ASSIGNED: <User className="w-4 h-4" />,
      IN_PROGRESS: <Truck className="w-4 h-4" />,
      PICKED_UP: <MapPin className="w-4 h-4" />,
      IN_TRANSIT: <Navigation className="w-4 h-4" />,
      OUT_FOR_DELIVERY: <ArrowRight className="w-4 h-4" />,
      DELIVERED: <CheckCircle className="w-4 h-4" />,
      FAILED_DELIVERY: <XCircle className="w-4 h-4" />,
      DELAYED: <AlertTriangle className="w-4 h-4" />,
      RETURNED: <RotateCcw className="w-4 h-4" />,
      CANCELLED: <XCircle className="w-4 h-4" />
    }
    return icons[status] || <Clock className="w-4 h-4" />
  }

  const tabs = [
    { id: 'details', label: 'Edit Details', icon: <Package className="w-4 h-4" /> },
    { id: 'status', label: 'Update Status', icon: <Navigation className="w-4 h-4" /> }
  ]

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Delivery - {delivery.trackingNumber}
            </h2>
            <p className="text-sm text-gray-600">{delivery.client.name}</p>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {formLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading form data...</span>
            </div>
          ) : activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client *
                    </label>
                    <select
                      name="clientId"
                      value={editData.clientId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select client</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={editData.priority}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled At
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      value={editData.scheduledAt}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Route Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup Address *
                    </label>
                    <textarea
                      name="pickupAddress"
                      value={editData.pickupAddress}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup Date/Time
                    </label>
                    <input
                      type="datetime-local"
                      name="pickupDateTime"
                      value={editData.pickupDateTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Address *
                    </label>
                    <textarea
                      name="deliveryAddress"
                      value={editData.deliveryAddress}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Date/Time
                    </label>
                    <input
                      type="datetime-local"
                      name="deliveryDateTime"
                      value={editData.deliveryDateTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Cargo Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Cargo Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="cargoDescription"
                      value={editData.cargoDescription}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={editData.weight}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dimensions
                    </label>
                    <input
                      type="text"
                      name="dimensions"
                      value={editData.dimensions}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Instructions
                    </label>
                    <textarea
                      name="specialInstructions"
                      value={editData.specialInstructions}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Assignment Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Assignment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Driver
                    </label>
                    <select
                      name="driverId"
                      value={editData.driverId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Unassigned</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} - {d.phone}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle
                    </label>
                    <select
                      name="vehicleId"
                      value={editData.vehicleId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Unassigned</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.licensePlate} ({v.make} {v.model})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Pricing & Logistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Price (GH₵)
                    </label>
                    <input
                      type="number"
                      name="estimatedPrice"
                      value={editData.estimatedPrice}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      name="distance"
                      value={editData.distance}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="estimatedDuration"
                      value={editData.estimatedDuration}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={editData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : activeTab === 'status' && canUpdateStatus() ? (
            <EnhancedStatusUpdate 
              delivery={delivery}
              currentUser={currentUser}
              onStatusUpdate={handleStatusUpdate}
              loading={loading}
            />
          ) : activeTab === 'status' && !canUpdateStatus() ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">You don't have permission to update status for this delivery.</p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          
          {activeTab === 'details' && !formLoading && (
            <button
              onClick={handleSaveChanges}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}