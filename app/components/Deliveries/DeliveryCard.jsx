'use client'

import { MapPin, Package, User, Truck, Clock, ArrowRight, Phone, Mail, Eye, Edit } from 'lucide-react'

export default function DeliveryCard({ 
  delivery, 
  onView, 
  onEdit, 
  getStatusColor, 
  getPriorityColor, 
  currentUser 
}) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled'
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

  const canEdit = () => {
    if (!currentUser) return false
    return ['ADMIN', 'MANAGER'].includes(currentUser.role)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {delivery.trackingNumber}
            </h3>
            <p className="text-sm text-gray-600">{delivery.client.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status badges - non-clickable */}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(delivery.priority)}`}>
            {delivery.priority}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
            {delivery.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Route Information */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700">Pickup:</span>
          <span className="text-sm text-gray-600 truncate">{delivery.pickupAddress}</span>
        </div>
        <div className="flex items-center gap-2 ml-6">
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-gray-700">Delivery:</span>
          <span className="text-sm text-gray-600 truncate">{delivery.deliveryAddress}</span>
        </div>
      </div>

      {/* Cargo Information */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Cargo:</span>
          <span className="text-sm text-gray-600">{delivery.cargoDescription}</span>
        </div>
        {delivery.weight && (
          <div className="text-xs text-gray-500 ml-6">
            Weight: {delivery.weight} kg
            {delivery.dimensions && ` | Dimensions: ${delivery.dimensions}`}
          </div>
        )}
      </div>

      {/* Assignment Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Driver:</span>
          <span className="text-sm text-gray-600">
            {delivery.driver ? delivery.driver.name : 'Unassigned'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Vehicle:</span>
          <span className="text-sm text-gray-600">
            {delivery.vehicle ? `${delivery.vehicle.licensePlate}` : 'Unassigned'}
          </span>
        </div>
      </div>

      {/* Timeline Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Created:</span>
          <span className="text-gray-700">{formatDate(delivery.createdAt)}</span>
        </div>
        {delivery.scheduledAt && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <span className="text-gray-600">Scheduled:</span>
            <span className="text-gray-700">{formatDate(delivery.scheduledAt)}</span>
          </div>
        )}
      </div>

      {/* Client Contact Information */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        {delivery.client.phone && (
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">{delivery.client.phone}</span>
          </div>
        )}
        {delivery.client.email && (
          <div className="flex items-center gap-1">
            <Mail className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">{delivery.client.email}</span>
          </div>
        )}
      </div>

      {/* Price and Distance */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
        <div className="flex items-center gap-4 text-sm">
          {delivery.distance && (
            <span className="text-gray-600">
              Distance: <span className="font-medium">{delivery.distance} km</span>
            </span>
          )}
          {delivery.estimatedDuration && (
            <span className="text-gray-600">
              Duration: <span className="font-medium">{delivery.estimatedDuration} min</span>
            </span>
          )}
        </div>
        <div className="text-right">
          {delivery.estimatedPrice && (
            <p className="text-sm font-medium text-gray-900">
              {formatCurrency(delivery.estimatedPrice)}
            </p>
          )}
          {delivery.actualPrice && delivery.actualPrice !== delivery.estimatedPrice && (
            <p className="text-xs text-green-600">
              Actual: {formatCurrency(delivery.actualPrice)}
            </p>
          )}
        </div>
      </div>

      {/* Special Instructions Preview */}
      {delivery.specialInstructions && (
        <div className="pt-3 border-t border-gray-100 mb-4">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Special Instructions:</span>{' '}
            {delivery.specialInstructions.length > 100 
              ? `${delivery.specialInstructions.substring(0, 100)}...`
              : delivery.specialInstructions
            }
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onView(delivery)}
          className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
        
        {canEdit() && (
          <button
            onClick={() => onEdit(delivery)}
            className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-sm"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>
    </div>
  )
}