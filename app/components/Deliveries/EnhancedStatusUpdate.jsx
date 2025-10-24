'use client'

import { useState } from 'react'
import { 
  Play, MapPin, Package, Navigation, CheckCircle, 
  Clock, AlertTriangle, RotateCcw, XCircle, Truck,
  ArrowRight, User, Save, RefreshCw
} from 'lucide-react'

export default function EnhancedStatusUpdate({ 
  delivery, 
  currentUser, 
  onStatusUpdate, 
  loading 
}) {
  const [selectedAction, setSelectedAction] = useState(null)
  const [updateData, setUpdateData] = useState({
    location: '',
    notes: '',
    issueType: '',
    issueDescription: ''
  })

  // Define the tracking stages with their actions
  const getAvailableActions = (currentStatus) => {
    const actionMap = {
      PENDING: [
        // Assignment happens in Edit Details tab - no action needed here
      ],
      ASSIGNED: [
        {
          id: 'IN_PROGRESS',
          label: 'Start Journey',
          description: 'Driver will start the journey • Driver en route to pickup location',
          icon: <Play className="w-5 h-5" />,
          color: 'bg-green-600 hover:bg-green-700',
          driverAction: true
        },
        {
          id: 'CANCELLED',
          label: 'Cancel Delivery',
          description: 'Cancel this delivery request',
          icon: <XCircle className="w-5 h-5" />,
          color: 'bg-red-600 hover:bg-red-700',
          adminOnly: true
        }
      ],
      IN_PROGRESS: [
        {
          id: 'PICKED_UP',
          label: 'Cargo Picked Up',
          description: 'Awaiting pickup from sender • Package collected from pickup location',
          icon: <Package className="w-5 h-5" />,
          color: 'bg-orange-600 hover:bg-orange-700',
          driverAction: true
        },
        {
          id: 'FAILED_DELIVERY',
          label: 'Report Issue',
          description: 'Report pickup problems or delays',
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'bg-yellow-600 hover:bg-yellow-700',
          requiresIssue: true
        }
      ],
      PICKED_UP: [
        {
          id: 'IN_TRANSIT',
          label: 'Begin Transit',
          description: 'Package will be in transit after pickup • En route to delivery destination',
          icon: <Navigation className="w-5 h-5" />,
          color: 'bg-purple-600 hover:bg-purple-700',
          driverAction: true
        },
        {
          id: 'FAILED_DELIVERY',
          label: 'Report Issue',
          description: 'Report transit problems or delays',
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'bg-yellow-600 hover:bg-yellow-700',
          requiresIssue: true
        }
      ],
      IN_TRANSIT: [
        {
          id: 'OUT_FOR_DELIVERY',
          label: 'Out for Delivery',
          description: 'Driver will begin final delivery • Driver making final approach to delivery address',
          icon: <Truck className="w-5 h-5" />,
          color: 'bg-indigo-600 hover:bg-indigo-700',
          driverAction: true
        },
        {
          id: 'DELAYED',
          label: 'Report Delay',
          description: 'Report delivery delays or obstacles',
          icon: <Clock className="w-5 h-5" />,
          color: 'bg-amber-600 hover:bg-amber-700',
          requiresIssue: true
        }
      ],
      OUT_FOR_DELIVERY: [
        {
          id: 'DELIVERED',
          label: 'Mark as Delivered',
          description: 'Package will be delivered to recipient • Package successfully delivered to destination',
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'bg-green-600 hover:bg-green-700',
          driverAction: true
        },
        {
          id: 'FAILED_DELIVERY',
          label: 'Failed Delivery',
          description: 'Unable to complete delivery',
          icon: <XCircle className="w-5 h-5" />,
          color: 'bg-red-600 hover:bg-red-700',
          requiresIssue: true
        }
      ],
      FAILED_DELIVERY: [
        {
          id: 'IN_TRANSIT',
          label: 'Retry Transit',
          description: 'Resume delivery after resolving issues',
          icon: <RotateCcw className="w-5 h-5" />,
          color: 'bg-blue-600 hover:bg-blue-700'
        },
        {
          id: 'RETURNED',
          label: 'Return to Sender',
          description: 'Return package to pickup location',
          icon: <RotateCcw className="w-5 h-5" />,
          color: 'bg-gray-600 hover:bg-gray-700'
        }
      ],
      DELAYED: [
        {
          id: 'IN_TRANSIT',
          label: 'Resume Transit',
          description: 'Continue delivery after delay',
          icon: <ArrowRight className="w-5 h-5" />,
          color: 'bg-green-600 hover:bg-green-700'
        },
        {
          id: 'FAILED_DELIVERY',
          label: 'Mark as Failed',
          description: 'Unable to continue delivery',
          icon: <XCircle className="w-5 h-5" />,
          color: 'bg-red-600 hover:bg-red-700',
          requiresIssue: true
        }
      ],
      RETURNED: [
        {
          id: 'ASSIGNED',
          label: 'Reassign for Delivery',
          description: 'Attempt delivery again with new assignment',
          icon: <User className="w-5 h-5" />,
          color: 'bg-blue-600 hover:bg-blue-700',
          adminOnly: true
        }
      ]
    }
    
    return actionMap[currentStatus] || []
  }

  const canPerformAction = (action) => {
    if (!currentUser) return false
    
    // Admin can do everything
    if (['ADMIN', 'MANAGER'].includes(currentUser.role)) return true
    
    // Driver can only do driver actions and only for their deliveries
    if (currentUser.role === 'DRIVER') {
      if (delivery.driverId !== currentUser.id) return false
      return action.driverAction || !action.adminOnly
    }
    
    return false
  }

  const handleActionSelect = (action) => {
    setSelectedAction(action)
    setUpdateData({
      location: '',
      notes: '',
      issueType: '',
      issueDescription: ''
    })
  }

  const handleSubmit = async () => {
    if (!selectedAction) return
    
    const payload = {
      status: selectedAction.id,
      location: updateData.location,
      notes: updateData.notes
    }
    
    if (selectedAction.requiresIssue) {
      payload.issueType = updateData.issueType
      payload.issueDescription = updateData.issueDescription
    }
    
    await onStatusUpdate(payload)
    setSelectedAction(null)
  }

  const availableActions = getAvailableActions(delivery.status)
  const filteredActions = availableActions.filter(canPerformAction)

  if (filteredActions.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">No status updates available for this delivery.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Status Display */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          Current Status: {delivery.status.replace('_', ' ')}
        </h3>
        <p className="text-sm text-gray-600">
          Choose an action below to update the delivery status
        </p>
      </div>

      {/* Action Selection */}
      {!selectedAction ? (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Available Actions:</h4>
          <div className="grid gap-3">
            {filteredActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionSelect(action)}
                className={`w-full p-4 rounded-lg text-white text-left transition-colors ${action.color}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {action.icon}
                  </div>
                  <div>
                    <div className="font-medium text-lg">{action.label}</div>
                    <div className="text-sm opacity-90 mt-1">{action.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Action Form */
        <div className="space-y-4">
          {/* Selected Action */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              {selectedAction.icon}
              <span className="font-medium text-gray-900">{selectedAction.label}</span>
            </div>
            <p className="text-sm text-gray-600">{selectedAction.description}</p>
          </div>

          {/* Location Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Location
            </label>
            <input
              type="text"
              value={updateData.location}
              onChange={(e) => setUpdateData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter current location (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Issue Reporting */}
          {selectedAction.requiresIssue && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Type *
                </label>
                <select
                  value={updateData.issueType}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, issueType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select issue type</option>
                  <option value="VEHICLE_BREAKDOWN">Vehicle Breakdown</option>
                  <option value="TRAFFIC_DELAY">Traffic Delay</option>
                  <option value="WEATHER_DELAY">Weather Delay</option>
                  <option value="CUSTOMER_UNAVAILABLE">Customer Unavailable</option>
                  <option value="WRONG_ADDRESS">Wrong Address</option>
                  <option value="DAMAGED_CARGO">Damaged Cargo</option>
                  <option value="ACCIDENT">Accident</option>
                  <option value="FUEL_SHORTAGE">Fuel Shortage</option>
                  <option value="SECURITY_ISSUE">Security Issue</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Description *
                </label>
                <textarea
                  value={updateData.issueDescription}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, issueDescription: e.target.value }))}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={updateData.notes}
              onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes (optional)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setSelectedAction(null)}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Actions
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={loading || (selectedAction.requiresIssue && (!updateData.issueType || !updateData.issueDescription))}
              className={`flex-1 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${selectedAction.color}`}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? 'Updating...' : `Confirm ${selectedAction.label}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}