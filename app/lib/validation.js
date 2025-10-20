// /lib/validations.js
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
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