'use client'

import React, { createContext, useContext, useState } from 'react'
import Snackbar from '@/components/UI/SnackBar'

// Create context
const SnackbarContext = createContext()

// Custom hook to use the snackbar
export const useSnackbar = () => {
  const context = useContext(SnackbarContext)
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider')
  }
  return context
}

// Snackbar provider component
export const SnackbarProvider = ({ children, position = 'bottom-right' }) => {
  const [snackbar, setSnackbar] = useState({
    show: false,
    message: '',
    type: 'success',
    duration: 5000,
  })

  // Function to show the snackbar
  const showSnackbar = ({ message, type = 'success', duration = 5000 }) => {
    setSnackbar({
      show: true,
      message,
      type,
      duration,
    })
  }

  // Function to hide the snackbar
  const hideSnackbar = () => {
    setSnackbar((prev) => ({
      ...prev,
      show: false,
    }))
  }

  // Function to show success snackbar
  const showSuccess = (message, duration = 5000) => {
    showSnackbar({ message, type: 'success', duration })
  }

  // Function to show error snackbar
  const showError = (message, duration = 5000) => {
    showSnackbar({ message, type: 'error', duration })
  }

  // Function to show warning snackbar
  const showWarning = (message, duration = 5000) => {
    showSnackbar({ message, type: 'warning', duration })
  }

  // Function to show info snackbar
  const showInfo = (message, duration = 5000) => {
    showSnackbar({ message, type: 'info', duration })
  }

  const value = {
    showSnackbar,
    hideSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        show={snackbar.show}
        message={snackbar.message}
        type={snackbar.type}
        duration={snackbar.duration}
        onClose={hideSnackbar}
        position={position}
      />
    </SnackbarContext.Provider>
  )
}

export default SnackbarContext