// app\components\UI\Snackbar.jsx

'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const Snackbar = ({ 
  message, 
  type = 'success', 
  show, 
  onClose, 
  duration = 5000,
  position = 'bottom-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
}) => {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for animation to complete
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2'
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2'
      default:
        return 'bottom-4 right-4'
    }
  }

  const getSnackbarStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500 text-green-800'
      case 'error':
        return 'bg-red-50 border-l-4 border-red-500 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-l-4 border-blue-500 text-blue-800'
      default:
        return 'bg-green-50 border-l-4 border-green-500 text-green-800'
    }
  }
  
  const getIconStyles = () => {
    switch (type) {
      case 'success':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'info':
        return 'text-blue-500'
      default:
        return 'text-green-500'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className={`w-5 h-5 ${getIconStyles()}`} />
      case 'error':
        return <XCircle className={`w-5 h-5 ${getIconStyles()}`} />
      case 'warning':
        return <AlertTriangle className={`w-5 h-5 ${getIconStyles()}`} />
      case 'info':
        return <Info className={`w-5 h-5 ${getIconStyles()}`} />
      default:
        return <CheckCircle className={`w-5 h-5 ${getIconStyles()}`} />
    }
  }

  if (!show) return null

  return (
    <div 
      className={`fixed z-50 ${getPositionClasses()} transition-all duration-300 ease-in-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className={`${getSnackbarStyles()} shadow-lg rounded-lg max-w-sm w-full overflow-hidden`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            {getIcon()}
            <span className="ml-3 font-medium">{message}</span>
          </div>
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
            className={`${getIconStyles()} hover:opacity-80 focus:outline-none transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="h-1 bg-gray-200">
          <div 
            className={`h-full ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}
            style={{ 
              width: '100%', 
              animation: `shrink ${duration}ms linear forwards` 
            }}
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

export default Snackbar