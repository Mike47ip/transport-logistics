import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Truck, Calendar } from 'lucide-react';

const VehicleFormModal = ({
  show,
  editingVehicle,
  onSubmit,
  onClose
}) => {
  const [formData, setFormData] = useState({
    licensePlate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: '',
    capacity: '',
    vin: '',
    color: '',
    fuelType: 'Diesel',
    currentMileage: 0,
    insuranceExpiry: '',
    registrationExpiry: '',
    assignedDriverId: ''
  });
  
  const [drivers, setDrivers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchDrivers();
      if (editingVehicle) {
        setFormData({
          licensePlate: editingVehicle.licensePlate || '',
          make: editingVehicle.make || '',
          model: editingVehicle.model || '',
          year: editingVehicle.year || new Date().getFullYear(),
          type: editingVehicle.type || '',
          capacity: editingVehicle.capacity || '',
          vin: editingVehicle.vin || '',
          color: editingVehicle.color || '',
          fuelType: editingVehicle.fuelType || 'Diesel',
          currentMileage: editingVehicle.currentMileage || 0,
          insuranceExpiry: editingVehicle.insuranceExpiry ? 
            new Date(editingVehicle.insuranceExpiry).toISOString().split('T')[0] : '',
          registrationExpiry: editingVehicle.registrationExpiry ? 
            new Date(editingVehicle.registrationExpiry).toISOString().split('T')[0] : '',
          assignedDriverId: editingVehicle.assignedDriverId || ''
        });
      }
    }
  }, [show, editingVehicle]);

  const fetchDrivers = async () => {
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
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'License plate is required';
    }

    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Valid year is required';
    }

    if (!formData.type) {
      newErrors.type = 'Vehicle type is required';
    }

    if (!formData.capacity || parseFloat(formData.capacity) <= 0) {
      newErrors.capacity = 'Valid capacity is required';
    }

    if (formData.currentMileage < 0) {
      newErrors.currentMileage = 'Mileage cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Convert string numbers to actual numbers and handle dates properly
      const submitData = {
        ...formData,
        year: parseInt(formData.year),
        capacity: parseFloat(formData.capacity),
        currentMileage: parseFloat(formData.currentMileage),
        // Convert date strings to ISO DateTime or null
        insuranceExpiry: formData.insuranceExpiry ? 
          new Date(formData.insuranceExpiry + 'T00:00:00.000Z').toISOString() : null,
        registrationExpiry: formData.registrationExpiry ? 
          new Date(formData.registrationExpiry + 'T00:00:00.000Z').toISOString() : null,
        assignedDriverId: formData.assignedDriverId || null
      };

      console.log('🚛 FORM_SUBMIT: Processed data:', submitData);
      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      console.error('🚛 FORM_SUBMIT: Error submitting vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      licensePlate: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      type: '',
      capacity: '',
      vin: '',
      color: '',
      fuelType: 'Diesel',
      currentMileage: 0,
      insuranceExpiry: '',
      registrationExpiry: '',
      assignedDriverId: ''
    });
    setErrors({});
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
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
            {/* License Plate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Plate *
              </label>
              <input
                type="text"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.licensePlate ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="ABC-1234"
              />
              {errors.licensePlate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.licensePlate}
                </p>
              )}
            </div>

            {/* Make */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Make *
              </label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.make ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Toyota, Ford, Mercedes..."
              />
              {errors.make && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.make}
                </p>
              )}
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.model ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Camry, F-150, Sprinter..."
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.model}
                </p>
              )}
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.year ? 'border-red-300' : 'border-gray-300'
                }`}
                min="1900"
                max={new Date().getFullYear() + 1}
              />
              {errors.year && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.year}
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.type ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select type</option>
                <option value="TRUCK">Truck</option>
                <option value="VAN">Van</option>
                <option value="TRAILER">Trailer</option>
                <option value="PICKUP">Pickup</option>
                <option value="MOTORCYCLE">Motorcycle</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.type}
                </p>
              )}
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (tons) *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.capacity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="2.5"
              />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.capacity}
                </p>
              )}
            </div>

            {/* VIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VIN (Optional)
              </label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1HGBH41JXMN109186"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color (Optional)
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="White, Blue, Red..."
              />
            </div>

            {/* Fuel Type */}
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

            {/* Current Mileage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Mileage (km)
              </label>
              <input
                type="number"
                value={formData.currentMileage}
                onChange={(e) => setFormData({ ...formData, currentMileage: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.currentMileage ? 'border-red-300' : 'border-gray-300'
                }`}
                min="0"
              />
              {errors.currentMileage && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.currentMileage}
                </p>
              )}
            </div>

            {/* Insurance Expiry */}
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

            {/* Registration Expiry */}
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

            {/* Assigned Driver */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Driver
              </label>
              <select
                value={formData.assignedDriverId}
                onChange={(e) => setFormData({ ...formData, assignedDriverId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
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
                <Truck className="w-4 h-4 mr-2" />
              )}
              {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleFormModal;