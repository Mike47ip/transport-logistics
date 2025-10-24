'use client'

import { useState, useEffect } from 'react'

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
  const [submitting, setSubmitting] = useState(false)
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
        console.error('🚚 DELIVERY_MODAL: No token found')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
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
        console.error('🚚 DELIVERY_MODAL: Clients request failed:', clientsRes.status)
      }

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json()
        console.log('🚚 DELIVERY_MODAL: Loaded vehicles:', vehiclesData.length)
        setVehicles(vehiclesData.filter(v => v.status === 'AVAILABLE'))
      } else {
        console.error('🚚 DELIVERY_MODAL: Vehicles request failed:', vehiclesRes.status)
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json()
        console.log('🚚 DELIVERY_MODAL: Loaded drivers:', driversData.length)
        setDrivers(driversData.filter(d => d.isActive))
      } else {
        console.error('🚚 DELIVERY_MODAL: Drivers request failed:', driversRes.status)
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
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateStep = (step) => {
    const newErrors = {}

    switch (step) {
      case 1:
        if (!formData.clientId) newErrors.clientId = 'Client is required'
        if (!formData.pickupAddress) newErrors.pickupAddress = 'Pickup address is required'
        if (!formData.deliveryAddress) newErrors.deliveryAddress = 'Delivery address is required'
        break
      case 2:
        if (!formData.cargoDescription) newErrors.cargoDescription = 'Cargo description is required'
        break
      case 3:
        // Optional validations for final step
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = (e) => {
    e.preventDefault() // Prevent any form submission
    e.stopPropagation() // Stop event bubbling
    
    console.log('🚚 DELIVERY_MODAL: Next button clicked for step', currentStep)
    
    if (validateStep(currentStep)) {
      console.log('🚚 DELIVERY_MODAL: Validation passed, moving to step', currentStep + 1)
      setCurrentStep(prev => prev + 1)
    } else {
      console.log('🚚 DELIVERY_MODAL: Validation failed for step', currentStep)
    }
  }

  const handleBack = (e) => {
    e.preventDefault() // Prevent any form submission
    e.stopPropagation() // Stop event bubbling
    
    console.log('🚚 DELIVERY_MODAL: Back button clicked')
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('🚚 DELIVERY_MODAL: Form submitted - this should ONLY happen on step 3!')
    
    if (currentStep !== 3) {
      console.error('🚚 DELIVERY_MODAL: UNEXPECTED SUBMISSION - not on step 3!')
      return false
    }
    
    if (!validateStep(3)) {
      console.log('🚚 DELIVERY_MODAL: Step 3 validation failed')
      return false
    }

    setSubmitting(true)
    
    try {
      console.log('🚚 DELIVERY_MODAL: Starting delivery creation...')
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Prepare submission data
      const submissionData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        estimatedPrice: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : null,
        distance: formData.distance ? parseFloat(formData.distance) : null,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null,
        // Convert empty strings to null for optional foreign keys
        vehicleId: formData.vehicleId || null,
        driverId: formData.driverId || null,
        scheduledAt: formData.scheduledAt || null
      }

      console.log('🚚 DELIVERY_MODAL: Submission data:', submissionData)

      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      const responseData = await response.json()
      console.log('🚚 DELIVERY_MODAL: Response:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create delivery')
      }

      console.log('🚚 DELIVERY_MODAL: Delivery created successfully:', responseData.trackingNumber)
      
      // Call the callback to refresh the deliveries list
      if (onDeliveryCreated) {
        onDeliveryCreated(responseData)
      }
      
      // Close the modal
      onClose()
      
    } catch (error) {
      console.error('🚚 DELIVERY_MODAL: Error creating delivery:', error)
      setErrors({ submit: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client *
        </label>
        <select
          name="clientId"
          value={formData.clientId}
          onChange={handleChange}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.clientId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select a client</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name} - {client.phone}
            </option>
          ))}
        </select>
        {errors.clientId && <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pickup Address *
        </label>
        <textarea
          name="pickupAddress"
          value={formData.pickupAddress}
          onChange={handleChange}
          rows={3}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.pickupAddress ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter pickup address"
        />
        {errors.pickupAddress && <p className="text-red-500 text-sm mt-1">{errors.pickupAddress}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Delivery Address *
        </label>
        <textarea
          name="deliveryAddress"
          value={formData.deliveryAddress}
          onChange={handleChange}
          rows={3}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.deliveryAddress ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter delivery address"
        />
        {errors.deliveryAddress && <p className="text-red-500 text-sm mt-1">{errors.deliveryAddress}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scheduled Date (Optional)
        </label>
        <input
          type="datetime-local"
          name="scheduledAt"
          value={formData.scheduledAt}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cargo Description *
        </label>
        <textarea
          name="cargoDescription"
          value={formData.cargoDescription}
          onChange={handleChange}
          rows={3}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.cargoDescription ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe the cargo being delivered"
        />
        {errors.cargoDescription && <p className="text-red-500 text-sm mt-1">{errors.cargoDescription}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            step="0.1"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dimensions (L×W×H)
          </label>
          <input
            type="text"
            name="dimensions"
            value={formData.dimensions}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 100×50×30 cm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Instructions
        </label>
        <textarea
          name="specialInstructions"
          value={formData.specialInstructions}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Any special handling requirements"
        />
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle (Optional)
          </label>
          <select
            name="vehicleId"
            value={formData.vehicleId}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a vehicle</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Driver (Optional)
          </label>
          <select
            name="driverId"
            value={formData.driverId}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a driver</option>
            {drivers.map(driver => (
              <option key={driver.id} value={driver.id}>
                {driver.name} - {driver.phone}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Price (GH₵)
          </label>
          <input
            type="number"
            name="estimatedPrice"
            value={formData.estimatedPrice}
            onChange={handleChange}
            step="0.01"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distance (km)
          </label>
          <input
            type="number"
            name="distance"
            value={formData.distance}
            onChange={handleChange}
            step="0.1"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Any additional notes"
        />
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Delivery</h2>
            <p className="text-sm text-gray-500">Step {currentStep} of 3</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              
              <div className="flex items-center gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Back
                  </button>
                )}
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <form onSubmit={handleSubmit} className="inline-block">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      {submitting ? 'Creating...' : 'Create Delivery'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}