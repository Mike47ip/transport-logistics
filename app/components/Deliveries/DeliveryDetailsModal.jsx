'use client'

import { useState, useEffect } from 'react'
import { 
  X, MapPin, Package, User, Truck, Clock, AlertTriangle, 
  Phone, Mail, Edit, Save, Cancel, Navigation, Camera,
  CheckCircle, XCircle, RotateCcw, ArrowRight, ExternalLink,
  MessageSquare, MapIcon, RefreshCw, Plus
} from 'lucide-react'
import { useSnackbar } from '@/context/SnackbarContext'

export default function DeliveryDetailsModal({ 
  delivery, 
  onClose, 
  onDeliveryUpdated, 
  getStatusColor, 
  getPriorityColor 
}) {
  const [activeTab, setActiveTab] = useState('details')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [updates, setUpdates] = useState([])
  
  // Form data for editing
  const [editData, setEditData] = useState({})
  const [clients, setClients] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  
  const [newUpdate, setNewUpdate] = useState({
    status: delivery.status,
    location: '',
    notes: '',
    issueType: '',
    issueDescription: ''
  })

  const { showSuccess, showError, showWarning } = useSnackbar()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
    fetchDeliveryUpdates()
    initializeEditData()
  }, [delivery.id])

  const initializeEditData = () => {
    setEditData({
      clientId: delivery.clientId || '',
      vehicleId: delivery.vehicleId || '',
      driverId: delivery.driverId || '',
      pickupAddress: delivery.pickupAddress || '',
      pickupDateTime: delivery.pickupDateTime ? new Date(delivery.pickupDateTime).toISOString().slice(0, 16) : '',
      deliveryAddress: delivery.deliveryAddress || '',
      deliveryDateTime: delivery.deliveryDateTime ? new Date(delivery.deliveryDateTime).toISOString().slice(0, 16) : '',
      cargoDescription: delivery.cargoDescription || '',
      weight: delivery.weight || '',
      dimensions: delivery.dimensions || '',
      specialInstructions: delivery.specialInstructions || '',
      priority: delivery.priority || 'NORMAL',
      estimatedPrice: delivery.estimatedPrice || '',
      distance: delivery.distance || '',
      estimatedDuration: delivery.estimatedDuration || '',
      scheduledAt: delivery.scheduledAt ? new Date(delivery.scheduledAt).toISOString().slice(0, 16) : '',
      notes: delivery.notes || ''
    })
  }

  const fetchFormData = async () => {
    try {
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
    }
  }

  const fetchDeliveryUpdates = async () => {
    try {
      const response = await fetch(`/api/deliveries/${delivery.id}/updates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUpdates(data)
      }
    } catch (error) {
      console.error('Error fetching updates:', error)
    }
  }

  const handleEditToggle = () => {
    if (!isEditing) {
      fetchFormData()
      setIsEditing(true)
    } else {
      setIsEditing(false)
      initializeEditData() // Reset form
    }
  }

  const handleSaveChanges = async () => {
    try {
      setLoading(true)
      
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
        scheduledAt: editData.scheduledAt || null
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
        setIsEditing(false)
        showSuccess('Delivery updated successfully!')
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

  const handleStatusUpdate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/deliveries/${delivery.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newUpdate.status,
          location: newUpdate.location,
          notes: newUpdate.notes,
          issueType: newUpdate.issueType || null,
          issueDescription: newUpdate.issueDescription || null
        })
      })

      if (response.ok) {
        const updatedDelivery = await response.json()
        onDeliveryUpdated(updatedDelivery)
        fetchDeliveryUpdates()
        
        setNewUpdate({
          status: updatedDelivery.status,
          location: '',
          notes: '',
          issueType: '',
          issueDescription: ''
        })

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

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      ASSIGNED: <User className="w-4 h-4" />,
      IN_PROGRESS: <Truck className="w-4 h-4" />,
      OUT_FOR_DELIVERY: <Navigation className="w-4 h-4" />,
      DELIVERED: <CheckCircle className="w-4 h-4" />,
      FAILED_DELIVERY: <XCircle className="w-4 h-4" />,
      RETURNED: <RotateCcw className="w-4 h-4" />,
      CANCELLED: <XCircle className="w-4 h-4" />
    }
    return icons[status] || <Clock className="w-4 h-4" />
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canEdit = () => {
    if (!currentUser) return false
    return ['ADMIN', 'MANAGER'].includes(currentUser.role)
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
      IN_PROGRESS: ['OUT_FOR_DELIVERY', 'FAILED_DELIVERY', 'RETURNED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED_DELIVERY'],
      FAILED_DELIVERY: ['OUT_FOR_DELIVERY', 'RETURNED'],
      DELIVERED: [],
      RETURNED: ['ASSIGNED'],
      CANCELLED: []
    }
    return statusFlow[currentStatus] || []
  }

  const renderEditableField = (label, name, value, type = 'text', options = null, required = false) => {
    if (!isEditing) {
      if (type === 'select' && options) {
        const option = options.find(opt => opt.value === value)
        return (
          <div>
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <p className="text-sm text-gray-900 mt-1">{option ? option.label : value || 'Not set'}</p>
          </div>
        )
      }
      return (
        <div>
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <p className="text-sm text-gray-900 mt-1">{value || 'Not set'}</p>
        </div>
      )
    }

    const handleChange = (e) => {
      setEditData(prev => ({
        ...prev,
        [name]: e.target.value
      }))
    }

    if (type === 'select') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={value}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (type === 'textarea') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={value}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          value={value}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    )
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: <Package className="w-4 h-4" /> },
    { id: 'tracking', label: 'Tracking', icon: <MapIcon className="w-4 h-4" /> },
    { id: 'updates', label: 'Updates', icon: <MessageSquare className="w-4 h-4" /> }
  ]

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Delivery Details - {delivery.trackingNumber}
            </h2>
            <p className="text-sm text-gray-600">{delivery.client.name}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(delivery.priority)}`}>
                {delivery.priority}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                {getStatusIcon(delivery.status)}
                <span className="ml-1">{delivery.status.replace('_', ' ')}</span>
              </span>
            </div>
            
            {canEdit() && !isEditing && (
              <button
                onClick={handleEditToggle}
                className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Edit Mode Header */}
        {isEditing && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-800">
                <Edit className="w-4 h-4" />
                <span className="text-sm font-medium">Edit Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditToggle}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {loading ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

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
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderEditableField(
                    'Client', 
                    'clientId', 
                    editData.clientId,
                    'select',
                    [
                      { value: '', label: 'Select client' },
                      ...clients.map(c => ({ value: c.id, label: `${c.name} - ${c.phone}` }))
                    ],
                    true
                  )}
                  
                  {renderEditableField(
                    'Priority', 
                    'priority', 
                    editData.priority,
                    'select',
                    [
                      { value: 'LOW', label: 'Low' },
                      { value: 'NORMAL', label: 'Normal' },
                      { value: 'HIGH', label: 'High' },
                      { value: 'URGENT', label: 'Urgent' }
                    ]
                  )}
                  
                  {renderEditableField('Scheduled At', 'scheduledAt', editData.scheduledAt, 'datetime-local')}
                </div>
              </div>

              {/* Route Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Route Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderEditableField('Pickup Address', 'pickupAddress', editData.pickupAddress, 'textarea', null, true)}
                  {renderEditableField('Pickup Date/Time', 'pickupDateTime', editData.pickupDateTime, 'datetime-local')}
                  {renderEditableField('Delivery Address', 'deliveryAddress', editData.deliveryAddress, 'textarea', null, true)}
                  {renderEditableField('Delivery Date/Time', 'deliveryDateTime', editData.deliveryDateTime, 'datetime-local')}
                </div>
              </div>

              {/* Cargo Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Cargo Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderEditableField('Description', 'cargoDescription', editData.cargoDescription, 'textarea', null, true)}
                  {renderEditableField('Weight (kg)', 'weight', editData.weight, 'number')}
                  {renderEditableField('Dimensions', 'dimensions', editData.dimensions)}
                  <div className="md:col-span-2">
                    {renderEditableField('Special Instructions', 'specialInstructions', editData.specialInstructions, 'textarea')}
                  </div>
                </div>
              </div>

              {/* Assignment Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Assignment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderEditableField(
                    'Driver', 
                    'driverId', 
                    editData.driverId,
                    'select',
                    [
                      { value: '', label: 'Unassigned' },
                      ...drivers.map(d => ({ value: d.id, label: `${d.name} - ${d.phone}` }))
                    ]
                  )}
                  
                  {renderEditableField(
                    'Vehicle', 
                    'vehicleId', 
                    editData.vehicleId,
                    'select',
                    [
                      { value: '', label: 'Unassigned' },
                      ...vehicles.map(v => ({ value: v.id, label: `${v.licensePlate} (${v.make} ${v.model})` }))
                    ]
                  )}
                </div>
              </div>

              {/* Pricing Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Pricing & Logistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderEditableField('Estimated Price (GH₵)', 'estimatedPrice', editData.estimatedPrice, 'number')}
                  {renderEditableField('Distance (km)', 'distance', editData.distance, 'number')}
                  {renderEditableField('Duration (minutes)', 'estimatedDuration', editData.estimatedDuration, 'number')}
                </div>
              </div>

              {/* Notes */}
              <div>
                {renderEditableField('Notes', 'notes', editData.notes, 'textarea')}
              </div>

              {/* Client Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Client Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-600 mt-1">{delivery.client.name}</p>
                    </div>
                    {delivery.client.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{delivery.client.phone}</span>
                        </div>
                      </div>
                    )}
                    {delivery.client.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{delivery.client.email}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tracking' && (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  Current Status
                </h3>
                <div className="flex items-center gap-3">
                  {getStatusIcon(delivery.status)}
                  <span className="font-medium">{delivery.status.replace('_', ' ')}</span>
                  {delivery.currentLocation && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {delivery.currentLocation}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update Form */}
              {canUpdateStatus() && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Update Status</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Status
                        </label>
                        <select
                          value={newUpdate.status}
                          onChange={(e) => setNewUpdate(prev => ({...prev, status: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={delivery.status}>{delivery.status.replace('_', ' ')}</option>
                          {getNextStatuses(delivery.status).map(status => (
                            <option key={status} value={status}>
                              {status.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Location
                        </label>
                        <input
                          type="text"
                          value={newUpdate.location}
                          onChange={(e) => setNewUpdate(prev => ({...prev, location: e.target.value}))}
                          placeholder="Enter current location"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Issue Reporting */}
                    {['FAILED_DELIVERY', 'RETURNED'].includes(newUpdate.status) && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issue Type
                          </label>
                          <select
                            value={newUpdate.issueType}
                            onChange={(e) => setNewUpdate(prev => ({...prev, issueType: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select issue type</option>
                            <option value="VEHICLE_BREAKDOWN">Vehicle Breakdown</option>
                            <option value="TRAFFIC_DELAY">Traffic Delay</option>
                            <option value="WEATHER_DELAY">Weather Delay</option>
                            <option value="CUSTOMER_UNAVAILABLE">Customer Unavailable</option>
                            <option value="WRONG_ADDRESS">Wrong Address</option>
                            <option value="DAMAGED_CARGO">Damaged Cargo</option>
                            <option value="ACCIDENT">Accident</option>
                            <option value="FUEL_SHORTAGE">Fuel Shortage</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issue Description
                          </label>
                          <textarea
                            value={newUpdate.issueDescription}
                            onChange={(e) => setNewUpdate(prev => ({...prev, issueDescription: e.target.value}))}
                            placeholder="Describe the issue..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={newUpdate.notes}
                        onChange={(e) => setNewUpdate(prev => ({...prev, notes: e.target.value}))}
                        placeholder="Add any additional notes..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <button
                      onClick={handleStatusUpdate}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {loading ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Timeline</h3>
                <div className="space-y-3">
                  {delivery.createdAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">Created</span>
                      <span className="text-gray-600">{formatDate(delivery.createdAt)}</span>
                    </div>
                  )}
                  {delivery.startedAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium">Started</span>
                      <span className="text-gray-600">{formatDate(delivery.startedAt)}</span>
                    </div>
                  )}
                  {delivery.pickedUpAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="font-medium">Picked Up</span>
                      <span className="text-gray-600">{formatDate(delivery.pickedUpAt)}</span>
                    </div>
                  )}
                  {delivery.outForDeliveryAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="font-medium">Out for Delivery</span>
                      <span className="text-gray-600">{formatDate(delivery.outForDeliveryAt)}</span>
                    </div>
                  )}
                  {delivery.deliveredAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Delivered</span>
                      <span className="text-gray-600">{formatDate(delivery.deliveredAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Status Updates</h3>
                <button
                  onClick={fetchDeliveryUpdates}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {updates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No updates available yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {updates.map((update) => (
                    <div key={update.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getStatusColor(update.status)}`}>
                            {getStatusIcon(update.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {update.status.replace('_', ' ')}
                              </span>
                              {update.issueType && (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                  {update.issueType.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            {update.location && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                <MapPin className="w-3 h-3" />
                                {update.location}
                              </div>
                            )}
                            {update.notes && (
                              <p className="text-sm text-gray-600 mb-2">{update.notes}</p>
                            )}
                            {update.issueDescription && (
                              <p className="text-sm text-orange-700 bg-orange-50 p-2 rounded border">
                                <strong>Issue:</strong> {update.issueDescription}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>{formatDate(update.createdAt)}</p>
                          <p>by {update.updater?.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Last updated: {formatDate(delivery.updatedAt)}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}