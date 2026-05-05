import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, FileText, AlertTriangle, TrendingUp, Shield, Eye, Settings } from 'lucide-react';
import { landService } from '../services/landService';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLands: 0,
    pendingVerifications: 0,
    fraudReports: 0,
    monthlyTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [analyticsRes, adminStatsRes] = await Promise.all([
          landService.getLandAnalytics(),
          landService.getAdminStats()
        ]);
        
        const analyticsData = analyticsRes.data;
        const adminStats = adminStatsRes.stats;

        setStats({
          totalUsers: adminStats.totalUsers || 0,
          totalLands: analyticsData.totalLands || 0,
          pendingVerifications: analyticsData.pendingVerifications || 0,
          fraudReports: analyticsData.fraudFlags?.reduce((acc, flag) => acc + flag.count, 0) || 0,
          monthlyTransactions: analyticsData.recentListingsCount || 0
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage and monitor the LandSolutions platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Lands</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalLands.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Shield className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingVerifications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fraud Reports</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.fraudReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.monthlyTransactions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/verify-land')}
                  className="w-full flex items-center justify-between p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium text-gray-900">Review Verifications</span>
                  </div>
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {stats.pendingVerifications}
                  </span>
                </button>

                <button 
                  onClick={() => navigate('/lands')}
                  className="w-full flex items-center justify-between p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                    <span className="font-medium text-gray-900">Investigate Fraud</span>
                  </div>
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                    {stats.fraudReports}
                  </span>
                </button>

                <button
                  onClick={() => navigate('/admin/manage-users')}
                  className="w-full flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Users className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="font-medium text-gray-900">Manage Users</span>
                </button>

                <button
                  onClick={() => navigate('/admin/reports')}
                  className="w-full flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FileText className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="font-medium text-gray-900">View Reports</span>
                </button>

                <button
                  onClick={() => navigate('/admin/settings')}
                  className="w-full flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="font-medium text-gray-900">System Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {/* Activity Items */}
                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Land verification completed
                    </p>
                    <p className="text-sm text-gray-600">
                      Stand 4523A in Borrowdale has been verified
                    </p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      New fraud report submitted
                    </p>
                    <p className="text-sm text-gray-600">
                      Suspicious activity reported for Stand 7891B
                    </p>
                    <p className="text-xs text-gray-500 mt-1">4 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      New user registration
                    </p>
                    <p className="text-sm text-gray-600">
                      John Doe registered as a buyer
                    </p>
                    <p className="text-xs text-gray-500 mt-1">6 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      New land listing created
                    </p>
                    <p className="text-sm text-gray-600">
                      Stand 3214C listed in Mount Pleasant
                    </p>
                    <p className="text-xs text-gray-500 mt-1">8 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Eye className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Verification pending
                    </p>
                    <p className="text-sm text-gray-600">
                      3 new lands awaiting verification
                    </p>
                    <p className="text-xs text-gray-500 mt-1">12 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Transaction Trends</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart placeholder</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Verification Status</h2>
              <Shield className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart placeholder</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
