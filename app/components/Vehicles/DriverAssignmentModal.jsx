import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Truck, 
  Search, 
  UserCheck,
  UserX,
  AlertCircle,
  Clock,
  CheckCircle,
  Phone,
  Mail
} from 'lucide-react';

const DriverAssignmentModal = ({ show, vehicle, onClose, onAssign }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      fetchDrivers();
      setSelectedDriver(vehicle?.assignedDriverId || null);
    }
  }, [show, vehicle]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users?role=DRIVER', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          assignedDriverId: selectedDriver
        })
      });

      if (response.ok) {
        onAssign();
        onClose();
      }
    } catch (error) {
      console.error('Error updating driver assignment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getDriverStatus = (driver) => {
    // Check if driver has any assigned vehicles
    const hasAssignedVehicle = drivers.some(d => 
      d.assignedVehicles && d.assignedVehicles.length > 0 && d.id === driver.id
    );
    
    return hasAssignedVehicle ? 'assigned' : 'available';
  };

  const getStatusBadge = (status) => {
    if (status === 'available') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Available
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Clock className="w-3 h-3 mr-1" />
          Assigned
        </span>
      );
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.phone && driver.phone.includes(searchTerm))
  );

  const currentDriver = vehicle?.assignedDriver;

  if (!show || !vehicle) return null;

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Assign Driver</h2>
              <p className="text-gray-600">{vehicle.licensePlate} - {vehicle.make} {vehicle.model}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Current Assignment */}
          {currentDriver && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Currently Assigned Driver</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 p-2 rounded-full">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">{currentDriver.name}</p>
                    <p className="text-sm text-blue-700">{currentDriver.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="text-red-600 hover:text-red-800 flex items-center text-sm"
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Unassign
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search drivers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Driver Selection */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select Driver</h3>
            
            {/* Unassign Option */}
            <div
              onClick={() => setSelectedDriver(null)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedDriver === null
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <UserX className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Unassigned</p>
                    <p className="text-sm text-gray-500">No driver assigned to this vehicle</p>
                  </div>
                </div>
                {selectedDriver === null && (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>

            {/* Driver List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading drivers...</p>
              </div>
            ) : filteredDrivers.length > 0 ? (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredDrivers.map((driver) => {
                  const status = getDriverStatus(driver);
                  const isSelected = selectedDriver === driver.id;
                  
                  return (
                    <div
                      key={driver.id}
                      onClick={() => setSelectedDriver(driver.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-medium text-gray-900">{driver.name}</p>
                              {getStatusBadge(status)}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              <div className="flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {driver.email}
                              </div>
                              {driver.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {driver.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">
                  {searchTerm ? 'No drivers found matching your search' : 'No drivers available'}
                </p>
              </div>
            )}
          </div>

          {/* Warning for assigned drivers */}
          {selectedDriver && drivers.find(d => d.id === selectedDriver) && 
           getDriverStatus(drivers.find(d => d.id === selectedDriver)) === 'assigned' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-orange-800">Driver Already Assigned</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    This driver is currently assigned to another vehicle. Assigning them here will remove their previous assignment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignment}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <UserCheck className="w-4 h-4 mr-2" />
              )}
              {selectedDriver ? 'Assign Driver' : 'Remove Assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverAssignmentModal;