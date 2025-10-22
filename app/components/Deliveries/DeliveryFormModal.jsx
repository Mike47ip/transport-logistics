import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Package, MapPin, Clock, DollarSign } from 'lucide-react';

const DeliveryFormModal = ({
  show,
  editingDelivery,
  onSubmit,
  onClose
}) => {
  const [formData, setFormData] = useState({
    clientId: '',
    vehicleId: '',
    driverId: '',
    pickupAddress: '',
    deliveryAddress: '',
    cargoDescription: '',
    weight: '',
    dimensions: '',
    specialInstructions: '',
    priority: 'NORMAL',
    estimatedPrice: '',
    scheduledAt: '',
    notes: ''
  });
  
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchClients();
      fetchVehicles();
      fetchDrivers();
      
      if (editingDelivery) {
        setFormData({
          clientId: editingDelivery.clientId || '',
          vehicleId: editingDelivery.vehicleId || '',
          driverId: editingDelivery.driverId || '',
          pickupAddress: editingDelivery.pickupAddress || '',
          deliveryAddress: editingDelivery.deliveryAddress || '',
          cargoDescription: editingDelivery.cargoDescription || '',
          weight: editingDelivery.weight || '',
          dimensions: editingDelivery.dimensions || '',
          specialInstructions: editingDelivery.specialInstructions || '',
          priority: editingDelivery.priority || 'NORMAL',
          estimatedPrice: editingDelivery.estimatedPrice || '',
          scheduledAt: editingDelivery.scheduledAt ? 
            new Date(editingDelivery.scheduledAt).toISOString().split('T')[0] : '',
          notes: editingDelivery.notes || ''
        });
      }
    }
  }, [show, editingDelivery]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setVehicles(data.filter(v => v.status === 'AVAILABLE'));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setDrivers(data.filter(d => d.isActive));
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (!formData.pickupAddress.trim()) {
      newErrors.pickupAddress = 'Pickup address is required';
    }

    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required';
    }

    if (!formData.cargoDescription.trim()) {
      newErrors.cargoDescription = 'Cargo description is required';
    }

    if (formData.weight && parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Weight must be positive';
    }

    if (formData.estimatedPrice && parseFloat(formData.estimatedPrice) < 0) {
      newErrors.estimatedPrice = 'Price cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        estimatedPrice: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : null,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null,
        clientId: formData.clientId || null,
        vehicleId: formData.vehicleId || null,
        driverId: formData.driverId || null
      };

      console.log('📦 DELIVERY_FORM: Submitting data:', submitData);
      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      console.error('📦 DELIVERY_FORM: Error submitting delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      clientId: '',
      vehicleId: '',
      driverId: '',
      pickupAddress: '',
      deliveryAddress: '',
      cargoDescription: '',
      weight: '',
      dimensions: '',
      specialInstructions: '',
      priority: 'NORMAL',
      estimatedPrice: '',
      scheduledAt: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingDelivery ? 'Edit Delivery Order' : 'Create New Delivery Order'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Client Selection */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client/Customer *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.clientId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.clientId}
                </p>
              )}
            </div>

            {/* Pickup Address */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Address *
              </label>
              <input
                type="text"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.pickupAddress ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter pickup location"
              />
              {errors.pickupAddress && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.pickupAddress}
                </p>
              )}
            </div>

            {/* Delivery Address */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address *
              </label>
              <input
                type="text"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.deliveryAddress ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter delivery destination"
              />
              {errors.deliveryAddress && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.deliveryAddress}
                </p>
              )}
            </div>

            {/* Cargo Description */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo Description *
              </label>
              <textarea
                rows={3}
                value={formData.cargoDescription}
                onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.cargoDescription ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe the goods to be transported..."
              />
              {errors.cargoDescription && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.cargoDescription}
                </p>
              )}
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.weight ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {errors.weight && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.weight}
                </p>
              )}
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions (LxWxH)
              </label>
              <input
                type="text"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 100x50x30 cm"
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

            {/* Vehicle Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Vehicle
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select vehicle (optional)</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.licensePlate} - {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Driver
              </label>
              <select
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select driver (optional)</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
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
                value={formData.estimatedPrice}
                onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.estimatedPrice ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.estimatedPrice && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.estimatedPrice}
                </p>
              )}
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date
              </label>
              <input
                type="date"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Special Instructions */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                rows={3}
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special handling requirements..."
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <Package className="w-4 h-4 mr-2" />
              )}
              {editingDelivery ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryFormModal;