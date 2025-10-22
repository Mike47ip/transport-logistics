// app\track\page.jsx

'use client'

import { useState } from 'react'
import { Search, MapPin, Package, Clock, Truck, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function DeliveryTrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTrack = async (e) => {
    e.preventDefault()
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number')
      return
    }

    setLoading(true)
    setError('')
    setDelivery(null)

    try {
      const response = await fetch(`/api/track/${trackingNumber}`)
      
      if (response.ok) {
        const data = await response.json()
        setDelivery(data)
      } else if (response.status === 404) {
        setError('Tracking number not found. Please check your tracking number and try again.')
      } else {
        setError('Unable to track delivery. Please try again later.')
      }
    } catch (error) {
      console.error('Error tracking delivery:', error)
      setError('Unable to track delivery. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'CANCELLED':
        return <XCircle className="w-6 h-6 text-red-600" />
      case 'IN_PROGRESS':
        return <Truck className="w-6 h-6 text-blue-600" />
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'PENDING':
        return 20
      case 'ASSIGNED':
        return 40
      case 'IN_PROGRESS':
        return 70
      case 'DELIVERED':
        return 100
      case 'CANCELLED':
        return 100
      default:
        return 0
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

  const getTrackingSteps = () => {
    const steps = [
      { id: 'PENDING', label: 'Order Received', icon: Package },
      { id: 'ASSIGNED', label: 'Assigned to Driver', icon: Truck },
      { id: 'IN_PROGRESS', label: 'In Transit', icon: MapPin },
      { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle }
    ]

    return steps.map(step => {
      let isActive = false
      let isCompleted = false
      
      if (delivery) {
        const statusOrder = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED']
        const currentIndex = statusOrder.indexOf(delivery.status)
        const stepIndex = statusOrder.indexOf(step.id)
        
        isActive = stepIndex === currentIndex
        isCompleted = stepIndex < currentIndex || delivery.status === 'DELIVERED'
      }

      return { ...step, isActive, isCompleted }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Track Your Delivery</h1>
          <p className="text-gray-600 mt-2">Enter your tracking number to see real-time delivery status</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tracking Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <form onSubmit={handleTrack} className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="tracking" className="sr-only">Tracking Number</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="tracking"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number (e.g., TRK12345678)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Delivery Information */}
        {delivery && (
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{delivery.trackingNumber}</h2>
                  <p className="text-gray-600">{delivery.cargoDescription}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusIcon(delivery.status)}
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                    {delivery.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{getProgressPercentage(delivery.status)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      delivery.status === 'CANCELLED' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${getProgressPercentage(delivery.status)}%` }}
                  />
                </div>
              </div>

              {/* Tracking Steps */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {getTrackingSteps().map((step, index) => (
                  <div key={step.id} className="text-center">
                    <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      step.isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : step.isActive 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <p className={`text-sm font-medium ${
                      step.isCompleted || step.isActive ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Pickup Location</p>
                    <p className="text-gray-600">{delivery.pickupAddress}</p>
                    {delivery.pickupDateTime && (
                      <p className="text-sm text-gray-500">Picked up: {formatDate(delivery.pickupDateTime)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Delivery Location</p>
                    <p className="text-gray-600">{delivery.deliveryAddress}</p>
                    {delivery.deliveredAt && (
                      <p className="text-sm text-gray-500">Delivered: {formatDate(delivery.deliveredAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cargo Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cargo Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="text-gray-900">{delivery.cargoDescription}</p>
                  </div>
                  {delivery.weight && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Weight</p>
                      <p className="text-gray-900">{delivery.weight} kg</p>
                    </div>
                  )}
                  {delivery.dimensions && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Dimensions</p>
                      <p className="text-gray-900">{delivery.dimensions}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created</p>
                    <p className="text-gray-900">{formatDate(delivery.createdAt)}</p>
                  </div>
                  {delivery.scheduledAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Scheduled</p>
                      <p className="text-gray-900">{formatDate(delivery.scheduledAt)}</p>
                    </div>
                  )}
                  {delivery.startedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Started</p>
                      <p className="text-gray-900">{formatDate(delivery.startedAt)}</p>
                    </div>
                  )}
                  {delivery.deliveredAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Delivered</p>
                      <p className="text-gray-900">{formatDate(delivery.deliveredAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {delivery.specialInstructions && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Instructions</h3>
                <p className="text-gray-700">{delivery.specialInstructions}</p>
              </div>
            )}

            {/* Driver & Vehicle Info (if assigned) */}
            {(delivery.driver || delivery.vehicle) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {delivery.driver && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Driver</p>
                      <p className="text-gray-900 font-medium">{delivery.driver.name}</p>
                      {delivery.driver.phone && (
                        <p className="text-gray-600">{delivery.driver.phone}</p>
                      )}
                    </div>
                  )}
                  {delivery.vehicle && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Vehicle</p>
                      <p className="text-gray-900 font-medium">
                        {delivery.vehicle.licensePlate}
                      </p>
                      <p className="text-gray-600">
                        {delivery.vehicle.make} {delivery.vehicle.model}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-blue-800 mb-4">
            If you have any questions about your delivery or need to update delivery instructions, 
            please contact our customer service team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="tel:+1234567890"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-center transition-colors"
            >
              Call Support
            </a>
            <a 
              href="mailto:support@logitrack.com"
              className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-6 py-2 rounded-lg text-center transition-colors"
            >
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}