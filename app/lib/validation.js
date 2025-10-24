// app\lib\validation.js
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone) => {
  // Remove all spaces, dashes, parentheses, and plus signs
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '')
  
  // Allow phone numbers that:
  // - Start with 0 (local format like 023 389434)
  // - Start with country code (233 for Ghana)
  // - Start with + and country code
  // - Are between 9-15 digits
  const phoneRegex = /^[0-9]{9,15}$/
  
  return phoneRegex.test(cleanPhone)
}
export const validateLicensePlate = (plate) => {
  return plate && plate.length >= 2 && plate.length <= 15
}

export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') {
    throw new Error(`${fieldName} is required`)
  }
  return true
}

export const validateDeliveryData = (data) => {
  const errors = []
  
  if (!data.clientId) errors.push('Client is required')
  if (!data.pickupAddress) errors.push('Pickup address is required')
  if (!data.deliveryAddress) errors.push('Delivery address is required')
  if (!data.cargoDescription) errors.push('Cargo description is required')
  
  if (data.weight && data.weight <= 0) {
    errors.push('Weight must be positive')
  }
  
  if (data.estimatedPrice && data.estimatedPrice < 0) {
    errors.push('Price must be positive')
  }
  
  if (data.distance && data.distance < 0) {
    errors.push('Distance must be positive')
  }
  
  if (data.estimatedDuration && data.estimatedDuration < 0) {
    errors.push('Duration must be positive')
  }
  
  if (data.scheduledAt) {
    const scheduledDate = new Date(data.scheduledAt)
    const now = new Date()
    if (scheduledDate < now) {
      errors.push('Scheduled date cannot be in the past')
    }
  }
  
  return errors
}

export const validateVehicleData = (data) => {
  const errors = []
  
  if (!data.licensePlate) errors.push('License plate is required')
  if (!data.make) errors.push('Make is required')
  if (!data.model) errors.push('Model is required')
  if (!data.year || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
    errors.push('Valid year is required')
  }
  if (!data.type) errors.push('Vehicle type is required')
  if (!data.capacity || data.capacity <= 0) {
    errors.push('Valid capacity is required')
  }
  
  return errors
}

// Additional validation functions for the logistics system
export const validateDriverData = (data) => {
  const errors = []
  
  if (!data.name) errors.push('Name is required')
  if (!data.email) errors.push('Email is required')
  else if (!validateEmail(data.email)) errors.push('Valid email is required')
  if (!data.password) errors.push('Password is required')
  else if (data.password.length < 6) errors.push('Password must be at least 6 characters')
  if (data.phone && !validatePhone(data.phone)) errors.push('Valid phone number is required')
  
  return errors
}

export const validateClientData = (data) => {
  const errors = []
  
  if (!data.name) errors.push('Name is required')
  if (!data.phone) errors.push('Phone is required')
  else if (!validatePhone(data.phone)) errors.push('Valid phone number is required')
  if (!data.address) errors.push('Address is required')
  if (data.email && !validateEmail(data.email)) errors.push('Valid email is required')
  if (data.paymentTerms && (data.paymentTerms < 1 || data.paymentTerms > 365)) {
    errors.push('Payment terms must be between 1 and 365 days')
  }
  
  return errors
}

// Utility functions
export const formatPhone = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`
  }
  return phone
}

export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'Not set'
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return new Date(dateString).toLocaleDateString('en-US', { ...defaultOptions, ...options })
}

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  return input.trim().replace(/[<>]/g, '')
}

export const generateTrackingNumber = () => {
  const prefix = 'TRK'
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

// Status and priority helpers
export const getStatusColor = (status) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    AVAILABLE: 'bg-green-100 text-green-800',
    IN_TRANSIT: 'bg-blue-100 text-blue-800',
    MAINTENANCE: 'bg-orange-100 text-orange-800',
    OUT_OF_SERVICE: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export const getPriorityColor = (priority) => {
  const colors = {
    LOW: 'bg-gray-100 text-gray-800',
    NORMAL: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800'
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}