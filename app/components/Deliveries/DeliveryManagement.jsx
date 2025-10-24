import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  User,
  Truck,
  Edit,
  Eye,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  X,
  Navigation
} from 'lucide-react';

const DeliveryManagement = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const [formData, setFormData] = useState({
    clientId: '',
    vehicleId: '',
    driverId: '',
    pickupAddress: '',
    deliveryAddress: '',
    pickupDateTime: '',
    deliveryDateTime: '',
    cargoDescription: '',
    weight: '',
    dimensions: '',
    specialInstructions: '',
    priority: 'NORMAL',
    estimatedPrice: ''
  });

  useEffect(() => {
    fetchDeliveries();
    fetchClients();
    fetchVehicles();
  }, [currentPage, statusFilter]);

  const fetchDeliveries = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter && { status: statusFilter })
      });
      
      const response = await fetch(`/api/deliveries?${params}`);
      const data = await response.json();
      setDeliveries(data.deliveries);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      setVehicles(data.filter(v => v.status === 'AVAILABLE'));
      
      // Extract drivers from vehicles
      const driversFromVehicles = data
        .filter(v => v.assignedDriver)
        .map(v => v.assignedDriver);
      setDrivers(driversFromVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingDelivery ? `/api/deliveries/${editingDelivery.id}` : '/api/deliveries';
      const method = editingDelivery ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weight: parseFloat(formData.weight) || null,
          estimatedPrice: parseFloat(formData.estimatedPrice) || null
        })
      });

      if (response.ok) {
        fetchDeliveries();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving delivery:', error);
    }
  };

  const updateDeliveryStatus = async (deliveryId, status, notes = '') => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });

      if (response.ok) {
        fetchDeliveries();
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      vehicleId: '',
      driverId: '',
      pickupAddress: '',
      deliveryAddress: '',
      pickupDateTime: '',
      deliveryDateTime: '',
      cargoDescription: '',
      weight: '',
      dimensions: '',
      specialInstructions: '',
      priority: 'NORMAL',
      estimatedPrice: ''
    });
    setShowAddModal(false);
    setEditingDelivery(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      ASSIGNED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: User },
      IN_PROGRESS: { bg: 'bg-purple-100', text: 'text-purple-800', icon: PlayCircle },
      DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      LOW: 'bg-gray-100 text-gray-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[priority]}`}>
        {priority}
      </span>
    );
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading deliveries...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
              <p className="text-gray-600">Track and manage all deliveries</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Delivery
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
              placeholder="Search by tracking number, client, or address..."
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
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Delivery List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking & Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle & Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{delivery.trackingNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {delivery.client?.name}
                        </div>
                        <div className="mt-1">
                          {getPriorityBadge(delivery.priority)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-900 line-clamp-2">
                            {delivery.pickupAddress}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <Navigation className="w-4 h-4 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-900 line-clamp-2">
                            {delivery.deliveryAddress}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {delivery.vehicle ? (
                          <div className="flex items-center">
                            <Truck className="w-4 h-4 text-blue-500 mr-2" />
                            <span className="text-sm text-gray-900">
                              {delivery.vehicle.licensePlate}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                        {delivery.driver && (
                          <div className="flex items-center mt-1">
                            <User className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-600">
                              {delivery.driver.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        {getStatusBadge(delivery.status)}
                        {delivery.deliveryDateTime && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(delivery.deliveryDateTime).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {delivery.actualPrice || delivery.estimatedPrice ? 
                          `$${(delivery.actualPrice || delivery.estimatedPrice).toLocaleString()}` : 
                          'TBD'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {delivery.status === 'PENDING' && (
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'ASSIGNED')}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Assign
                          </button>
                        )}
                        {delivery.status === 'ASSIGNED' && (
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'IN_PROGRESS')}
                            className="text-purple-600 hover:text-purple-900 text-sm"
                          >
                            Start
                          </button>
                        )}
                        {delivery.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'DELIVERED')}
                            className="text-green-600 hover:text-green-900 text-sm"
                          >
                            Complete
                          </button>
                        )}
                        <button className="text-gray-600 hover:text-gray-900 text-sm">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                      disabled={currentPage === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {filteredDeliveries.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
            <p className="text-gray-600">Try adjusting your search or create a new delivery.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingDelivery ? 'Edit Delivery' : 'Create New Delivery'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle
                  </label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.licensePlate} - {vehicle.make} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pickup Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pickupAddress}
                    onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Pickup DateTime */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.pickupDateTime}
                    onChange={(e) => setFormData({ ...formData, pickupDateTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Delivery DateTime */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.deliveryDateTime}
                    onChange={(e) => setFormData({ ...formData, deliveryDateTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Cargo Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.cargoDescription}
                    onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Dimensions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimensions (L x W x H)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 120x80x60 cm"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Estimated Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.estimatedPrice}
                    onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Special Instructions */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                    placeholder="Any special handling requirements, delivery instructions, etc."
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
                  {editingDelivery ? 'Update Delivery' : 'Create Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryManagement;