'use client';
import { useState, useEffect } from 'react';
import { 
  User, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Truck,
  Package
} from 'lucide-react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import DriverFormModal from '@/components/Drivers/DriverFormModal';
import Snackbar from '@/components/UI/Snackbar';

const DriversPage = () => {
  const [user, setUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDrivers();
  }, []);

  const showSnackbar = (message, type = 'success') => {
    console.log('🚗 SNACKBAR: Showing message:', message, 'Type:', type);
    setSnackbar({ show: true, message, type });
  };

  const hideSnackbar = () => {
    console.log('🚗 SNACKBAR: Hiding snackbar');
    setSnackbar({ show: false, message: '', type: 'success' });
  };

  const fetchDrivers = async () => {
    try {
      console.log('🚗 DRIVERS: Fetching drivers...');
      setLoading(true);
      const response = await fetch('/api/drivers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('🚗 DRIVERS: API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('🚗 DRIVERS: Fetch failed:', errorData);
        showSnackbar('Failed to load drivers', 'error');
        return;
      }
      
      const data = await response.json();
      console.log('🚗 DRIVERS: Loaded drivers count:', data.length);
      setDrivers(data);
    } catch (error) {
      console.error('🚗 DRIVERS: Fetch error:', error);
      showSnackbar('Failed to load drivers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDriverSubmit = async (driverData) => {
    try {
      console.log('🚗 DRIVER_SUBMIT: Starting submission...');
      console.log('🚗 DRIVER_SUBMIT: Driver data:', { ...driverData, password: '***hidden***' });
      console.log('🚗 DRIVER_SUBMIT: Editing mode:', !!editingDriver);
      
      const url = editingDriver ? `/api/drivers/${editingDriver.id}` : '/api/drivers';
      const method = editingDriver ? 'PUT' : 'POST';
      
      console.log('🚗 DRIVER_SUBMIT: API URL:', url);
      console.log('🚗 DRIVER_SUBMIT: HTTP Method:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(driverData)
      });

      console.log('🚗 DRIVER_SUBMIT: Response status:', response.status);
      console.log('🚗 DRIVER_SUBMIT: Response ok:', response.ok);
      
      const responseData = await response.json();
      console.log('🚗 DRIVER_SUBMIT: Response data:', responseData);

      if (response.ok) {
        console.log('🚗 DRIVER_SUBMIT: Success! Refreshing list...');
        await fetchDrivers();
        setShowDriverModal(false);
        setEditingDriver(null);
        showSnackbar(
          editingDriver ? 'Driver updated successfully!' : 'Driver added successfully!',
          'success'
        );
      } else {
        console.error('🚗 DRIVER_SUBMIT: Failed with error:', responseData.error);
        showSnackbar(responseData.error || 'Failed to save driver', 'error');
      }
    } catch (error) {
      console.error('🚗 DRIVER_SUBMIT: Submit error:', error);
      showSnackbar('Failed to save driver', 'error');
    }
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
    setShowDriverModal(true);
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (driver.phone && driver.phone.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'ALL' || 
                         (statusFilter === 'ACTIVE' && driver.isActive) ||
                         (statusFilter === 'INACTIVE' && !driver.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const activeDrivers = drivers.filter(d => d.isActive);
  const assignedDrivers = drivers.filter(d => d.assignedVehicles?.length > 0);
  const availableDrivers = drivers.filter(d => d.isActive && (!d.assignedVehicles || d.assignedVehicles.length === 0));

  const statsCards = [
    {
      title: 'Total Drivers',
      value: drivers.length,
      icon: User,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Drivers',
      value: activeDrivers.length,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Assigned to Vehicles',
      value: assignedDrivers.length,
      icon: Truck,
      color: 'bg-purple-500'
    },
    {
      title: 'Available',
      value: availableDrivers.length,
      icon: User,
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading drivers...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
              <p className="text-gray-600">Manage your drivers, assignments, and availability</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowDriverModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
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
                placeholder="Search drivers by name, email, or phone..."
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
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredDrivers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
              <p className="text-gray-600">
                {drivers.length === 0 
                  ? "Get started by adding your first driver to the team."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {drivers.length === 0 && (
                <button 
                  onClick={() => setShowDriverModal(true)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Your First Driver
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Deliveries
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {driver.name}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Mail className="w-3 h-3 mr-1" />
                              {driver.email}
                            </div>
                            {driver.phone && (
                              <div className="flex items-center text-xs text-gray-400 mt-1">
                                <Phone className="w-3 h-3 mr-1" />
                                {driver.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(driver.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {driver.assignedVehicles && driver.assignedVehicles.length > 0 ? (
                          <div>
                            {driver.assignedVehicles.map((vehicle) => (
                              <div key={vehicle.id} className="flex items-center mb-1">
                                <div className="bg-gray-100 p-1 rounded mr-2">
                                  <Truck className="w-3 h-3 text-gray-600" />
                                </div>
                                <div>
                                  <div className="text-sm text-gray-900">{vehicle.licensePlate}</div>
                                  <div className="text-xs text-gray-500">{vehicle.make} {vehicle.model}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {driver.deliveries?.length || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {new Date(driver.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleEditDriver(driver)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <Edit className="w-4 h-4" />
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

      {/* Driver Form Modal */}
      <DriverFormModal
        show={showDriverModal}
        editingDriver={editingDriver}
        onSubmit={handleDriverSubmit}
        onClose={() => {
          setShowDriverModal(false);
          setEditingDriver(null);
        }}
      />

      {/* Snackbar */}
      <Snackbar
        show={snackbar.show}
        message={snackbar.message}
        type={snackbar.type}
        onClose={hideSnackbar}
      />
    </DashboardLayout>
  );
};

export default DriversPage;