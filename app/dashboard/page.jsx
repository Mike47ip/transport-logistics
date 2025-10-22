'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, MapPin, Truck, User, Clock, Package } from 'lucide-react'
import DeliveryCard from '@/components/deliveries/DeliveryCard'
import CreateDeliveryModal from '@/components/deliveries/CreateDeliveryModal'
import DeliveryDetailsModal from '@/components/deliveries/DeliveryDetailsModal'
import StatusFilter from '@/components/deliveries/StatusFilter'

export default function DeliveriesPage() {
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

  const fetchDeliveries = async () => {
    try {
      const response = await fetch('/api/deliveries')
      if (response.ok) {
        const data = await response.json()
        setDeliveries(data)
        calculateStats(data)
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error)
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(delivery => 
        delivery.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.cargoDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(delivery => delivery.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(delivery => delivery.priority === priorityFilter)
    }

    setFilteredDeliveries(filtered)
  }

  useEffect(() => {
    fetchDeliveries()
  }, [])

  useEffect(() => {
    filterDeliveries()
  }, [deliveries, searchTerm, statusFilter, priorityFilter])

  const handleDeliveryCreated = (newDelivery) => {
    setDeliveries(prev => [newDelivery, ...prev])
    setShowCreateModal(false)
  }

  const handleDeliveryUpdated = (updatedDelivery) => {
    setDeliveries(prev => 
      prev.map(delivery => 
        delivery.id === updatedDelivery.id ? updatedDelivery : delivery
      )
    )
    setSelectedDelivery(updatedDelivery)
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
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
          <p className="text-gray-600 mt-1">Track and manage your logistics operations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Delivery
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-3xl font-bold text-blue-600">{stats.assigned}</p>
            </div>
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-purple-600">{stats.inProgress}</p>
            </div>
            <Truck className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-3xl font-bold text-green-600">{stats.delivered}</p>
            </div>
            <MapPin className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <Package className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by tracking number, client, cargo, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      <div className="space-y-4">
        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : 'Create your first delivery to get started.'}
            </p>
            {(!searchTerm && statusFilter === 'ALL' && priorityFilter === 'ALL') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Delivery
              </button>
            )}
          </div>
        ) : (
          filteredDeliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onClick={() => setSelectedDelivery(delivery)}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
            />
          ))
        )}
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
    </div>
  )
}