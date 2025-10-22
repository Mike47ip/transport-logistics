'use client'

import { useState, useEffect } from 'react'
import { 
  X, MapPin, Package, User, Truck, Clock, Calendar, DollarSign, 
  Edit, Save, Phone, Mail, Ruler, Weight, AlertCircle, CheckCircle,
  Navigation, Star, Flag, FileText, Settings
} from 'lucide-react'

export default function DeliveryDetailsModal({ 
  delivery, 
  onClose, 
  onDeliveryUpdated, 
  getStatusColor, 
  getPriorityColor 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    setEditData({
      status: delivery.status,
      priority: delivery.priority,
      estimatedPrice: delivery.estimatedPrice || '',
      actualPrice: delivery.actualPrice || '',
      specialInstructions: delivery.specialInstructions || '',
      notes: delivery.notes || '',
      cargoDescription: delivery.cargoDescription,
      weight: delivery.weight || '',
      dimensions: delivery.dimensions || ''
    })
  }, [delivery])

  const handleEdit = () => {
    setIsEditing(true)
    setErrors({})
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({
      status: delivery.status,
      priority: delivery.priority,
      estimatedPrice: delivery.estimatedPrice || '',
      actualPrice: delivery.actualPrice || '',
      specialInstructions: delivery.specialInstructions || '',
      notes: delivery.notes || '',
      cargoDescription: delivery.cargoDescription,
      weight: delivery.weight || '',
      dimensions: delivery.dimensions || ''
    })
    setErrors({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const updateData = {
        ...editData,
        estimatedPrice: editData.estimatedPrice ? parseFloat(editData.estimatedPrice) : null,
        actualPrice: editData.actualPrice ? parseFloat(editData.actualPrice) : null,
        weight: editData.weight ? parseFloat(editData.weight) : null
      }

      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedDelivery = await response.json()
        onDeliveryUpdated(updatedDelivery)
        setIsEditing(false)
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || 'Failed to update delivery' })
      }
    } catch (error) {
      console.error('Error updating delivery:', error)
      setErrors({ submit: 'Failed to update delivery' })
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus) => {
    setLoading(true)
    try {
      const updateData = {
        status: newStatus,
        ...(newStatus === 'IN_PROGRESS' && !delivery.startedAt && { startedAt: new Date().toISOString() }),
        ...(newStatus === 'DELIVERED' && !delivery.deliveredAt && { deliveredAt: new Date().toISOString() })
      }

      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedDelivery = await response.json()
        onDeliveryUpdated(updatedDelivery)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    if (!amount) return 'Not set'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusActions = () => {
    const actions = []
    
    switch (delivery.status) {
      case 'PENDING':
        actions.push({ label: 'Assign', status: 'ASSIGNED', color: 'blue' })
        actions.push({ label: 'Cancel', status: 'CANCELLED', color: 'red' })
        break
      case 'ASSIGNED':
        actions.push({ label: 'Start Delivery', status: 'IN_PROGRESS', color: 'purple' })
        actions.push({ label: 'Cancel', status: 'CANCELLED', color: 'red' })
        break
      case 'IN_PROGRESS':
        actions.push({ label: 'Mark Delivered', status: 'DELIVERED', color: 'green' })
        actions.push({ label: 'Cancel', status: 'CANCELLED', color: 'red' })
        break
    }
    
    return actions
  }

  const renderDetailsTab = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Delivery Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Tracking Number</label>
            <p className="text-lg font-mono text-gray-900">{delivery.trackingNumber}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Status</label>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                {delivery.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(delivery.priority)}`}>
                {delivery.priority}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          Client Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Name</label>
            <p className="text-gray-900">{delivery.client.name}</p>
          </div>
          {delivery.client.phone && (
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <p className="text-gray-900 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {delivery.client.phone}
              </p>
            </div>
          )}
          {delivery.client.email && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-900 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {delivery.client.email}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Route Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Route Information
        </h4>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-green-600" />
              Pickup Address
            </label>
            <p className="text-gray-900 mt-1">{delivery.pickupAddress}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-red-600" />
              Delivery Address
            </label>
            <p className="text-gray-900 mt-1">{delivery.deliveryAddress}</p>
          </div>
          {(delivery.distance || delivery.estimatedDuration) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {delivery.distance && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Distance</label>
                  <p className="text-gray-900">{delivery.distance} km</p>
                </div>
              )}
              {delivery.estimatedDuration && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Estimated Duration</label>
                  <p className="text-gray-900">{delivery.estimatedDuration} minutes</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cargo Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Cargo Information
        </h4>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Description</label>
            {isEditing ? (
              <textarea
                name="cargoDescription"
                value={editData.cargoDescription}
                onChange={handleChange}
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 mt-1">{delivery.cargoDescription}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Weight className="w-4 h-4" />
                Weight
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="weight"
                  value={editData.weight}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="kg"
                />
              ) : (
                <p className="text-gray-900 mt-1">
                  {delivery.weight ? `${delivery.weight} kg` : 'Not specified'}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Ruler className="w-4 h-4" />
                Dimensions
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="dimensions"
                  value={editData.dimensions}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="L×W×H"
                />
              ) : (
                <p className="text-gray-900 mt-1">
                  {delivery.dimensions || 'Not specified'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Assignment Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Driver</label>
            <p className="text-gray-900">
              {delivery.driver ? delivery.driver.name : 'Unassigned'}
            </p>
            {delivery.driver?.phone && (
              <p className="text-sm text-gray-600">{delivery.driver.phone}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Vehicle</label>
            <p className="text-gray-900">
              {delivery.vehicle 
                ? `${delivery.vehicle.licensePlate} - ${delivery.vehicle.make} ${delivery.vehicle.model}`
                : 'Unassigned'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Pricing Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Estimated Price</label>
            {isEditing ? (
              <input
                type="number"
                name="estimatedPrice"
                value={editData.estimatedPrice}
                onChange={handleChange}
                step="0.01"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            ) : (
              <p className="text-gray-900 mt-1">{formatCurrency(delivery.estimatedPrice)}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Actual Price</label>
            {isEditing ? (
              <input
                type="number"
                name="actualPrice"
                value={editData.actualPrice}
                onChange={handleChange}
                step="0.01"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            ) : (
              <p className="text-gray-900 mt-1">{formatCurrency(delivery.actualPrice)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderTimelineTab = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Delivery Timeline
      </h4>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
          <div>
            <p className="font-medium text-gray-900">Created</p>
            <p className="text-sm text-gray-600">{formatDate(delivery.createdAt)}</p>
          </div>
        </div>

        {delivery.scheduledAt && (
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-gray-900">Scheduled</p>
              <p className="text-sm text-gray-600">{formatDate(delivery.scheduledAt)}</p>
            </div>
          </div>
        )}

        {delivery.startedAt && (
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-gray-900">Started</p>
              <p className="text-sm text-gray-600">{formatDate(delivery.startedAt)}</p>
            </div>
          </div>
        )}

        {delivery.pickupDateTime && (
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-gray-900">Picked Up</p>
              <p className="text-sm text-gray-600">{formatDate(delivery.pickupDateTime)}</p>
            </div>
          </div>
        )}

        {delivery.deliveredAt && (
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-gray-900">Delivered</p>
              <p className="text-sm text-gray-600">{formatDate(delivery.deliveredAt)}</p>
            </div>
          </div>
        )}

        {delivery.deliveryDateTime && delivery.deliveryDateTime !== delivery.deliveredAt && (
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-gray-900">Delivery Completed</p>
              <p className="text-sm text-gray-600">{formatDate(delivery.deliveryDateTime)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderNotesTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
        {isEditing ? (
          <textarea
            name="specialInstructions"
            value={editData.specialInstructions}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter special instructions..."
          />
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-900">
              {delivery.specialInstructions || 'No special instructions'}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
        {isEditing ? (
          <textarea
            name="notes"
            value={editData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter additional notes..."
          />
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-900">
              {delivery.notes || 'No additional notes'}
            </p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Delivery Details - {delivery.trackingNumber}
            </h2>
            <p className="text-sm text-gray-600">{delivery.client.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Status Actions */}
        {getStatusActions().length > 0 && !isEditing && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Quick Actions:</span>
              {getStatusActions().map((action) => (
                <button
                  key={action.status}
                  onClick={() => updateStatus(action.status)}
                  disabled={loading}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                    action.color === 'blue' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                    action.color === 'green' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                    action.color === 'purple' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                    'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex px-6">
            {[
              { id: 'details', label: 'Details', icon: FileText },
              { id: 'timeline', label: 'Timeline', icon: Clock },
              { id: 'notes', label: 'Notes', icon: Flag }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'details' && renderDetailsTab()}
          {activeTab === 'timeline' && renderTimelineTab()}
          {activeTab === 'notes' && renderNotesTab()}
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="px-6 py-2">
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errors.submit}</p>
          </div>
        )}

        {/* Footer */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}