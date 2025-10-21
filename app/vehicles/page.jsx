'use client';
import { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  MapPin,
  UserCheck
} from 'lucide-react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import VehicleFormModal from '@/components/Vehicles/VehicleFormModal';
import VehicleDetailModal from '@/components/Vehicles/VehicleDetailModal';
import DriverAssignmentModal from '@/components/Vehicles/DriverAssignmentModal';

const VehiclesPage = () => {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSubmit = async (vehicleData) => {
    try {
      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(vehicleData)
      });

      if (response.ok) {
        await fetchVehicles();
        setShowVehicleModal(false);
        setEditingVehicle(null);
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowVehicleModal(true);
  };

  const handleViewVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  const handleAssignDriver = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDriverModal(true);
  };

  const handleDriverAssignment = async () => {
    await fetchVehicles();
    setShowDriverModal(false);
  };

  const handleScheduleMaintenance = (vehicle) => {
    // TODO: Implement maintenance scheduling
    console.log('Schedule maintenance for:', vehicle.licensePlate);
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
      OUT_OF_SERVICE: XCircle
    };

    const Icon = statusIcons[status] || CheckCircle;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      TRUCK: 'bg-blue-100 text-blue-800',
      VAN: 'bg-purple-100 text-purple-800',
      TRAILER: 'bg-gray-100 text-gray-800',
      PICKUP: 'bg-green-100 text-green-800',
      MOTORCYCLE: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type]}`}>
        {type}
      </span>
    );
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statsCards = [
    {
      title: 'Total Vehicles',
      value: vehicles.length,
      icon: Truck,
      color: 'bg-blue-500'
    },
    {
      title: 'Available',
      value: vehicles.filter(v => v.status === 'AVAILABLE').length,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'In Transit',
      value: vehicles.filter(v => v.status === 'IN_TRANSIT').length,
      icon: MapPin,
      color: 'bg-blue-500'
    },
    {
      title: 'Maintenance',
      value: vehicles.filter(v => v.status === 'MAINTENANCE').length,
      icon: AlertTriangle,
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vehicles...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
              <p className="text-gray-600">Manage your vehicles, assignments, and maintenance schedules</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowVehicleModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vehicles by license plate, make, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
              <p className="text-gray-600">
                {vehicles.length === 0 
                  ? "Get started by adding your first vehicle to the fleet."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {vehicles.length === 0 && (
                <button 
                  onClick={() => setShowVehicleModal(true)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Your First Vehicle
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Deliveries
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mileage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <Truck className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.licensePlate}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-xs text-gray-400">
                              Capacity: {vehicle.capacity}t
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(vehicle.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(vehicle.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.assignedDriver ? (
                          <div className="flex items-center">
                            <div className="bg-gray-100 p-1 rounded-full mr-2">
                              <User className="w-3 h-3 text-gray-600" />
                            </div>
                            <div className="text-sm text-gray-900">
                              {vehicle.assignedDriver.name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {vehicle._count?.deliveries || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {vehicle.currentMileage?.toLocaleString() || 0} km
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewVehicle(vehicle)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditVehicle(vehicle)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleAssignDriver(vehicle)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleScheduleMaintenance(vehicle)}
                            className="text-orange-600 hover:text-orange-800"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Form Modal */}
      <VehicleFormModal
        show={showVehicleModal}
        editingVehicle={editingVehicle}
        onSubmit={handleVehicleSubmit}
        onClose={() => {
          setShowVehicleModal(false);
          setEditingVehicle(null);
        }}
      />

      {/* Vehicle Detail Modal */}
      <VehicleDetailModal
        show={showDetailModal}
        vehicle={selectedVehicle}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedVehicle(null);
        }}
        onEdit={(vehicle) => {
          setShowDetailModal(false);
          handleEditVehicle(vehicle);
        }}
        onScheduleMaintenance={handleScheduleMaintenance}
      />

      {/* Driver Assignment Modal */}
      <DriverAssignmentModal
        show={showDriverModal}
        vehicle={selectedVehicle}
        onClose={() => {
          setShowDriverModal(false);
          setSelectedVehicle(null);
        }}
        onAssign={handleDriverAssignment}
      />
    </DashboardLayout>
  );
};

export default VehiclesPage;