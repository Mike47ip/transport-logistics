'use client'

import { useState, useEffect } from 'react'
import { 
  X, MapPin, Package, User, Truck, Clock, AlertTriangle, 
  Phone, Mail, Navigation, CheckCircle, XCircle, RotateCcw, 
  ArrowRight, MessageSquare, MapIcon, RefreshCw, Edit
} from 'lucide-react'
import { useSnackbar } from '@/context/SnackbarContext'

export default function ViewDeliveryModal({ 
  delivery, 
  onClose, 
  onEditRequest,
  getStatusColor, 
  getPriorityColor 
}) {
  const [activeTab, setActiveTab] = useState('details')
  const [updates, setUpdates] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  const { showSuccess, showError } = useSnackbar()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
    fetchDeliveryUpdates()
  }, [delivery.id])

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
            
            {canEdit() && (
              <button
                onClick={() => onEditRequest(delivery)}
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
              {/* Route Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Route Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Pickup Location</p>
                      <p className="text-sm text-gray-600">{delivery.pickupAddress}</p>
                      {delivery.pickupDateTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          Scheduled: {formatDate(delivery.pickupDateTime)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-1.5">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Delivery Location</p>
                      <p className="text-sm text-gray-600">{delivery.deliveryAddress}</p>
                      {delivery.deliveryDateTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          Scheduled: {formatDate(delivery.deliveryDateTime)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cargo Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Cargo Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-600 mt-1">{delivery.cargoDescription}</p>
                  </div>
                  {delivery.weight && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Weight</label>
                      <p className="text-sm text-gray-600 mt-1">{delivery.weight} kg</p>
                    </div>
                  )}
                  {delivery.dimensions && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Dimensions</label>
                      <p className="text-sm text-gray-600 mt-1">{delivery.dimensions}</p>
                    </div>
                  )}
                  {delivery.estimatedPrice && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Estimated Price</label>
                      <p className="text-sm text-gray-600 mt-1">GH₵ {delivery.estimatedPrice}</p>
                    </div>
                  )}
                </div>
                {delivery.specialInstructions && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700">Special Instructions</label>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      {delivery.specialInstructions}
                    </p>
                  </div>
                )}
              </div>

              {/* Assignment Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Assignment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Assigned Driver</label>
                      <div className="mt-1 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {delivery.driver ? delivery.driver.name : 'Unassigned'}
                        </span>
                        {delivery.driver?.phone && (
                          <div className="flex items-center gap-1 ml-2">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{delivery.driver.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Assigned Vehicle</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {delivery.vehicle 
                          ? `${delivery.vehicle.licensePlate} (${delivery.vehicle.make} ${delivery.vehicle.model})`
                          : 'Unassigned'
                        }
                      </span>
                    </div>
                  </div>
                </div>
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

              {/* Logistics Information */}
              {(delivery.distance || delivery.estimatedDuration || delivery.notes) && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Logistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {delivery.distance && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Distance</label>
                        <p className="text-sm text-gray-600 mt-1">{delivery.distance} km</p>
                      </div>
                    )}
                    {delivery.estimatedDuration && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Duration</label>
                        <p className="text-sm text-gray-600 mt-1">{delivery.estimatedDuration} minutes</p>
                      </div>
                    )}
                  </div>
                  {delivery.notes && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700">Notes</label>
                      <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded-lg">
                        {delivery.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
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

              {/* Comprehensive Timeline */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Delivery Timeline</h3>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {/* 1. Created */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        delivery.createdAt ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">Order Created</span>
                          {delivery.createdAt && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Completed</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {delivery.createdAt ? formatDate(delivery.createdAt) : 'Pending creation'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Delivery request submitted and tracking number assigned</p>
                      </div>
                    </div>

                    {/* 2. Assigned */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        delivery.driverId && delivery.vehicleId ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">Driver & Vehicle Assigned</span>
                          {delivery.driverId && delivery.vehicleId && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">Completed</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {delivery.driverId && delivery.vehicleId 
                            ? `${delivery.driver?.name} assigned with ${delivery.vehicle?.licensePlate}`
                            : 'Waiting for driver and vehicle assignment'
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Resources allocated for pickup and delivery</p>
                      </div>
                    </div>

                    {/* 3. Started / In Progress */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        delivery.startedAt ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">Journey Started</span>
                          {delivery.startedAt && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Completed</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {delivery.startedAt ? formatDate(delivery.startedAt) : 'Driver will start the journey'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Driver en route to pickup location</p>
                      </div>
                    </div>

                    {/* 4. Picked Up */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        delivery.pickedUpAt ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">Cargo Picked Up</span>
                          {delivery.pickedUpAt && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Completed</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {delivery.pickedUpAt ? formatDate(delivery.pickedUpAt) : 'Awaiting pickup from sender'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Package collected from pickup location</p>
                      </div>
                    </div>

                    {/* 5. In Transit */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        delivery.pickedUpAt && !delivery.outForDeliveryAt ? 'bg-purple-500 text-white animate-pulse' : 
                        delivery.outForDeliveryAt ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">In Transit</span>
                          {delivery.pickedUpAt && !delivery.outForDeliveryAt && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full animate-pulse">In Progress</span>
                          )}
                          {delivery.outForDeliveryAt && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Completed</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {delivery.pickedUpAt && !delivery.outForDeliveryAt 
                            ? 'Package is currently in transit to destination'
                            : delivery.outForDeliveryAt 
                            ? 'Transit completed, ready for final delivery'
                            : 'Package will be in transit after pickup'
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">En route to delivery destination</p>
                        {delivery.currentLocation && delivery.pickedUpAt && !delivery.deliveredAt && (
                          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Current location: {delivery.currentLocation}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 6. Out for Delivery */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        delivery.outForDeliveryAt ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">Out for Delivery</span>
                          {delivery.outForDeliveryAt && !delivery.deliveredAt && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full animate-pulse">In Progress</span>
                          )}
                          {delivery.deliveredAt && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Completed</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {delivery.outForDeliveryAt ? formatDate(delivery.outForDeliveryAt) : 'Driver will begin final delivery'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Driver making final approach to delivery address</p>
                      </div>
                    </div>

                    {/* 7. Delivered */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        delivery.deliveredAt ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">Delivered</span>
                          {delivery.deliveredAt && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Completed</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {delivery.deliveredAt ? formatDate(delivery.deliveredAt) : 'Package will be delivered to recipient'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Package successfully delivered to destination</p>
                        {delivery.deliveredAt && delivery.recipientName && (
                          <p className="text-xs text-green-600 mt-1">
                            Received by: {delivery.recipientName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Delivery Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Duration:</span>
                      <p className="font-medium">
                        {delivery.deliveredAt && delivery.createdAt 
                          ? `${Math.round((new Date(delivery.deliveredAt) - new Date(delivery.createdAt)) / (1000 * 60 * 60))} hours`
                          : 'In progress'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Transit Time:</span>
                      <p className="font-medium">
                        {delivery.deliveredAt && delivery.pickedUpAt
                          ? `${Math.round((new Date(delivery.deliveredAt) - new Date(delivery.pickedUpAt)) / (1000 * 60))} minutes`
                          : delivery.pickedUpAt
                          ? 'In transit...'
                          : 'Not started'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Distance:</span>
                      <p className="font-medium">{delivery.distance ? `${delivery.distance} km` : 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <p className="font-medium capitalize">{delivery.status.toLowerCase().replace('_', ' ')}</p>
                    </div>
                  </div>
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
            {canEdit() && (
              <button
                onClick={() => onEditRequest(delivery)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Delivery
              </button>
            )}
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