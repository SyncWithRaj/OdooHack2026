'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Button from '@/components/shared/Button';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import AssetTagChip from '@/components/shared/AssetTagChip';
import { ToastProvider, useToast } from '@/components/shared/Toast';
import useAuth from '@/utils/useAuth';
import { api } from '@/utils/api';
import { FileDown, Printer, TrendingUp, Hammer, Layers, CalendarRange } from 'lucide-react';

function ReportsContent() {
  const { user, loading, logout } = useAuth();
  const { showToast } = useToast();

  const [heatmap, setHeatmap] = useState([]);
  const [maintRequests, setMaintRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allocations, setAllocations] = useState([]);

  const loadReportData = async () => {
    try {
      const heatData = await api.get('/analytics/heatmaps');
      setHeatmap(heatData);

      const maintData = await api.get('/maintenance');
      setMaintRequests(maintData);

      const assetList = await api.get('/assets');
      setAssets(assetList);

      const deptList = await api.get('/departments');
      setDepartments(deptList);

      const allocList = await api.get('/allocations');
      setAllocations(allocList);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadReportData();
    }
  }, [user]);

  // Compute stats
  const activeMaint = maintRequests.filter(m => m.status !== 'resolved' && m.status !== 'rejected');
  const retiredAssets = assets.filter(a => a.status === 'retired');

  // Compute department allocation summary
  const deptSummary = departments.map(d => {
    const count = allocations.filter(a => a.status === 'active' && a.assignedToUser?.departmentId === d.id).length;
    return {
      name: d.name,
      code: d.code,
      count
    };
  });

  const handleExportCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Tag,Name,Category,Condition,Status,Location\n';
      
      assets.forEach(a => {
        csvContent += `"${a.assetTag}","${a.name}","${a.category?.name || 'N/A'}","${a.condition || 'New'}","${a.status}","${a.location || 'HQ'}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `AssetFlow_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('CSV export downloaded successfully.', 'success');
    } catch (err) {
      showToast('Failed to export CSV', 'error');
    }
  };

  const handlePrintPDF = () => {
    window.print();
    showToast('Sent to system printer.', 'success');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface font-mono text-xs text-steel">SYSTEM LOADING...</div>;
  }

  const maintColumns = [
    { key: 'tag', label: 'Tag', render: (_, row) => <AssetTagChip tag={row.asset?.assetTag} /> },
    { key: 'assetName', label: 'Asset Name', render: (_, row) => row.asset?.name },
    { key: 'technicianName', label: 'Technician', render: (val) => val || 'Not Assigned' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge domain="maintenance" status={val} /> },
  ];

  return (
    <Sidebar user={user} onLogout={logout}>
      <div className="flex flex-col gap-8 print:p-0">
        
        {/* Header Block */}
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-ink">REPORTS & ANALYTICS</h1>
            <p className="text-steel text-sm mt-1">Export organizational datasets, analyze utilization cycles, and view status matrices.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExportCSV} className="flex items-center gap-1.5">
              <FileDown className="w-4 h-4" /> Export CSV
            </Button>
            <Button variant="secondary" onClick={handlePrintPDF} className="flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Print / PDF
            </Button>
          </div>
        </div>

        {/* Print Only Header */}
        <div className="hidden print:block border-b border-ink pb-4 mb-6">
          <h1 className="text-2xl font-bold font-display text-ink tracking-wider">ASSETFLOW ENTERPRISE REPORT</h1>
          <p className="text-xs font-mono text-steel">Report Generated on: {new Date().toLocaleString()}</p>
        </div>

        {/* Analytical Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-steel uppercase tracking-wider">Active Maintenance Rate</span>
              <Hammer className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-3xl font-bold font-display text-ink mt-2">
              {assets.length ? ((activeMaint.length / assets.length) * 100).toFixed(1) : 0}%
            </h2>
            <span className="text-[11px] text-steel font-mono">{activeMaint.length} active work orders in pipeline</span>
          </div>

          <div className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-steel uppercase tracking-wider">Utilization Rate</span>
              <TrendingUp className="w-5 h-5 text-status-available" />
            </div>
            <h2 className="text-3xl font-bold font-display text-ink mt-2">
              {assets.length ? ((allocations.filter(a => a.status === 'active').length / assets.length) * 100).toFixed(1) : 0}%
            </h2>
            <span className="text-[11px] text-steel font-mono">Assigned assets out of total directory</span>
          </div>

          <div className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-steel uppercase tracking-wider">Retirement Queue</span>
              <Layers className="w-5 h-5 text-status-disposed" />
            </div>
            <h2 className="text-3xl font-bold font-display text-ink mt-2">
              {retiredAssets.length}
            </h2>
            <span className="text-[11px] text-steel font-mono">Assets flagged retired or ready for disposal</span>
          </div>
        </div>

        {/* Details Grid: Heatmap + Department summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Booking Heatmap */}
          <div className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm">
            <h3 className="font-bold text-sm text-ink uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <CalendarRange className="w-4 h-4 text-accent" /> Booking Heatmap (Weekly load)
            </h3>
            
            <div className="space-y-4">
              {heatmap.map((day, idx) => (
                <div key={idx} className="flex items-center gap-4 text-xs">
                  <span className="w-20 font-semibold text-steel font-mono">{day.name}</span>
                  <div className="flex-1 flex gap-1 h-6">
                    {/* Alpha Room weight bar */}
                    <div
                      className="bg-accent/40 rounded-l-[4px] flex items-center px-2 font-mono text-[9px] font-semibold text-accent-ink"
                      style={{ flexGrow: day['Room Alpha'] || 1 }}
                    >
                      Alpha: {day['Room Alpha']}
                    </div>
                    {/* Lab B weight bar */}
                    <div
                      className="bg-status-allocated/30 rounded-r-[4px] flex items-center px-2 font-mono text-[9px] font-semibold text-status-allocated"
                      style={{ flexGrow: day['Lab B'] || 1 }}
                    >
                      Lab B: {day['Lab B']}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Allocation Summary */}
          <div className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm">
            <h3 className="font-bold text-sm text-ink uppercase tracking-wider mb-4">
              Department Active Allocations Summary
            </h3>
            
            <div className="divide-y divide-hairline">
              {deptSummary.map((dept, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-ink">{dept.name}</span>
                    <span className="text-[10px] font-mono text-steel uppercase tracking-wider block mt-0.5">{dept.code}</span>
                  </div>
                  <span className="font-mono bg-surface border border-hairline px-3 py-1 rounded-[4px] font-bold text-ink">
                    {dept.count} items
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Maintenance / Retirement Lists */}
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-sm text-ink uppercase tracking-wider">
            Active Maintenance & Repair Queue
          </h3>
          <DataTable
            columns={maintColumns}
            data={activeMaint}
            pageSize={5}
          />
        </div>

      </div>
    </Sidebar>
  );
}

export default function ReportsPage() {
  return (
    <ToastProvider>
      <ReportsContent />
    </ToastProvider>
  );
}
