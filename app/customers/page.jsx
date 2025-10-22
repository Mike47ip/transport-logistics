'use client'

import { useState, useEffect } from 'react'
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
  Mail,
  Phone,
  MapPin,
  Package,
  Calendar,
  Building
} from 'lucide-react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import ClientFormModal from '@/components/clients/ClientFormModal'
import Snackbar from '@/components/UI/Snackbar'

const ClientsPage = () => {
  const [user, setUser] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showClientModal, setShowClientModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchClients()
  }, [])

  const showSnackbar = (message, type = 'success') => {
    console.log('👥 SNACKBAR: Showing message:', message, 'Type:', type)
    setSnackbar({ show: true, message, type })
  }

  const hideSnackbar = () => {
    console.log('👥 SNACKBAR: Hiding snackbar')
    setSnackbar({ show: false, message: '', type: 'success' })
  }

  const fetchClients = async () => {
    try {
      console.log('👥 CLIENTS: Fetching clients...')
      setLoading(true)
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      console.log('👥 CLIENTS: API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('👥 CLIENTS: Fetch failed:', errorData)
        showSnackbar('Failed to load clients', 'error')
        return
      }
      
      const data = await response.json()
      console.log('👥 CLIENTS: Loaded clients count:', data.length)
      setClients(data)
    } catch (error) {
      console.error('👥 CLIENTS: Fetch error:', error)
      showSnackbar('Failed to load clients', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClientSubmit = async (clientData) => {
    try {
      console.log('👥 CLIENT_SUBMIT: Starting submission...')
      console.log('👥 CLIENT_SUBMIT: Client data:', clientData)
      console.log('👥 CLIENT_SUBMIT: Editing mode:', !!editingClient)
      
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'
      
      console.log('👥 CLIENT_SUBMIT: API URL:', url)
      console.log('👥 CLIENT_SUBMIT: HTTP Method:', method)
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(clientData)
      })

      console.log('👥 CLIENT_SUBMIT: Response status:', response.status)
      console.log('👥 CLIENT_SUBMIT: Response ok:', response.ok)
      
      const responseData = await response.json()
      console.log('👥 CLIENT_SUBMIT: Response data:', responseData)

      if (response.ok) {
        console.log('👥 CLIENT_SUBMIT: Success! Refreshing list...')
        await fetchClients()
        setShowClientModal(false)
        setEditingClient(null)
        showSnackbar(
          editingClient ? 'Client updated successfully!' : 'Client added successfully!',
          'success'
        )
      } else {
        console.error('👥 CLIENT_SUBMIT: Failed with error:', responseData.error)
        showSnackbar(responseData.error || 'Failed to save client', 'error')
      }
    } catch (error) {
      console.error('👥 CLIENT_SUBMIT: Submit error:', error)
      showSnackbar('Failed to save client', 'error')
    }
  }

  const handleEditClient = (client) => {
    setEditingClient(client)
    setShowClientModal(true)
  }

  const handleViewClientDetails = (client) => {
    setSelectedClient(client)
  }

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
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount) => {
    if (!amount) return 'Not set'
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount)
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.phone && client.phone.includes(searchTerm)) ||
                         client.address?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || 
                         (statusFilter === 'ACTIVE' && client.isActive) ||
                         (statusFilter === 'INACTIVE' && !client.isActive)
    
    return matchesSearch && matchesStatus
  })

  const activeClients = clients.filter(c => c.isActive)
  const inactiveClients = clients.filter(c => !c.isActive)
  const totalDeliveries = clients.reduce((sum, client) => sum + (client._count?.deliveries || 0), 0)

  const statsCards = [
    {
      title: 'Total Clients',
      value: clients.length,
      icon: User,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Clients',
      value: activeClients.length,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Inactive Clients',
      value: inactiveClients.length,
      icon: XCircle,
      color: 'bg-red-500'
    },
    {
      title: 'Total Deliveries',
      value: totalDeliveries,
      icon: Package,
      color: 'bg-purple-500'
    }
  ]

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading clients...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your client relationships and delivery history
            </p>
          </div>
          <button
            onClick={() => setShowClientModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
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
            )
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
                placeholder="Search clients by name, email, phone, or address..."
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

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-600">
                {clients.length === 0 
                  ? "Get started by adding your first client."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {clients.length === 0 && (
                <button 
                  onClick={() => setShowClientModal(true)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Your First Client
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deliveries
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <Building className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {client.name}
                            </div>
                            {client.contactPerson && (
                              <div className="text-sm text-gray-500">
                                Contact: {client.contactPerson}
                              </div>
                            )}
                            {client.businessType && (
                              <div className="text-xs text-gray-400">
                                {client.businessType}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            {client.phone}
                          </div>
                          {client.email && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400 mt-0.5" />
                          <div className="text-sm text-gray-900 max-w-32 truncate">
                            {client.city ? `${client.city}, ${client.country}` : client.country}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(client.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {client._count?.deliveries || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {formatDate(client.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewClientDetails(client)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditClient(client)}
                            className="text-gray-600 hover:text-gray-800"
                            title="Edit Client"
                          >
                            <Edit className="w-4 h-4" />
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

      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Client Details - {selectedClient.name}
              </h2>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Company Name:</span>
                    <p className="text-gray-900">{selectedClient.name}</p>
                  </div>
                  {selectedClient.contactPerson && (
                    <div>
                      <span className="text-gray-600">Contact Person:</span>
                      <p className="text-gray-900">{selectedClient.contactPerson}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="text-gray-900">{selectedClient.phone}</p>
                  </div>
                  {selectedClient.email && (
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="text-gray-900">{selectedClient.email}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="mt-1">
                      {getStatusBadge(selectedClient.isActive)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Joined:</span>
                    <p className="text-gray-900">{formatDate(selectedClient.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Address</h3>
                <p className="text-gray-900">{selectedClient.address}</p>
                {selectedClient.city && (
                  <p className="text-gray-600 mt-1">
                    {selectedClient.city}, {selectedClient.state} {selectedClient.postalCode}
                  </p>
                )}
                <p className="text-gray-600">{selectedClient.country}</p>
              </div>

              {/* Business Info */}
              {(selectedClient.businessType || selectedClient.taxId || selectedClient.paymentTerms || selectedClient.creditLimit) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedClient.businessType && (
                      <div>
                        <span className="text-gray-600">Business Type:</span>
                        <p className="text-gray-900">{selectedClient.businessType}</p>
                      </div>
                    )}
                    {selectedClient.taxId && (
                      <div>
                        <span className="text-gray-600">Tax ID:</span>
                        <p className="text-gray-900">{selectedClient.taxId}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Payment Terms:</span>
                      <p className="text-gray-900">{selectedClient.paymentTerms || 30} days</p>
                    </div>
                    {selectedClient.creditLimit && (
                      <div>
                        <span className="text-gray-600">Credit Limit:</span>
                        <p className="text-gray-900">{formatCurrency(selectedClient.creditLimit)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Delivery Summary</h3>
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-900">
                    {selectedClient._count?.deliveries || 0} total deliveries
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedClient.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
                  <p className="text-gray-700">{selectedClient.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Client Form Modal */}
      <ClientFormModal
        show={showClientModal}
        editingClient={editingClient}
        onSubmit={handleClientSubmit}
        onClose={() => {
          setShowClientModal(false)
          setEditingClient(null)
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
  )
}

export default ClientsPage