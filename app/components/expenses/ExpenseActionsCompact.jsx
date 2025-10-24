'use client'

import { useState } from 'react'
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react'

export function ExpenseActionsCompact({ expense, onView, onEdit, onDelete }) {
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-1 hover:bg-gray-100 rounded-full"
      >
        <MoreHorizontal className="w-4 h-4 text-gray-400" />
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1">
              <button
                onClick={() => {
                  onView(expense)
                  setShowDropdown(false)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button
                onClick={() => {
                  onEdit(expense)
                  setShowDropdown(false)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <Edit className="w-4 h-4" />
                Edit Expense
              </button>
              <button
                onClick={() => {
                  onDelete(expense)
                  setShowDropdown(false)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}