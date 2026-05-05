import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Shield, CheckCircle, Clock, XCircle, FileText, Search, Filter, UserCheck, Map } from 'lucide-react';
import { landService } from '../services/landService';
import toast from 'react-hot-toast';

const VerificationCenter = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [lands, setLands] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [viewMode, setViewMode] = useState('LAND'); // 'LAND' or 'KYC'
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [stats, setStats] = useState({
    totalLands: 0,
    verifiedLands: 0,
    pendingKYC: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Land listings — all statuses for admins/officers
      const landRes = await fetch('/api/land?limit=100', { credentials: 'include' });
      const landData = await landRes.json();

      // Pending KYC users
      const userRes = await fetch('/api/user/kyc/pending', { credentials: 'include' });
      const userData = await userRes.json();

      const allLands = landData.data || [];
      const users = userData.data || [];

      setLands(allLands);
      setPendingUsers(users);

      setStats({
        totalLands: allLands.length,
        verifiedLands: allLands.filter(l => ['VERIFIED', 'AUTO_VERIFIED'].includes(l.verification?.status)).length,
        pendingKYC: users.length,
        totalUsers: 0
      });
    } catch (error) {
      console.error('Failed to fetch verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyKYC = async (userId, status) => {
    try {
      const res = await fetch('/api/user/kyc/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status, adminNotes: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} via Verification Center` }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User KYC ${status.toLowerCase()} successfully.`);
        fetchData();
      } else {
        toast.error(`Failed: ${data.message}`);
      }
    } catch (err) {
      console.error('KYC Verification failed', err);
      toast.error('Network error. Failed to update KYC status.');
    }
  };

  const handleVerifyLand = async (landId, status) => {
    try {
      const res = await fetch(`/api/land/${landId}/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: status, verificationNotes: `${status === 'VERIFIED' ? 'Approved' : 'Rejected'} via Verification Center` }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Stand ${status.toLowerCase()} successfully.`);
        fetchData();
      } else {
        toast.error(`Failed: ${data.message}`);
      }
    } catch (err) {
      console.error('Land Verification failed', err);
      toast.error('Network error. Failed to update land status.');
    }
  };

  const filteredLands = lands.filter(land => {
    const ownerName = land.owner ? `${land.owner.firstName} ${land.owner.lastName}` : '';
    const matchesSearch = land.standNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || land.verification?.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="text-center p-10">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">LandSolutions Verification Center</h1>
            <p className="text-gray-600">Admin Control Panel for Marketplace Integrity</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('LAND')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'LAND' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              <Map size={18} /> Land Listings
            </button>
            <button
              onClick={() => setViewMode('KYC')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'KYC' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              <UserCheck size={18} /> User KYC ({stats.pendingKYC})
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm">Total Land Listings</h3>
            <p className="text-2xl font-bold">{stats.totalLands}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm">Verified Listings</h3>
            <p className="text-2xl font-bold">{stats.verifiedLands}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
            <h3 className="text-gray-500 text-sm">Pending User KYC</h3>
            <p className="text-2xl font-bold">{stats.pendingKYC}</p>
          </div>
        </div>

        {viewMode === 'LAND' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredLands.length === 0 ? (
              <div className="text-center p-10 text-gray-500">
                No land listings found matching your criteria.
              </div>
            ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property Identity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Integrity Scan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLands.map(land => (
                  <tr key={land._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold">Stand {land.standNumber}</div>
                      <div className="text-xs text-gray-500">{land.titleDeedNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{land.owner?.firstName} {land.owner?.lastName}</div>
                      <div className="text-xs text-gray-500">{land.owner?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{land.location?.address?.suburb}</td>
                    <td className="px-6 py-4 text-sm">${land.transaction?.listedPrice?.amount?.toLocaleString()}</td>
                    {/* AI Verdict Cell */}
                    <td className="px-6 py-4">
                      {land.verification?.autoVerification?.riskScore != null ? (
                        <div className="space-y-1">
                          <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                            land.verification.autoVerification.riskScore <= 25
                              ? 'bg-green-100 text-green-800'
                              : land.verification.autoVerification.riskScore <= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            Risk: {land.verification.autoVerification.riskScore}/100
                          </div>
                          <div className="text-xs text-gray-500">
                            {land.verification.autoVerification.decision?.replace('_', ' ')}
                          </div>
                          {land.verification.autoVerification.flags?.length > 0 && (
                            <div className="text-xs text-red-600" title={land.verification.autoVerification.flags.join(', ')}>
                              ⚠️ {land.verification.autoVerification.flags.length} flag(s)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Pending scan...</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        ['VERIFIED', 'AUTO_VERIFIED'].includes(land.verification?.status) ? 'bg-green-100 text-green-800' :
                        land.verification?.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        land.fraudFlags?.length > 0 ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {land.verification?.status}
                        {land.fraudFlags?.length > 0 && ' ⚠️'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <a href={`/lands/${land._id}`} target="_blank" rel="noreferrer"
                          className="text-blue-600 hover:underline text-sm">View</a>
                        {land.verification?.status !== 'VERIFIED' && (
                          <button 
                            onClick={() => {
                              const score = land.verification?.autoVerification?.riskScore || 0;
                              if (score < 70 && (currentUser?.rest?.role || currentUser?.role) !== 'SYSTEM_ADMIN') {
                                toast.error('Admin Override Required: Score is too low.');
                                return;
                              }
                              handleVerifyLand(land._id, 'VERIFIED');
                            }}
                            className={`${(land.verification?.autoVerification?.riskScore || 0) < 70 && (currentUser?.rest?.role || currentUser?.role) !== 'SYSTEM_ADMIN' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white px-2 py-1 rounded text-xs`}
                            title={(land.verification?.autoVerification?.riskScore || 0) < 70 && (currentUser?.rest?.role || currentUser?.role) !== 'SYSTEM_ADMIN' ? 'Admin Override Required (Score < 70%)' : ''}
                          >
                            {(land.verification?.autoVerification?.riskScore || 0) < 70 && (currentUser?.rest?.role || currentUser?.role) !== 'SYSTEM_ADMIN' ? '🔒 Blocked' : '✓ Approve'}
                          </button>
                        )}
                        {land.verification?.status !== 'REJECTED' && (
                          <button onClick={() => handleVerifyLand(land._id, 'REJECTED')}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">
                            ✗ Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {pendingUsers.length === 0 ? (
              <div className="text-center p-10 text-gray-500">No pending KYC submissions.</div>
            ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">National ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC Documents</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingUsers.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{user.nationalId}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap max-w-[250px]">
                        {user.verification?.kycDocs?.map((doc, i) => (
                          <div key={i} className="group relative">
                            {doc.documentUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                              <div className="flex flex-col items-center">
                                <img 
                                  src={doc.documentUrl} 
                                  alt={doc.documentType}
                                  className="w-12 h-12 object-cover rounded border border-gray-200 hover:scale-[4] hover:z-50 hover:relative transition-transform cursor-zoom-in"
                                />
                                <span className="text-[8px] font-bold text-gray-500 uppercase mt-1">{doc.documentType.split('_').pop()}</span>
                              </div>
                            ) : (
                              <a href={doc.documentUrl} target="_blank" rel="noreferrer"
                                className="flex flex-col items-center p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                                <FileText size={16} className="text-gray-500" />
                                <span className="text-[8px] font-bold text-gray-500 uppercase mt-1">DOC</span>
                              </a>
                            )}
                          </div>
                        )) || <span className="text-xs text-gray-400">No docs</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleVerifyKYC(user._id, 'APPROVED')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                          ✓ Approve
                        </button>
                        <button onClick={() => handleVerifyKYC(user._id, 'REJECTED')}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                          ✗ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationCenter;
