import React, { useState, useEffect } from 'react';
import {
  Building,
  Users,
  Plus,
  Search,
  UserPlus
} from 'lucide-react';
import TenantList from './TenantList';
import UserList from './UserList';
import TenantFormModal from './TenantFormModal';
import UserFormModal from './UserFormModal';

const AdminMainContainer = () => {
  const [activeTab, setActiveTab] = useState('tenants');
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('');

  const [tenantFormData, setTenantFormData] = useState({
    name: '',
    domain: '',
    email: '',
    phone: '',
    address: ''
  });

  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'ADMIN',
    tenantId: '',
    isActive: true
  });

  useEffect(() => {
    if (activeTab === 'tenants') {
      fetchTenants();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tenants', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = selectedTenantFilter ? `?tenantId=${selectedTenantFilter}` : '';
      const response = await fetch(`/api/admin/users${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSubmit = async () => {
    try {
      const url = editingTenant ? `/api/admin/tenants/${editingTenant.id}` : '/api/admin/tenants';
      const method = editingTenant ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(tenantFormData)
      });

      if (response.ok) {
        fetchTenants();
        resetTenantForm();
      }
    } catch (error) {
      console.error('Error saving tenant:', error);
    }
  };

  const handleUserSubmit = async () => {
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userFormData)
      });

      if (response.ok) {
        fetchUsers();
        resetUserForm();
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const resetTenantForm = () => {
    setTenantFormData({
      name: '',
      domain: '',
      email: '',
      phone: '',
      address: ''
    });
    setShowTenantModal(false);
    setEditingTenant(null);
  };

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'ADMIN',
      tenantId: '',
      isActive: true
    });
    setShowUserModal(false);
    setEditingUser(null);
  };

  const handleEditTenant = (tenant) => {
    setEditingTenant(tenant);
    setTenantFormData({
      name: tenant.name,
      domain: tenant.domain || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      address: tenant.address || ''
    });
    setShowTenantModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive
    });
    setShowUserModal(true);
  };

  const toggleTenantStatus = async (tenantId, currentStatus) => {
    try {
      await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchTenants();
    } catch (error) {
      console.error('Error toggling tenant status:', error);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
              <p className="text-gray-600">Manage tenants and users across the platform</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowTenantModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
              >
                <Building className="w-4 h-4 mr-2" />
                New Tenant
              </button>
              <button
                onClick={() => setShowUserModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                New User
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tenants')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tenants'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building className="w-4 h-4 inline mr-2" />
                Tenants ({tenants.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Users ({users.length})
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={activeTab === 'tenants' ? 'Search tenants...' : 'Search users...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {activeTab === 'users' && (
            <select
              value={selectedTenantFilter}
              onChange={(e) => {
                setSelectedTenantFilter(e.target.value);
                setTimeout(() => fetchUsers(), 100);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Tenants</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Content */}
        {activeTab === 'tenants' ? (
          <TenantList
            tenants={tenants}
            onEditTenant={handleEditTenant}
            onToggleTenantStatus={toggleTenantStatus}
            searchTerm={searchTerm}
          />
        ) : (
          <UserList
            users={users}
            onEditUser={handleEditUser}
            onToggleUserStatus={toggleUserStatus}
            searchTerm={searchTerm}
          />
        )}
      </div>

      {/* Modals */}
      <TenantFormModal
        show={showTenantModal}
        editingTenant={editingTenant}
        formData={tenantFormData}
        onFormDataChange={setTenantFormData}
        onSubmit={handleTenantSubmit}
        onClose={resetTenantForm}
      />

      <UserFormModal
        show={showUserModal}
        editingUser={editingUser}
        formData={userFormData}
        onFormDataChange={setUserFormData}
        onSubmit={handleUserSubmit}
        onClose={resetUserForm}
        tenants={tenants}
      />
    </div>
  );
};

export default AdminMainContainer;