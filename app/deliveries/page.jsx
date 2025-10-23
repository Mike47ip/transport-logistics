'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, Search, Download, RefreshCw, Package, 
  Truck, Clock, AlertCircle, CheckCircle, XCircle, 
  RotateCcw, Navigation, MapPin, User, Eye, Edit,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react'
import { useSnackbar } from '@/context/SnackbarContext'

// Import your modals - adjust paths as needed
import CreateDeliveryModal from '@/components/Deliveries/CreateDeliveryModal'
import ViewDeliveryModal from '@/components/Deliveries/ViewDeliveryModal'
import EditDeliveryModal from '@/components/Deliveries/EditDeliveryModal'

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [currentUser, setCurrentUser] = useState(null)
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null)

  const { showSuccess, showError } = useSnackbar()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
    fetchDeliveries()
  }, [])

  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/deliveries', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDeliveries(data)
      } else {
        showError('Failed to fetch deliveries')
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error)
      showError('Error loading deliveries')
    } finally {
      setLoading(false)
    }
  }

  const handleView = (delivery) => {
    setSelectedDelivery(delivery)
    setShowViewModal(true)
  }

  const handleEdit = (delivery) => {
    setSelectedDelivery(delivery)
    setShowEditModal(true)
  }

  const handleEditRequest = (delivery) => {
    setShowViewModal(false)
    setSelectedDelivery(delivery)
    setShowEditModal(true)
  }

  const handleDeliveryCreated = (newDelivery) => {
    setDeliveries(prev => [newDelivery, ...prev])
    showSuccess(`Delivery created successfully! Tracking: ${newDelivery.trackingNumber}`)
  }

  const handleDeliveryUpdated = (updatedDelivery) => {
    setDeliveries(prev => 
      prev.map(delivery => 
        delivery.id === updatedDelivery.id ? updatedDelivery : delivery
      )
    )
    setSelectedDelivery(updatedDelivery)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800', 
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      PICKED_UP: 'bg-orange-100 text-orange-800',
      IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
      OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
      DELIVERED: 'bg-green-100 text-green-800',
      FAILED_DELIVERY: 'bg-red-100 text-red-800',
      DELAYED: 'bg-amber-100 text-amber-800',
      RETURNED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-slate-100 text-slate-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'bg-green-100 text-green-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      ASSIGNED: <User className="w-4 h-4" />,
      IN_PROGRESS: <Truck className="w-4 h-4" />,
      PICKED_UP: <MapPin className="w-4 h-4" />,
      IN_TRANSIT: <Navigation className="w-4 h-4" />,
      OUT_FOR_DELIVERY: <Navigation className="w-4 h-4" />,
      DELIVERED: <CheckCircle className="w-4 h-4" />,
      FAILED_DELIVERY: <XCircle className="w-4 h-4" />,
      DELAYED: <AlertCircle className="w-4 h-4" />,
      RETURNED: <RotateCcw className="w-4 h-4" />,
      CANCELLED: <XCircle className="w-4 h-4" />
    }
    return icons[status] || <Package className="w-4 h-4" />
  }

  const getStatusCounts = () => {
    const counts = {
      total: deliveries.length,
      pending: deliveries.filter(d => d.status === 'PENDING').length,
      assigned: deliveries.filter(d => d.status === 'ASSIGNED').length,
      inProgress: deliveries.filter(d => ['IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
      outForDelivery: deliveries.filter(d => d.status === 'OUT_FOR_DELIVERY').length,
      delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
      issues: deliveries.filter(d => ['FAILED_DELIVERY', 'DELAYED', 'RETURNED'].includes(d.status)).length
    }
    return counts
  }

  const filteredAndSortedDeliveries = deliveries
    .filter(delivery => {
      const matchesSearch = 
        delivery.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.cargoDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'ALL' || delivery.status === statusFilter
      const matchesPriority = priorityFilter === 'ALL' || delivery.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      // Handle nested objects
      if (sortField === 'client') {
        aValue = a.client?.name || ''
        bValue = b.client?.name || ''
      } else if (sortField === 'driver') {
        aValue = a.driver?.name || 'Unassigned'
        bValue = b.driver?.name || 'Unassigned'
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const canCreateDelivery = () => {
    if (!currentUser) return false
    return ['ADMIN', 'MANAGER'].includes(currentUser.role)
  }

  const canEdit = (delivery) => {
    if (!currentUser) return false
    return ['ADMIN', 'MANAGER'].includes(currentUser.role)
  }

  const exportDeliveries = () => {
    const csvContent = [
      ['Tracking Number', 'Client', 'Status', 'Priority', 'Pickup Address', 'Delivery Address', 'Created At'].join(','),
      ...filteredAndSortedDeliveries.map(delivery => [
        delivery.trackingNumber,
        delivery.client.name,
        delivery.status,
        delivery.priority,
        `"${delivery.pickupAddress}"`,
        `"${delivery.deliveryAddress}"`,
        new Date(delivery.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deliveries-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-gray-900 font-medium"
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
      ) : (
        <ArrowUpDown className="w-4 h-4 opacity-50" />
      )}
    </button>
  )

  const statusCounts = getStatusCounts()

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-gray-600">Manage and track all delivery operations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={exportDeliveries}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={fetchDeliveries}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {canCreateDelivery() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Delivery
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-semibold text-gray-900">{statusCounts.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-semibold text-gray-900">{statusCounts.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Assigned</p>
              <p className="text-xl font-semibold text-gray-900">{statusCounts.assigned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-xl font-semibold text-gray-900">{statusCounts.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-xl font-semibold text-gray-900">{statusCounts.delivered}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Issues</p>
              <p className="text-xl font-semibold text-gray-900">{statusCounts.issues}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by tracking number, client, cargo, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED_DELIVERY">Failed Delivery</option>
              <option value="DELAYED">Delayed</option>
              <option value="RETURNED">Returned</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            
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
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading deliveries...</span>
          </div>
        ) : filteredAndSortedDeliveries.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL' 
                ? 'No deliveries match your filters'
                : 'No deliveries yet'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                ? 'Try adjusting your search criteria or filters'
                : 'Create your first delivery to get started'
              }
            </p>
            {canCreateDelivery() && !searchTerm && statusFilter === 'ALL' && priorityFilter === 'ALL' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Delivery
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">
                    <SortButton field="trackingNumber">Tracking Number</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">
                    <SortButton field="client">Client</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">
                    <SortButton field="status">Status</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">
                    <SortButton field="priority">Priority</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Route</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">
                    <SortButton field="driver">Driver</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">
                    <SortButton field="createdAt">Created</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">
                    <SortButton field="estimatedPrice">Price</SortButton>
                  </th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{delivery.trackingNumber}</div>
                      <div className="text-sm text-gray-500">{delivery.cargoDescription}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{delivery.client.name}</div>
                      <div className="text-sm text-gray-500">{delivery.client.phone}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                        {getStatusIcon(delivery.status)}
                        {delivery.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(delivery.priority)}`}>
                        {delivery.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-green-600 mb-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-32">{delivery.pickupAddress}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-32">{delivery.deliveryAddress}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {delivery.driver ? delivery.driver.name : 'Unassigned'}
                        </div>
                        <div className="text-gray-500">
                          {delivery.vehicle ? delivery.vehicle.licensePlate : 'No vehicle'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600">{formatDate(delivery.createdAt)}</div>
                      {delivery.scheduledAt && (
                        <div className="text-xs text-orange-600">
                          Scheduled: {formatDate(delivery.scheduledAt)}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-gray-900">
                        {delivery.estimatedPrice ? `GH₵ ${delivery.estimatedPrice}` : 'Not set'}
                      </div>
                      {delivery.distance && (
                        <div className="text-xs text-gray-500">{delivery.distance} km</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(delivery)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        
                        {canEdit(delivery) && (
                          <button
                            onClick={() => handleEdit(delivery)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!loading && filteredAndSortedDeliveries.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Showing {filteredAndSortedDeliveries.length} of {deliveries.length} deliveries
          {(searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('ALL')
                setPriorityFilter('ALL')
              }}
              className="ml-2 text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateDeliveryModal
          onClose={() => setShowCreateModal(false)}
          onDeliveryCreated={handleDeliveryCreated}
        />
      )}

      {showViewModal && selectedDelivery && (
        <ViewDeliveryModal
          delivery={selectedDelivery}
          onClose={() => setShowViewModal(false)}
          onEditRequest={handleEditRequest}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
        />
      )}

      {showEditModal && selectedDelivery && (
        <EditDeliveryModal
          delivery={selectedDelivery}
          onClose={() => setShowEditModal(false)}
          onDeliveryUpdated={handleDeliveryUpdated}
          getStatusColor={getStatusColor}
        />
      )}
    </>
  )
}