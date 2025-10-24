import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  User, 
  Calendar, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Package,
  Wrench,
  FileText,
  Clock,
  Fuel,
  Shield
} from 'lucide-react';

const VehicleDetailModal = ({ show, vehicle, onClose, onEdit, onScheduleMaintenance }) => {
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && vehicle) {
      fetchVehicleDetails();
    }
  }, [show, vehicle]);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    try {
      // Fetch maintenance history
      const maintenanceResponse = await fetch(`/api/vehicles/${vehicle.id}/maintenance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const maintenanceData = await maintenanceResponse.json();
      setMaintenanceHistory(maintenanceData);

      // Fetch recent deliveries
      const deliveriesResponse = await fetch(`/api/vehicles/${vehicle.id}/deliveries`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const deliveriesData = await deliveriesResponse.json();
      setRecentDeliveries(deliveriesData);
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      AVAILABLE: 'bg-green-100 text-green-800',
      IN_TRANSIT: 'bg-blue-100 text-blue-800',
      MAINTENANCE: 'bg-orange-100 text-orange-800',
      OUT_OF_SERVICE: 'bg-red-100 text-red-800'
    };

    const statusIcons = {
      AVAILABLE: CheckCircle,
      IN_TRANSIT: Truck,
      MAINTENANCE: AlertTriangle,
      OUT_OF_SERVICE: X
    };

    const Icon = statusIcons[status] || CheckCircle;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status]}`}>
        <Icon className="w-4 h-4 mr-2" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getMaintenanceStatusBadge = (status) => {
    const statusStyles = {
      SCHEDULED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getDeliveryStatusBadge = (status) => {
    const statusStyles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const isInsuranceExpiring = () => {
    if (!vehicle?.insuranceExpiry) return false;
    const expiryDate = new Date(vehicle.insuranceExpiry);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isRegistrationExpiring = () => {
    if (!vehicle?.registrationExpiry) return false;
    const expiryDate = new Date(vehicle.registrationExpiry);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (!show || !vehicle) return null;

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{vehicle.licensePlate}</h2>
              <p className="text-gray-600">{vehicle.year} {vehicle.make} {vehicle.model}</p>
            </div>
            <div>
              {getStatusBadge(vehicle.status)}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(vehicle)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Vehicle
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Vehicle Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Basic Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Vehicle Type</label>
                  <p className="text-gray-900">{vehicle.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Capacity</label>
                  <p className="text-gray-900">{vehicle.capacity} tons</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Color</label>
                  <p className="text-gray-900">{vehicle.color || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">VIN</label>
                  <p className="text-gray-900 font-mono text-sm">{vehicle.vin || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Operational Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Fuel className="w-5 h-5 mr-2" />
                Operational Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Fuel Type</label>
                  <p className="text-gray-900">{vehicle.fuelType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Mileage</label>
                  <p className="text-gray-900">{vehicle.currentMileage?.toLocaleString()} km</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Driver</label>
                  {vehicle.assignedDriver ? (
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <p className="text-gray-900">{vehicle.assignedDriver.name}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Unassigned</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Active Deliveries</label>
                  <p className="text-gray-900">{vehicle._count?.deliveries || 0}</p>
                </div>
              </div>
            </div>

            {/* Documentation */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Documentation
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Insurance Expiry</label>
                  <div className="flex items-center">
                    <p className="text-gray-900">
                      {vehicle.insuranceExpiry 
                        ? new Date(vehicle.insuranceExpiry).toLocaleDateString()
                        : 'Not specified'
                      }
                    </p>
                    {isInsuranceExpiring() && (
                      <AlertTriangle className="w-4 h-4 text-orange-500 ml-2" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Registration Expiry</label>
                  <div className="flex items-center">
                    <p className="text-gray-900">
                      {vehicle.registrationExpiry 
                        ? new Date(vehicle.registrationExpiry).toLocaleDateString()
                        : 'Not specified'
                      }
                    </p>
                    {isRegistrationExpiring() && (
                      <AlertTriangle className="w-4 h-4 text-orange-500 ml-2" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Added Date</label>
                  <p className="text-gray-900">
                    {new Date(vehicle.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(isInsuranceExpiring() || isRegistrationExpiring()) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-600 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-orange-800">Documentation Expiring Soon</h4>
                  <div className="text-sm text-orange-700 mt-1">
                    {isInsuranceExpiring() && <p>• Insurance expires soon</p>}
                    {isRegistrationExpiring() && <p>• Registration expires soon</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maintenance History */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Wrench className="w-5 h-5 mr-2" />
                  Maintenance History
                </h3>
                <button
                  onClick={() => onScheduleMaintenance(vehicle)}
                  className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                >
                  Schedule Maintenance
                </button>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                  </div>
                ) : maintenanceHistory.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {maintenanceHistory.map((maintenance) => (
                      <div key={maintenance.id} className="border-l-4 border-orange-200 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{maintenance.title}</h4>
                          {getMaintenanceStatusBadge(maintenance.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{maintenance.description}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-2">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(maintenance.scheduledAt).toLocaleDateString()}
                          {maintenance.cost && (
                            <>
                              <span className="mx-2">•</span>
                              ${maintenance.cost.toFixed(2)}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No maintenance records</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Deliveries */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Recent Deliveries
                </h3>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                  </div>
                ) : recentDeliveries.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {recentDeliveries.map((delivery) => (
                      <div key={delivery.id} className="border-l-4 border-blue-200 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{delivery.client?.name}</h4>
                          {getDeliveryStatusBadge(delivery.status)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">{delivery.deliveryAddress}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-2">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(delivery.createdAt).toLocaleDateString()}
                          {delivery.actualPrice && (
                            <>
                              <span className="mx-2">•</span>
                              ${delivery.actualPrice.toFixed(2)}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No recent deliveries</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailModal;