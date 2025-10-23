// app\deliveries\page.jsx

'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, MapPin, Truck, User, Clock, Package } from 'lucide-react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import DeliveryCard from '@/components/deliveries/DeliveryCard'
import CreateDeliveryModal from '@/components/deliveries/CreateDeliveryModal'
import DeliveryDetailsModal from '@/components/deliveries/DeliveryDetailsModal'
import { useSnackbar } from '@/context/SnackbarContext'

export default function DeliveriesPage() {
  const [user, setUser] = useState(null)
  const [deliveries, setDeliveries] = useState([])
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    delivered: 0,
    cancelled: 0
  })
  
  // Use the snackbar hook
  const { showSuccess, showError, showInfo, showWarning } = useSnackbar()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchDeliveries()
  }, [])

  const fetchDeliveries = async () => {
    try {
      console.log('🚚 DELIVERIES: Fetching deliveries...')
      setLoading(true)
      const response = await fetch('/api/deliveries', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      console.log('🚚 DELIVERIES: Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🚚 DELIVERIES: Loaded deliveries:', data.length)
        setDeliveries(data)
        calculateStats(data)
      } else {
        console.error('🚚 DELIVERIES: Failed to fetch deliveries:', response.status)
        showError('Failed to load deliveries. Please try again.')
      }
    } catch (error) {
      console.error('🚚 DELIVERIES: Error fetching deliveries:', error)
      showError('Error loading deliveries. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (deliveriesData) => {
    const stats = {
      total: deliveriesData.length,
      pending: deliveriesData.filter(d => d.status === 'PENDING').length,
      assigned: deliveriesData.filter(d => d.status === 'ASSIGNED').length,
      inProgress: deliveriesData.filter(d => d.status === 'IN_PROGRESS').length,
      delivered: deliveriesData.filter(d => d.status === 'DELIVERED').length,
      cancelled: deliveriesData.filter(d => d.status === 'CANCELLED').length,
    }
    setStats(stats)
  }

  const filterDeliveries = () => {
    let filtered = deliveries

    if (searchTerm) {
      filtered = filtered.filter(delivery => 
        delivery.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.cargoDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(delivery => delivery.status === statusFilter)
    }

    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(delivery => delivery.priority === priorityFilter)
    }

    setFilteredDeliveries(filtered)
  }

  useEffect(() => {
    filterDeliveries()
  }, [deliveries, searchTerm, statusFilter, priorityFilter])

  const handleDeliveryCreated = (newDelivery) => {
    setDeliveries(prev => [newDelivery, ...prev])
    setShowCreateModal(false)
    // Show success snackbar
    showSuccess(`Delivery ${newDelivery.trackingNumber} created successfully!`)
  }

  const handleDeliveryUpdated = (updatedDelivery) => {
    setDeliveries(prev => 
      prev.map(delivery => 
        delivery.id === updatedDelivery.id ? updatedDelivery : delivery
      )
    )
    setSelectedDelivery(updatedDelivery)
    // Show success snackbar for update
    showSuccess(`Delivery ${updatedDelivery.trackingNumber} updated successfully!`)
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800', 
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading deliveries...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
            <p className="mt-1 text-sm text-gray-600">Track and manage your logistics operations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Delivery
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.assigned}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.inProgress}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.delivered}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.cancelled}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by tracking number, client, cargo, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Priority</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredDeliveries.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Create your first delivery to get started.'}
              </p>
              {(!searchTerm && statusFilter === 'ALL' && priorityFilter === 'ALL') && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Your First Delivery
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {filteredDeliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  onClick={() => setSelectedDelivery(delivery)}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateDeliveryModal
          onClose={() => setShowCreateModal(false)}
          onDeliveryCreated={handleDeliveryCreated}
        />
      )}

      {selectedDelivery && (
        <DeliveryDetailsModal
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          onDeliveryUpdated={handleDeliveryUpdated}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
        />
      )}
    </DashboardLayout>
  )
}