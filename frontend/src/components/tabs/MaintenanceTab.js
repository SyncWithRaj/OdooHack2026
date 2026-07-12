'use client';

import { Wrench } from 'lucide-react';

export default function MaintenanceTab({ user }) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Maintenance Tickets</h2>
        <p className="mt-1 text-sm text-gray-500">
          Request repairs, track maintenance status, and resolve issues.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-dashed border-gray-300">
        <Wrench className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Maintenance Module</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-sm text-center">
          The table of open maintenance tickets will appear here, matching the backend `/api/v1/maintenance` routes.
        </p>
        <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          Request Maintenance (Coming Soon)
        </button>
      </div>
    </div>
  );
}
