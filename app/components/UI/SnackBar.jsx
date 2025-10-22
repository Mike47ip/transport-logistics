// app\components\UI\SnackBar.jsx



import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

const Snackbar = ({ message, type = 'success', show, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const getSnackbarStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-600 text-white';
      case 'info':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-green-600 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-9999">
      <div
        className={`
          flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg min-w-80 max-w-md
          transform transition-all duration-300 ease-in-out
          ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          ${getSnackbarStyles()}
        `}
      >
        {getIcon()}
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Snackbar;