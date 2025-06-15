'use client'
import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Search, 
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  Bell,
  Settings,
  User
} from 'lucide-react';

// Import the useWebsites hook
import { useWebsites } from '@/app/hooks/useWebsites';

export default function UptimeDashboard() {
  const [expandedSites, setExpandedSites] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Use the custom hook to get websites data
  const rawWebsites = useWebsites();

  // Function to aggregate ticks into 3-minute windows
  const aggregateTicksIntoWindows = (ticks: { createdAt: Date; status: 'Good' | 'Bad'; latency: number }[]) => {
    if (!ticks || ticks.length === 0) return [];
    
    // Sort ticks by createdAt
    const sortedTicks = [...ticks].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const windows = [];
    const windowSize = 3 * 60 * 1000; // 3 minutes in milliseconds
    const now = Date.now();
    
    // Create 10 windows for the last 30 minutes (10 * 3 minutes = 30 minutes)
    for (let i = 9; i >= 0; i--) {
      const windowEnd = now - (i * windowSize);
      const windowStart = windowEnd - windowSize;
      
      // Find ticks within this window
      const windowTicks = sortedTicks.filter(tick => {
        const tickTime = new Date(tick.createdAt).getTime();
        return tickTime >= windowStart && tickTime < windowEnd;
      });
      
      // Determine window status - if any tick is Bad, window is down
      let windowStatus = 'up';
      let avgLatency = 0;
      
      if (windowTicks.length > 0) {
        const downTicks = windowTicks.filter(tick => tick.status === 'Bad');
        windowStatus = downTicks.length > 0 ? 'down' : 'up';
        avgLatency = windowTicks.reduce((sum, tick) => sum + (tick.latency || 0), 0) / windowTicks.length;
      } else {
        // No data in this window, consider it as unknown/gray
        windowStatus = 'unknown';
      }
      
      windows.push({
        timestamp: new Date(windowEnd),
        status: windowStatus,
        latency: Math.round(avgLatency),
        tickCount: windowTicks.length
      });
    }
    
    return windows;
  };

  // Process websites data
  const websites = rawWebsites.map(website => {
    const aggregatedTicks = aggregateTicksIntoWindows(website.ticks);
    const recentTicks = website.ticks?.slice(-10) || [];
    
    // Calculate current status based on most recent tick
    const latestTick = website.ticks?.[website.ticks.length - 1];
    const currentStatus = latestTick ? (latestTick.status === 'up' ? 'up' : 'down') : 'unknown';
    
    // Calculate average response time from recent ticks
    const avgResponseTime = recentTicks.length > 0 
      ? Math.round(recentTicks.reduce((sum: number, tick: { latency: number }) => sum + (tick.latency || 0), 0) / recentTicks.length)
      : 0;
    
    // Calculate uptime percentage
    const totalTicks = website.ticks?.length || 0;
    const upTicks = website.ticks?.filter((tick: { status: 'Good' | 'Bad' }) => tick.status === 'Good').length || 0;
    const uptimePercentage = totalTicks > 0 ? ((upTicks / totalTicks) * 100).toFixed(1) : '0';
    
    // Get last check time
    const lastCheck = latestTick ? new Date(latestTick.createdAt) : new Date();
    
    return {
      id: website.id,
      name: website.url.replace(/^https?:\/\//, '').split('/')[0], // Extract domain as name
      url: website.url,
      status: currentStatus,
      responseTime: avgResponseTime,
      uptime: parseFloat(uptimePercentage),
      lastCheck: lastCheck,
      uptimeData: aggregatedTicks,
      rawTicks: website.ticks || []
    };
  });

  const toggleExpanded = (siteId: string) => {
    const newExpanded = new Set(expandedSites);
    if (newExpanded.has(siteId)) {
      newExpanded.delete(siteId);
    } else {
      newExpanded.add(siteId);
    }
    setExpandedSites(newExpanded);
  };

  const filteredWebsites = websites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || site.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    return status === 'up' ? 'text-green-500' : 'text-red-500';
  };

  const getStatusBg = (status: string) => {
    if (status === 'up') return 'bg-green-500';
    if (status === 'down') return 'bg-red-500';
    return 'bg-gray-500'; // for unknown status
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getOverallStatus = () => {
    const downSites = websites.filter(site => site.status === 'down').length;
    return downSites === 0 ? 'up' : 'down';
  };

  const overallStatus = getOverallStatus();
  const upSites = websites.filter(site => site.status === 'up').length;
  const downSites = websites.filter(site => site.status === 'down').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold">UptimeX Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Overall Status</p>
                <div className="flex items-center mt-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusBg(overallStatus)} mr-2`}></div>
                  <span className="text-lg font-semibold capitalize">{overallStatus}</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                overallStatus === 'up' ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20'
              }`}>
                {overallStatus === 'up' ? 
                  <CheckCircle className="w-6 h-6 text-green-500" /> : 
                  <XCircle className="w-6 h-6 text-red-500" />
                }
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Sites Up</p>
                <p className="text-2xl font-bold text-green-500 mt-1">{upSites}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Sites Down</p>
                <p className="text-2xl font-bold text-red-500 mt-1">{downSites}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Sites</p>
                <p className="text-2xl font-bold mt-1">{websites.length}</p>
              </div>
              <Globe className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search websites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
            </select>
            
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Site
            </button>
          </div>
        </div>

        {/* Website Cards */}
        <div className="space-y-4">
          {filteredWebsites.map((site) => (
            <div
              key={site.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden transition-all duration-300 hover:border-purple-500/50"
            >
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleExpanded(site.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${getStatusBg(site.status)}`}></div>
                    <div>
                      <h3 className="text-lg font-semibold">{site.name}</h3>
                      <p className="text-gray-400 text-sm">{site.url}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Response Time</p>
                      <p className="font-semibold">{site.responseTime}ms</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Uptime</p>
                      <p className="font-semibold text-green-400">{site.uptime}%</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Last Check</p>
                      <p className="font-semibold">{formatTime(site.lastCheck)}</p>
                    </div>
                    
                    {expandedSites.has(site.id) ? 
                      <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedSites.has(site.id) && (
                <div className="border-t border-gray-700 p-6 bg-gray-900/30">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Last 30 Minutes
                    </h4>
                    
                    {/* Uptime Visualization - 3-minute windows */}
                    <div className="space-y-3">
                      {Array.from({ length: 10 }, (_, rowIndex) => {
                        const windowData = site.uptimeData[rowIndex];
                        return (
                          <div key={rowIndex} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-16">
                              {windowData ? formatTime(new Date(windowData.timestamp.getTime() - 3 * 60000)) : '--:--'}
                            </span>
                            <div className="flex gap-1">
                              <div
                                className={`w-8 h-4 rounded-sm ${
                                  windowData ? getStatusBg(windowData.status) : 'bg-gray-600'
                                } relative group`}
                                title={windowData ? 
                                  `${formatTime(new Date(windowData.timestamp.getTime() - 3 * 60000))} - ${formatTime(windowData.timestamp)} | Status: ${windowData.status} | Avg Latency: ${windowData.latency}ms | Checks: ${windowData.tickCount}` : 
                                  'No data'
                                }
                              >
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {windowData ? 
                                    `${windowData.status.toUpperCase()} | ${windowData.latency}ms | ${windowData.tickCount} checks` : 
                                    'No data'
                                  }
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 ml-2">
                              {windowData ? `${windowData.latency}ms` : 'N/A'}
                            </span>
                          </div>
                        );
                      })}
                      
                      <div className="mt-4 text-xs text-gray-400 flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                          <span>Up</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                          <span>Down</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gray-500 rounded-sm"></div>
                          <span>No Data</span>
                        </div>
                        <span className="ml-4">Each block = 3 minutes</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Avg Response Time</p>
                      <p className="text-xl font-bold">{site.responseTime}ms</p>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Incidents (30min)</p>
                      <p className="text-xl font-bold text-red-400">
                        {site.uptimeData.filter(window => window && window.status === 'down').length}
                      </p>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Success Rate (30min)</p>
                      <p className="text-xl font-bold text-green-400">
                        {site.uptimeData.length > 0 ? 
                          ((site.uptimeData.filter(window => window && window.status === 'up').length / site.uptimeData.filter(window => window).length) * 100).toFixed(1) :
                          0
                        }%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredWebsites.length === 0 && (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No websites found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}