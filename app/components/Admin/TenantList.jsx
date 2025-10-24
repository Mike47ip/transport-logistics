import React from 'react';
import {
  Building,
  Edit,
  CheckCircle,
  XCircle,
  Globe,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const TenantList = ({ 
  tenants, 
  onEditTenant, 
  onToggleTenantStatus, 
  searchTerm 
}) => {
  const getStatusBadge = (isActive) => (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {isActive ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tenant.domain && tenant.domain.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (filteredTenants.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
        <p className="text-gray-600">Try adjusting your search or create a new tenant.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTenants.map((tenant) => (
        <div key={tenant.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <Building className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{tenant.name}</h3>
                  <p className="text-sm text-gray-600">{tenant.slug}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(tenant.isActive)}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {tenant.domain && (
                <div className="flex items-center text-sm text-gray-600">
                  <Globe className="w-4 h-4 mr-2" />
                  {tenant.domain}
                </div>
              )}
              
              {tenant.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {tenant.email}
                </div>
              )}

              {tenant.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {tenant.phone}
                </div>
              )}

              {tenant.address && (
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{tenant.address}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{tenant._count?.users || 0}</p>
                <p className="text-xs text-gray-600">Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{tenant._count?.vehicles || 0}</p>
                <p className="text-xs text-gray-600">Vehicles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{tenant._count?.deliveries || 0}</p>
                <p className="text-xs text-gray-600">Deliveries</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{tenant._count?.clients || 0}</p>
                <p className="text-xs text-gray-600">Clients</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onEditTenant(tenant)}
                className="flex-1 bg-blue-50 text-blue-700 py-2 px-3 rounded hover:bg-blue-100 flex items-center justify-center"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => onToggleTenantStatus(tenant.id, tenant.isActive)}
                className={`flex-1 py-2 px-3 rounded flex items-center justify-center ${
                  tenant.isActive 
                    ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {tenant.isActive ? (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Disable
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Enable
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TenantList;