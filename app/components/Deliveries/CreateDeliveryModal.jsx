'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, Package, User, Truck, Calendar, DollarSign, Ruler, Weight } from 'lucide-react'

export default function CreateDeliveryModal({ onClose, onDeliveryCreated }) {
  const [formData, setFormData] = useState({
    clientId: '',
    vehicleId: '',
    driverId: '',
    pickupAddress: '',
    pickupLat: null,
    pickupLng: null,
    deliveryAddress: '',
    deliveryLat: null,
    deliveryLng: null,
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
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    fetchFormData()
  }, [])

  const fetchFormData = async () => {
    try {
      console.log('🚚 DELIVERY_MODAL: Starting fetchFormData...')
      
      const token = localStorage.getItem('token')
      console.log('🚚 DELIVERY_MODAL: Token exists?', !!token)
      console.log('🚚 DELIVERY_MODAL: Token value:', token?.substring(0, 20) + '...')
      
      if (!token) {
        console.error('🚚 DELIVERY_MODAL: No token found in localStorage!')
        return
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`
      }

      console.log('🚚 DELIVERY_MODAL: Making requests with headers...')

      const [clientsRes, vehiclesRes, driversRes] = await Promise.all([
        fetch('/api/clients', { headers }),
        fetch('/api/vehicles', { headers }),
        fetch('/api/drivers', { headers })
      ])

      console.log('🚚 DELIVERY_MODAL: Response statuses:', {
        clients: clientsRes.status,
        vehicles: vehiclesRes.status,
        drivers: driversRes.status
      })

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        console.log('🚚 DELIVERY_MODAL: Loaded clients:', clientsData.length)
        setClients(clientsData)
      } else {
        console.error('🚚 DELIVERY_MODAL: Failed to fetch clients:', clientsRes.status)
        const errorText = await clientsRes.text()
        console.error('🚚 DELIVERY_MODAL: Clients error response:', errorText)
      }

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json()
        console.log('🚚 DELIVERY_MODAL: Loaded vehicles:', vehiclesData.length)
        setVehicles(vehiclesData.filter(v => v.status === 'AVAILABLE'))
      } else {
        console.error('🚚 DELIVERY_MODAL: Failed to fetch vehicles:', vehiclesRes.status)
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json()
        console.log('🚚 DELIVERY_MODAL: Loaded drivers:', driversData.length)
        setDrivers(driversData.filter(d => d.isActive))
      } else {
        console.error('🚚 DELIVERY_MODAL: Failed to fetch drivers:', driversRes.status)
      }
    } catch (error) {
      console.error('🚚 DELIVERY_MODAL: Error fetching form data:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.clientId) newErrors.clientId = 'Client is required'
      if (!formData.pickupAddress) newErrors.pickupAddress = 'Pickup address is required'
      if (!formData.deliveryAddress) newErrors.deliveryAddress = 'Delivery address is required'
    }

    if (step === 2) {
      if (!formData.cargoDescription) newErrors.cargoDescription = 'Cargo description is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateStep(currentStep)) return

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        estimatedPrice: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : null,
        distance: formData.distance ? parseFloat(formData.distance) : null,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null,
        scheduledAt: formData.scheduledAt || null
      }

      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const newDelivery = await response.json()
        onDeliveryCreated(newDelivery)
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || 'Failed to create delivery' })
      }
    } catch (error) {
      console.error('Error creating delivery:', error)
      setErrors({ submit: 'Failed to create delivery' })
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        <p className="text-sm text-gray-600">Set up the delivery details and route</p>
      </div>

      {/* Client Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="w-4 h-4 inline mr-2" />
          Client *
        </label>
        <select
          name="clientId"
          value={formData.clientId}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.clientId ? 'border-red-300' : 'border-gray-300'
          }`}
          required
        >
          <option value="">Select a client</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name} {client.phone && `- ${client.phone}`}
            </option>
          ))}
        </select>
        {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>}
        {clients.length === 0 && (
          <p className="mt-1 text-sm text-gray-500">No clients available. Add a client first.</p>
        )}
      </div>

      {/* Pickup Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-2 text-green-600" />
          Pickup Address *
        </label>
        <textarea
          name="pickupAddress"
          value={formData.pickupAddress}
          onChange={handleChange}
          rows={2}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.pickupAddress ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter the pickup location address..."
          required
        />
        {errors.pickupAddress && <p className="mt-1 text-sm text-red-600">{errors.pickupAddress}</p>}
      </div>

      {/* Delivery Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-2 text-red-600" />
          Delivery Address *
        </label>
        <textarea
          name="deliveryAddress"
          value={formData.deliveryAddress}
          onChange={handleChange}
          rows={2}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.deliveryAddress ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter the delivery destination address..."
          required
        />
        {errors.deliveryAddress && <p className="mt-1 text-sm text-red-600">{errors.deliveryAddress}</p>}
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {/* Scheduled Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="w-4 h-4 inline mr-2" />
          Scheduled Date (Optional)
        </label>
        <input
          type="datetime-local"
          name="scheduledAt"
          value={formData.scheduledAt}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Cargo Details</h3>
        <p className="text-sm text-gray-600">Describe what needs to be delivered</p>
      </div>

      {/* Cargo Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Package className="w-4 h-4 inline mr-2" />
          Cargo Description *
        </label>
        <textarea
          name="cargoDescription"
          value={formData.cargoDescription}
          onChange={handleChange}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.cargoDescription ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Describe the cargo to be delivered..."
          required
        />
        {errors.cargoDescription && <p className="mt-1 text-sm text-red-600">{errors.cargoDescription}</p>}
      </div>

      {/* Weight and Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Weight className="w-4 h-4 inline mr-2" />
            Weight (kg)
          </label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Ruler className="w-4 h-4 inline mr-2" />
            Dimensions
          </label>
          <input
            type="text"
            name="dimensions"
            value={formData.dimensions}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 120×80×60 cm"
          />
        </div>
      </div>

      {/* Special Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
        <textarea
          name="specialInstructions"
          value={formData.specialInstructions}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any special handling requirements, delivery instructions, etc..."
        />
      </div>

      {/* Pricing and Distance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-2" />
            Estimated Price
          </label>
          <input
            type="number"
            name="estimatedPrice"
            value={formData.estimatedPrice}
            onChange={handleChange}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
          <input
            type="number"
            name="distance"
            value={formData.distance}
            onChange={handleChange}
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min)</label>
          <input
            type="number"
            name="estimatedDuration"
            value={formData.estimatedDuration}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Assignment & Notes</h3>
        <p className="text-sm text-gray-600">Assign vehicle and driver (optional)</p>
      </div>

      {/* Vehicle Assignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Truck className="w-4 h-4 inline mr-2" />
          Vehicle (Optional)
        </label>
        <select
          name="vehicleId"
          value={formData.vehicleId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a vehicle (optional)</option>
          {vehicles.map(vehicle => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.licensePlate} - {vehicle.make} {vehicle.model} ({vehicle.type})
            </option>
          ))}
        </select>
      </div>

      {/* Driver Assignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="w-4 h-4 inline mr-2" />
          Driver (Optional)
        </label>
        <select
          name="driverId"
          value={formData.driverId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a driver (optional)</option>
          {drivers.map(driver => (
            <option key={driver.id} value={driver.id}>
              {driver.name} {driver.phone && `- ${driver.phone}`}
            </option>
          ))}
        </select>
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any additional notes or comments about this delivery..."
        />
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Delivery</h2>
            <p className="text-sm text-gray-600">Step {currentStep} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep 
                    ? 'bg-blue-600 text-white' 
                    : step < currentStep 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="px-6 py-2">
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errors.submit}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Delivery'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}