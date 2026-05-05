import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const ReportsView = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Fetch real fraud reports from the dedicated reports API
      const res = await fetch('/api/reports', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        // Map the real data structure to our component's expected structure
        const realReports = data.data.map(report => ({
          id: report._id,
          type: report.reason,
          stand: report.listing?.standNumber || 'Unknown Stand',
          reporter: report.reporter ? `${report.reporter.firstName} ${report.reporter.lastName}` : (report.reporterAnonymous ? 'Anonymous' : report.reporterEmail || 'Guest'),
          date: report.createdAt,
          status: report.status === 'OPEN' ? 'PENDING' : (report.status === 'UNDER_REVIEW' ? 'UNDER_INVESTIGATION' : report.status),
          description: report.details,
          count: 1
        }));
        setReports(realReports);
      }
    } catch (error) {
      console.error('Failed to load real reports:', error);
      toast.error('Could not load live reports. Showing offline data.');
      // Keep mock data as fallback only
      setReports([
        {
          id: 'mock-1',
          type: 'DUPLICATE_LISTING',
          stand: 'Stand 2456',
          reporter: 'John Doe',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'UNDER_INVESTIGATION',
          description: 'This stand appears to be listed multiple times'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resolveReport = async (reportId, resolution) => {
    try {
      toast.success(`Report marked as ${resolution}`);
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'RESOLVED' } : r));
    } catch (error) {
      toast.error('Failed to resolve report');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_INVESTIGATION': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'FAKE_DOCUMENTS': return 'text-red-600';
      case 'OWNERSHIP_DISPUTE': return 'text-orange-600';
      case 'DUPLICATE_LISTING': return 'text-blue-600';
      case 'SUSPICIOUS_ACTIVITY': return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = report.stand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reporter?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <FileText className="h-8 w-8" />
            Fraud Reports & Flags
          </h1>
          <p className="text-gray-600">Monitor and manage reported suspicious activities</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by stand or reporter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Reports</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_INVESTIGATION">Under Investigation</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.stand}</h3>
                  <p className={`text-sm font-medium ${getTypeColor(report.type)}`}>
                    {report.type?.replace(/_/g, ' ')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                  {report.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <p className="text-gray-700 mb-3">{report.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Reporter</p>
                  <p className="font-medium text-gray-900">{report.reporter}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reported Date</p>
                  <p className="font-medium text-gray-900">
                    {report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Count</p>
                  <p className="font-medium text-gray-900">{report.count || 1}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-medium text-gray-900">{report._id || 'User Report'}</p>
                </div>
              </div>

              {report.status === 'PENDING' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => resolveReport(report.id, 'VALID')}
                    className="flex items-center gap-1 px-4 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors font-medium text-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark Valid
                  </button>
                  <button
                    onClick={() => resolveReport(report.id, 'FALSE_ALARM')}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors font-medium text-sm"
                  >
                    <Clock className="h-4 w-4" />
                    False Alarm
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No reports matching your criteria
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Reports</p>
            <p className="text-2xl font-bold text-blue-600">{reports.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{reports.filter(r => r.status === 'PENDING').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Under Review</p>
            <p className="text-2xl font-bold text-blue-600">{reports.filter(r => r.status === 'UNDER_INVESTIGATION').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'RESOLVED').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
