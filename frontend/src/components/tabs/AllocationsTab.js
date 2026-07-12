'use client';

import { Package, ArrowRightLeft } from 'lucide-react';

export default function AllocationsTab({ user }) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Asset Allocations</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage who has what. Assign assets to employees or process returns.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-dashed border-gray-300">
        <ArrowRightLeft className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Allocations Module</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-sm text-center">
          The table and forms for assigning assets to users and processing returns will appear here, matching the backend `/api/v1/allocations` routes.
        </p>
        <button className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          Allocate Asset (Coming Soon)
        </button>
      </div>
    </div>
  );
}
