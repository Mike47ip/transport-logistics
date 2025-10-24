// app\components\Deliveries\StatusFilter.jsxr.jsx

'use client'

import { Filter } from 'lucide-react'

export default function StatusFilter({ 
  statusFilter, 
  setStatusFilter, 
  priorityFilter, 
  setPriorityFilter 
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
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
  )
}