import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Calendar,
  User,
  Wrench,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [formData, setFormData] = useState({
    licensePlate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'TRUCK',
    capacity: '',
    vin: '',
    color: '',
    fuelType: 'Diesel',
    currentMileage: 0,
    insuranceExpiry: '',
    registrationExpiry: '',
    assignedDriverId: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchVehicles();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      licensePlate: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      type: 'TRUCK',
      capacity: '',
      vin: '',
      color: '',
      fuelType: 'Diesel',
      currentMileage: 0,
      insuranceExpiry: '',
      registrationExpiry: '',
      assignedDriverId: ''
    });
    setShowAddModal(false);
    setEditingVehicle(null);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      licensePlate: vehicle.licensePlate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      type: vehicle.type,
      capacity: vehicle.capacity,
      vin: vehicle.vin || '',
      color: vehicle.color || '',
      fuelType: vehicle.fuelType,
      currentMileage: vehicle.currentMileage,
      insuranceExpiry: vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toISOString().split('T')[0] : '',
      registrationExpiry: vehicle.registrationExpiry ? new Date(vehicle.registrationExpiry).toISOString().split('T')[0] : '',
      assignedDriverId: vehicle.assignedDriverId || ''
    });
    setShowAddModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      AVAILABLE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      IN_TRANSIT: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Truck },
      MAINTENANCE: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Wrench },
      OUT_OF_SERVICE: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.AVAILABLE;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
              <p className="text-gray-600">Manage your fleet vehicles and assignments</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>
        </div>

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Truck className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{vehicle.licensePlate}</h3>
                      <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</p>
                    </div>
                  </div>
                  {getStatusBadge(vehicle.status)}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Year:</span>
                    <span className="text-gray-900">{vehicle.year}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="text-gray-900">{vehicle.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="text-gray-900">{vehicle.capacity} tons</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mileage:</span>
                    <span className="text-gray-900">{vehicle.currentMileage.toLocaleString()} km</span>
                  </div>
                </div>

                {vehicle.assignedDriver && (
                  <div className="flex items-center mb-4 p-2 bg-gray-50 rounded">
                    <User className="w-4 h-4 text-gray-600 mr-2" />
                    <span className="text-sm text-gray-700">{vehicle.assignedDriver.name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>Active Deliveries: {vehicle._count?.deliveries || 0}</span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(vehicle)}
                    className="flex-1 bg-blue-50 text-blue-700 py-2 px-3 rounded hover:bg-blue-100 flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button className="flex-1 bg-gray-50 text-gray-700 py-2 px-3 rounded hover:bg-gray-100 flex items-center justify-center">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600">Try adjusting your search or add a new vehicle.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Make *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="TRUCK">Truck</option>
                    <option value="VAN">Van</option>
                    <option value="TRAILER">Trailer</option>
                    <option value="PICKUP">Pickup</option>
                    <option value="MOTORCYCLE">Motorcycle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity (tons) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    VIN
                  </label>
                  <input
                    type="text"
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Mileage (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentMileage}
                    onChange={(e) => setFormData({ ...formData, currentMileage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Expiry
                  </label>
                  <input
                    type="date"
                    value={formData.insuranceExpiry}
                    onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Expiry
                  </label>
                  <input
                    type="date"
                    value={formData.registrationExpiry}
                    onChange={(e) => setFormData({ ...formData, registrationExpiry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                >
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;