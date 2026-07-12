'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Package, ArrowRightLeft, Wrench, CalendarCheck, AlertTriangle, Plus, Clipboard, UserMinus, TrendingUp } from 'lucide-react';
import KPICard from '../shared/KPICard';
import AssetTagChip from '../shared/AssetTagChip';
import StatusBadge from '../shared/StatusBadge';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import FormField from '../shared/FormField';
import toast from 'react-hot-toast';
import DashboardCalendar from '../shared/DashboardCalendar';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  Line, Area
} from 'recharts';

export default function OverviewTab({ user, setActiveTab }) {
  const [kpis, setKpis] = useState(null);
  const [overdueAllocations, setOverdueAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive Dashboard Data
  const [allAllocations, setAllAllocations] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [allMaintenance, setAllMaintenance] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // Graph Selector State
  const [selectedGraphs, setSelectedGraphs] = useState(['allocations', 'bookings', 'maintenance']);

  // Maintenance Request Modal State
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceAssetId, setMaintenanceAssetId] = useState('');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenancePriority, setMaintenancePriority] = useState('medium');
  const [submittingMaintenance, setSubmittingMaintenance] = useState(false);

  // Return Asset Modal State (for admin/manager returning overdue assets)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch KPIs
      const kpiRes = await api.get('/analytics/kpis');
      setKpis(kpiRes.data.data.kpis);

      // Fetch active allocations to check for overdue returns & calendar
      const allocRes = await api.get('/allocations');
      const allAllocData = allocRes.data.data.allocations || [];
      setAllAllocations(allAllocData);

      const now = new Date();
      const activeAllocs = allAllocData.filter(a => a.status === 'active');
      const overdue = activeAllocs.filter(a => a.expectedReturnDate && new Date(a.expectedReturnDate) < now);
      setOverdueAllocations(overdue);

      // Fetch bookings & maintenance for calendar
      const bookingsRes = await api.get('/bookings');
      setAllBookings(bookingsRes.data.data.bookings || []);

      const maintRes = await api.get('/maintenance');
      setAllMaintenance(maintRes.data.data.requests || []);

      // Fetch assets list for maintenance select dropdown
      const assetsRes = await api.get('/assets');
      setAssets(assetsRes.data.data.assets || []);

      // Fetch Analytics Data for charts
      if (['admin', 'asset_manager'].includes(user?.role)) {
        const [utilRes, maintFreqRes, deptRes] = await Promise.all([
          api.get('/analytics/utilization'),
          api.get('/analytics/maintenance-frequency'),
          api.get('/analytics/department-summary')
        ]);
  
        setAnalyticsData({
          utilization: utilRes.data.data.utilization || [],
          maintenanceFreq: maintFreqRes.data.data.frequency || [],
          deptSummary: deptRes.data.data.summary || []
        });
      }

    } catch (err) {
      console.error('Failed to load dashboard data', err);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    if (!maintenanceAssetId) {
      toast.error('Please select an asset');
      return;
    }
    try {
      setSubmittingMaintenance(true);
      await api.post('/maintenance', {
        assetId: parseInt(maintenanceAssetId),
        description: maintenanceDescription,
        priority: maintenancePriority
      });
      toast.success('Maintenance ticket raised successfully');
      setIsMaintenanceModalOpen(false);
      setMaintenanceAssetId('');
      setMaintenanceDescription('');
      setMaintenancePriority('medium');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit maintenance request');
    } finally {
      setSubmittingMaintenance(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAllocation) return;
    try {
      setSubmittingReturn(true);
      await api.post(`/allocations/${selectedAllocation.id}/return`, {
        returnConditionNotes: returnNotes
      });
      toast.success('Asset returned successfully');
      setIsReturnModalOpen(false);
      setSelectedAllocation(null);
      setReturnNotes('');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process return');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const getOverdueDays = (dateStr) => {
    const diffTime = Math.abs(new Date() - new Date(dateStr));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleGraphToggle = (graphId) => {
    setSelectedGraphs(prev => {
      if (prev.includes(graphId)) {
        return prev.filter(id => id !== graphId);
      }
      return [...prev, graphId];
    });
  };

  // Build a single unified dataset for all assets to plot on the SAME axis
  const unifiedDataMap = {};
  
  if (analyticsData?.utilization) {
    analyticsData.utilization.forEach(a => {
      unifiedDataMap[a.assetTag] = {
        name: a.name,
        tag: a.assetTag,
        allocations: a._count.allocations,
        bookings: a._count.bookings,
        maintenance: 0,
        total: a._count.allocations + a._count.bookings
      };
    });
  }

  if (analyticsData?.maintenanceFreq) {
    analyticsData.maintenanceFreq.forEach(cat => {
      cat.assets.forEach(asset => {
        if (!unifiedDataMap[asset.assetTag]) {
          unifiedDataMap[asset.assetTag] = {
            name: asset.name,
            tag: asset.assetTag,
            allocations: 0,
            bookings: 0,
            maintenance: 0,
            total: 0
          };
        }
        unifiedDataMap[asset.assetTag].maintenance = asset._count.maintenanceRequests;
      });
    });
  }

  const unifiedChartData = Object.values(unifiedDataMap)
    .sort((a, b) => b.total + b.maintenance - (a.total + a.maintenance))
    .slice(0, 12); // Top 12 most active assets

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-hairline rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-hairline rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-hairline rounded-lg w-full" />
      </div>
    );
  }

  // Define KPI Cards based on user role
  const isManager = ['admin', 'asset_manager'].includes(user.role);
  const isDeptHead = user.role === 'department_head';

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-hairline pb-6">
        <h2 className="text-sm font-bold font-display text-steel uppercase tracking-wider">Dashboard Overview</h2>
        <h1 className="text-4xl font-extrabold text-ink tracking-tight">
          Welcome back, <span className="text-accent">{user.name}</span>!
        </h1>
        <p className="text-sm text-steel">
          You are currently in the <span className="capitalize font-semibold text-ink bg-surface px-2 py-0.5 rounded border border-hairline">{user.role.replace('_', ' ')}</span> view.
        </p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isManager && (
          <>
            <KPICard title="Available Assets" value={kpis?.assetsAvailable} icon={Package} trend={{ label: 'Instantly Bookable/Allocatable', type: 'neutral' }} />
            <KPICard title="Allocated Assets" value={kpis?.assetsAllocated} icon={ArrowRightLeft} trend={{ label: 'Currently in use', type: 'neutral' }} />
            <KPICard title="Maintenance Today" value={kpis?.maintenanceToday} icon={Wrench} trend={{ label: 'Active repair tickets', type: 'neutral' }} />
            <KPICard title="Active Bookings" value={kpis?.activeBookings} icon={CalendarCheck} trend={{ label: 'Current shared reservations', type: 'neutral' }} />
          </>
        )}

        {isDeptHead && (
          <>
            <KPICard title="Total Department Assets" value={(kpis?.assetsAvailable || 0) + (kpis?.assetsAllocated || 0)} icon={Package} />
            <KPICard title="Department Allocated" value={kpis?.assetsAllocated} icon={ArrowRightLeft} />
            <KPICard title="Active Bookings" value={kpis?.activeBookings} icon={CalendarCheck} />
            <KPICard title="Overdue Returns" value={kpis?.overdueReturns} icon={AlertTriangle} className={kpis?.overdueReturns > 0 ? 'border-status-lost' : ''} />
          </>
        )}

        {user.role === 'employee' && (
          <>
            <KPICard title="My Assigned Assets" value={kpis?.assetsAllocated} icon={Package} />
            <KPICard title="My Active Bookings" value={kpis?.activeBookings} icon={CalendarCheck} />
            <KPICard title="My Maintenance Tickets" value={kpis?.maintenanceToday} icon={Wrench} />
            <KPICard title="Overdue Returns" value={kpis?.overdueReturns} icon={AlertTriangle} className={kpis?.overdueReturns > 0 ? 'border-status-lost' : ''} />
          </>
        )}
      </div>

      {/* Overdue Returns Panel - Visually Separated */}
      {overdueAllocations.length > 0 && (
        <div className="bg-status-lost/5 border border-status-lost/30 rounded-lg p-6 flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-status-lost">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-display">Attention: Overdue Asset Returns</h3>
          </div>
          <p className="text-xs text-steel -mt-2">
            The following assets have exceeded their expected return date. Please return or re-allocate them immediately.
          </p>

          <div className="bg-white border border-hairline rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-hairline">
                <thead className="bg-surface">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-steel">Asset</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-steel">Assigned To</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-steel">Due Date</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-steel">Overdue By</th>
                    <th scope="col" className="relative px-6 py-3.5"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline bg-white">
                  {overdueAllocations.map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-status-lost/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <AssetTagChip tag={alloc.asset.assetTag} />
                          <span className="text-sm font-semibold text-ink">{alloc.asset.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-steel">
                        {alloc.assignedToUser ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-ink">{alloc.assignedToUser.name}</span>
                            <span className="text-xs text-steel/60">{alloc.assignedToUser.email}</span>
                          </div>
                        ) : alloc.assignedToDept ? (
                          <span className="font-semibold text-ink">Dept: {alloc.assignedToDept.name}</span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-steel font-mono">
                        {new Date(alloc.expectedReturnDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-status-lost/10 text-status-lost">
                          {getOverdueDays(alloc.expectedReturnDate)} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                        {isManager ? (
                          <Button 
                            variant="secondary"
                            onClick={() => {
                              setSelectedAllocation(alloc);
                              setIsReturnModalOpen(true);
                            }}
                            icon={UserMinus}
                            className="!py-1"
                          >
                            Return Asset
                          </Button>
                        ) : (
                          <span className="text-xs text-steel">Contact Manager</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Calendar and Charts Interactive Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left Column: Interactive Custom Calendar */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-ink">
            <CalendarCheck className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold font-display uppercase tracking-wider">Operational Calendar</h3>
          </div>
          <p className="text-xs text-steel -mt-3 mb-2">View upcoming returns, bookings, and repair timelines.</p>
          <div className="flex-1 min-h-[500px]">
            <DashboardCalendar 
              allocations={allAllocations}
              bookings={allBookings}
              maintenance={allMaintenance}
              onEventClick={(tab) => setActiveTab(tab)}
            />
          </div>
        </div>

        {/* Right Column: Interactive Multi-Select Charts */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-hairline pb-2">
            <div className="flex items-center gap-2 text-ink">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-bold font-display uppercase tracking-wider">Unified Asset Analytics</h3>
            </div>
          </div>
          
          <div className="bg-white border border-hairline p-5 rounded-lg shadow-sm flex flex-col gap-6 flex-1 min-h-[500px]">
            {/* Multi-Select Graph Toggle - Now beautiful pills */}
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => handleGraphToggle('allocations')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                  selectedGraphs.includes('allocations') 
                    ? 'bg-accent/10 border-accent/30 text-accent-ink' 
                    : 'bg-surface border-hairline text-steel hover:bg-surface/80'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${selectedGraphs.includes('allocations') ? 'bg-accent' : 'bg-steel/40'}`} />
                Allocations
              </button>

              <button 
                onClick={() => handleGraphToggle('bookings')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                  selectedGraphs.includes('bookings') 
                    ? 'bg-status-available/10 border-status-available/30 text-status-available' 
                    : 'bg-surface border-hairline text-steel hover:bg-surface/80'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${selectedGraphs.includes('bookings') ? 'bg-status-available' : 'bg-steel/40'}`} />
                Bookings
              </button>

              <button 
                onClick={() => handleGraphToggle('maintenance')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                  selectedGraphs.includes('maintenance') 
                    ? 'bg-status-lost/10 border-status-lost/30 text-status-lost' 
                    : 'bg-surface border-hairline text-steel hover:bg-surface/80'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${selectedGraphs.includes('maintenance') ? 'bg-status-lost' : 'bg-steel/40'}`} />
                Repair Tickets
              </button>
            </div>

            <div className="flex-1 w-full min-h-[400px]">
              {selectedGraphs.length === 0 ? (
                <div className="flex items-center justify-center h-full bg-surface/50 rounded-lg border border-dashed border-hairline">
                  <span className="text-sm text-steel font-semibold">Select at least one metric to plot</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={unifiedChartData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    
                    {/* Primary X Axis: Asset Tags */}
                    <XAxis 
                      dataKey="tag" 
                      tick={{fontSize: 10, fill: '#64748B', fontWeight: 600}} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    
                    {/* Primary Y Axis for interactions (Bars) */}
                    <YAxis 
                      yAxisId="left" 
                      tick={{fontSize: 10, fill: '#64748B'}} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    
                    {/* Secondary Y Axis for maintenance (Line) */}
                    {selectedGraphs.includes('maintenance') && (
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tick={{fontSize: 10, fill: '#EF4444'}} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                    )}

                    <RechartsTooltip 
                      cursor={{ fill: '#F1F5F9', opacity: 0.5 }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0F172A', marginBottom: '4px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 600, padding: '2px 0' }}
                    />
                    
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} 
                    />

                    {selectedGraphs.includes('allocations') && (
                      <Bar yAxisId="left" dataKey="allocations" name="Total Allocations" fill="#0066FF" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    )}
                    
                    {selectedGraphs.includes('bookings') && (
                      <Bar yAxisId="left" dataKey="bookings" name="Total Bookings" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    )}
                    
                    {selectedGraphs.includes('maintenance') && (
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="maintenance" 
                        name="Repair Tickets" 
                        stroke="#EF4444" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 6, strokeWidth: 0 }} 
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-steel">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isManager && (
            <button
              onClick={() => setActiveTab('assets')}
              className="flex items-center gap-4 p-4 border border-hairline rounded-lg text-left hover:border-accent hover:bg-surface/50 transition-all duration-200 group"
            >
              <div className="p-3 rounded bg-accent/10 border border-accent/20 text-accent group-hover:bg-accent group-hover:text-accent-ink transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink uppercase tracking-wider">Register Asset</p>
                <p className="text-xs text-steel">Add new hardware/software to database</p>
              </div>
            </button>
          )}

          <button
            onClick={() => setActiveTab('bookings')}
            className="flex items-center gap-4 p-4 border border-hairline rounded-lg text-left hover:border-accent hover:bg-surface/50 transition-all duration-200 group"
          >
            <div className="p-3 rounded bg-accent/10 border border-accent/20 text-accent group-hover:bg-accent group-hover:text-accent-ink transition-colors">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink uppercase tracking-wider">Book Resource</p>
              <p className="text-xs text-steel">Reserve workspaces, rooms, or vehicles</p>
            </div>
          </button>

          <button
            onClick={() => setIsMaintenanceModalOpen(true)}
            className="flex items-center gap-4 p-4 border border-hairline rounded-lg text-left hover:border-accent hover:bg-surface/50 transition-all duration-200 group"
          >
            <div className="p-3 rounded bg-accent/10 border border-accent/20 text-accent group-hover:bg-accent group-hover:text-accent-ink transition-colors">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink uppercase tracking-wider">Raise Maintenance</p>
              <p className="text-xs text-steel">Report a broken asset or request upkeep</p>
            </div>
          </button>
        </div>
      </div>

      {/* Maintenance request Modal */}
      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        title="Raise Maintenance Request"
      >
        <form onSubmit={handleMaintenanceSubmit} className="flex flex-col gap-4">
          <FormField
            label="Asset to Repair"
            id="maintenance-asset"
            type="select"
            required
            value={maintenanceAssetId}
            onChange={(e) => setMaintenanceAssetId(e.target.value)}
          >
            <option value="">Select an asset...</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.assetTag}) - Status: {asset.status}
              </option>
            ))}
          </FormField>

          <FormField
            label="Priority Level"
            id="maintenance-priority"
            type="select"
            required
            value={maintenancePriority}
            onChange={(e) => setMaintenancePriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </FormField>

          <FormField
            label="Issue Description"
            id="maintenance-desc"
            type="textarea"
            required
            placeholder="Please detail the issue with the asset..."
            value={maintenanceDescription}
            onChange={(e) => setMaintenanceDescription(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button variant="ghost" onClick={() => setIsMaintenanceModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submittingMaintenance}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Return Asset Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setSelectedAllocation(null);
        }}
        title="Return Allocated Asset"
      >
        {selectedAllocation && (
          <form onSubmit={handleReturnSubmit} className="flex flex-col gap-4">
            <div className="p-4 bg-surface border border-hairline rounded flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-steel">Asset Details</span>
              <div className="flex items-center gap-2">
                <AssetTagChip tag={selectedAllocation.asset.assetTag} />
                <span className="text-sm font-bold text-ink">{selectedAllocation.asset.name}</span>
              </div>
              <span className="text-xs text-steel mt-2">
                Currently allocated to:{' '}
                <span className="font-semibold text-ink">
                  {selectedAllocation.assignedToUser?.name || selectedAllocation.assignedToDept?.name}
                </span>
              </span>
            </div>

            <FormField
              label="Return Condition Notes"
              id="return-notes"
              type="textarea"
              placeholder="e.g. Returned in perfect condition, normal wear and tear..."
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsReturnModalOpen(false);
                  setSelectedAllocation(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submittingReturn}>Process Return</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
