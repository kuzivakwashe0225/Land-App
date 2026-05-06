import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
    Plus,
    Search,
    MapPin,
    Clock,
    CheckCircle,
    AlertCircle,
    ShieldCheck,
    LayoutDashboard,
    List,
    MessageSquare,
    User,
    ArrowRight,
    TrendingUp,
    FileText,
    Lock,
    RefreshCw
} from 'lucide-react';
import { landService } from '../services/landService';

const Dashboard = () => {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalListings: 0,
        verifiedListings: 0,
        pendingVerifications: 0,
        activeInquiries: 0,
        unreadMessages: 0
    });
    const [userListings, setUserListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const refreshDashboard = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!currentUser) return;
            try {
                // Fetch user's own listings
                const userListingsRes = await landService.getLandListings({ owner: currentUser?.rest?._id || currentUser._id });
                const userListings = Array.isArray(userListingsRes.data) ? userListingsRes.data : (userListingsRes.data?.lands || []);
                setUserListings(userListings);

                // Fetch public dashboard stats (platform-wide) - always fresh
                let platformStats = { totalListings: 0, verifiedListings: 0, pendingListings: 0, flaggedListings: 0 };
                try {
                    const statsRes = await fetch('/api/dashboard/public-stats', {
                        credentials: 'include',
                        cache: 'no-store',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache'
                        }
                    });
                    if (statsRes.ok) {
                        const statsData = await statsRes.json();
                        platformStats = statsData.data || platformStats;
                    }
                } catch (statsErr) {
                    console.warn('Could not fetch dashboard stats:', statsErr);
                }

                // Fetch Transactions for inquiries count
                let activeInquiries = 0;
                try {
                    const txnRes = await fetch('/api/transaction/my-transactions', { credentials: 'include' });
                    if (txnRes.ok) {
                        const txnData = await txnRes.json();
                        activeInquiries = txnData.data?.length || 0;
                    }
                } catch (txnErr) {
                    console.warn('Could not fetch transactions:', txnErr);
                }

                // Fetch Unread Messages
                let unreadTotal = 0;
                try {
                    const msgRes = await fetch('/api/message/conversations', { credentials: 'include' });
                    if (msgRes.ok) {
                        const msgData = await msgRes.json();
                        unreadTotal = msgData.data?.reduce((acc, curr) => acc + curr.unreadCount, 0) || 0;
                    }
                } catch (msgErr) {
                    console.warn('Could not fetch messages:', msgErr);
                }

                // Fetch Recent Verified Lands for Buyers
                let verifiedLands = [];
                try {
                    const verifiedRes = await fetch('/api/land?limit=5&status=VERIFIED', { credentials: 'include' });
                    if (verifiedRes.ok) {
                        const verifiedData = await verifiedRes.json();
                        verifiedLands = verifiedData.data || [];
                    }
                } catch (vErr) {
                    console.warn('Could not fetch verified lands:', vErr);
                }

            // Get user role for permission checks (moved before setStats)
            const userRole = currentUser?.rest?.role || currentUser?.role || 'BUYER';
            const isSellerRole = userRole === 'SELLER';

                setStats({
                    totalListings: isSellerRole ? userListings.length : (platformStats.totalListings || 0),
                    verifiedListings: isSellerRole
                        ? userListings.filter(l => ['VERIFIED', 'AUTO_VERIFIED', 'AUTHORITY_VERIFIED'].includes(l.verification?.status)).length
                        : (platformStats.verifiedListings || 0),
                    pendingVerifications: isSellerRole
                        ? userListings.filter(l => ['PENDING_VERIFICATION', 'REQUIRES_REVIEW', 'PENDING_DOCUMENT_REVIEW'].includes(l.verification?.status)).length
                        : (platformStats.pendingListings || 0),
                    activeInquiries: activeInquiries || 0,
                    unreadMessages: unreadTotal || 0,
                    verifiedLandsList: verifiedLands
                });
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Polling: Refresh data every 10 seconds for real-time updates
        const interval = setInterval(fetchDashboardData, 10000);
        return () => clearInterval(interval);
    }, [currentUser, refreshKey]);

    // Get user role for permission checks
    const userRole = currentUser?.rest?.role || currentUser?.role || 'BUYER';
    const isSellerRole = userRole === 'SELLER';
    const isBuyerRole = userRole === 'BUYER';
    const isOfficerRole = ['VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER'].includes(userRole);
    const isAdminRole = ['SYSTEM_ADMIN'].includes(userRole);

    // Define all possible quick actions with permissions
    const allQuickActions = [
        {
            label: 'New Listing',
            icon: Plus,
            color: 'bg-blue-600',
            onClick: () => navigate('/create-land-listing'),
            description: 'Add a new verified stand',
            allowedRoles: ['SELLER'],
            lockedReason: 'Only sellers can create listings'
        },
        {
            label: 'Browse Stands',
            icon: Search,
            color: 'bg-slate-900',
            onClick: () => navigate('/lands'),
            description: 'Explore verified market',
            allowedRoles: ['BUYER', 'SELLER', 'VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER', 'SYSTEM_ADMIN'],
            lockedReason: ''
        },
        {
            label: 'Personal Details',
            icon: ShieldCheck,
            color: 'bg-emerald-600',
            onClick: () => navigate('/verify-seller-details'),
            description: 'Verify your identity to unlock verified listings',
            allowedRoles: ['SELLER'],
            lockedReason: 'Personal details verification is for sellers only'
        },
        {
            label: 'Messages',
            icon: MessageSquare,
            color: 'bg-blue-400',
            onClick: () => navigate('/messages'),
            description: `You have ${stats.unreadMessages} unread messages`,
            allowedRoles: ['BUYER', 'SELLER', 'VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER', 'SYSTEM_ADMIN'],
            lockedReason: ''
        }
    ];

    // Filter actions: show only if role allowed, or show as disabled
    const quickActions = allQuickActions.map(action => ({
        ...action,
        isAvailable: action.allowedRoles.includes(userRole),
        isDisabled: !action.allowedRoles.includes(userRole)
    }));

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="bg-slate-900 text-white pt-24 pb-32 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left flex-1">
                        <span className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-3 block">Welcome Back, {currentUser?.rest?.firstName || currentUser?.firstName}</span>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">LandSolutions <span className="text-blue-500">DASHBOARD</span></h1>
                        <p className="text-slate-400 font-medium max-w-md">Manage your Zimbabwe land investments and property listings with state-of-the-art security.</p>
                    </div>

                    <button
                        onClick={refreshDashboard}
                        className="hidden md:flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-bold uppercase text-xs tracking-widest transition-all transform hover:scale-105"
                        title="Refresh dashboard data (auto-refreshes every 10 seconds)"
                    >
                        <RefreshCw size={16} />
                        Refresh Data
                    </button>

                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-2xl shadow-lg">
                            {(currentUser?.rest?.firstName || currentUser?.firstName)?.[0]}
                        </div>
                        <div>
                            <p className="font-black text-lg">{currentUser?.rest?.firstName || currentUser?.firstName}</p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                <ShieldCheck size={14} />
                                {currentUser?.rest?.role || currentUser?.role} Verified
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { 
                            label: isSellerRole ? 'My Inventory' : 'Market Inventory', 
                            val: stats.totalListings, 
                            icon: List, 
                            sub: isSellerRole ? 'Total listings' : 'Available units', 
                            onClick: () => navigate('/lands?view=all') 
                        },
                        { 
                            label: isSellerRole ? 'Cleared Assets' : 'Verified Stands', 
                            val: stats.verifiedListings, 
                            icon: CheckCircle, 
                            sub: 'Legally cleared', 
                            color: 'text-emerald-500', 
                            onClick: () => navigate('/lands?verified=true') 
                        },
                        { 
                            label: isSellerRole ? 'Buyer Interest' : 'My Inquiries', 
                            val: stats.activeInquiries, 
                            icon: TrendingUp, 
                            sub: isSellerRole ? 'Pending deals' : 'Active requests', 
                            color: 'text-blue-500', 
                            onClick: () => navigate('/transactions') 
                        },
                        { 
                            label: 'Messages', 
                            val: stats.unreadMessages, 
                            icon: MessageSquare, 
                            sub: 'Unread chats', 
                            color: 'text-blue-400', 
                            onClick: () => navigate('/messages') 
                        }
                    ].map((stat, i) => (
                        <button key={i} onClick={stat.onClick} className="text-left bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 group hover:border-blue-200 hover:shadow-blue-200/50 transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-4 rounded-2xl ${stat.color ? 'bg-slate-50' : 'bg-slate-900'} group-hover:bg-blue-600 group-hover:text-white transition-all`}>
                                    <stat.icon className={stat.color || 'text-white'} size={24} />
                                </div>
                                <span className="text-4xl font-black tracking-tighter text-slate-800">{stat.val}</span>
                            </div>
                            <p className="font-black text-slate-800 uppercase tracking-tighter text-sm mb-1">{stat.label}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{stat.sub}</p>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Show "My Active Listings" only for sellers, or show info message for buyers */}
                        {isSellerRole ? (
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">My Active Listings</h2>
                                    <Link to="/lands" className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:underline">
                                        See Market <ArrowRight size={16} />
                                    </Link>
                                </div>

                                <div className="overflow-x-auto">
                                    {userListings.length === 0 ? (
                                        <div className="p-20 text-center">
                                            <LayoutDashboard className="mx-auto text-slate-200 h-16 w-16 mb-4" />
                                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No listings found in your portfolio.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Property ID</th>
                                                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Location</th>
                                                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Price</th>
                                                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Verification</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {userListings.map((land) => (
                                                    <tr key={land._id} onClick={() => navigate(`/lands/${land._id}`)} className="hover:bg-blue-50/30 cursor-pointer transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <p className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">Stand {land.standNumber}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{land.landDetails?.zoning}</p>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-1 text-slate-600 font-bold text-sm">
                                                                <MapPin size={14} className="text-slate-400" />
                                                                {land.location?.address?.suburb}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <p className="font-black text-slate-800 text-lg">${land.transaction?.listedPrice?.amount?.toLocaleString()}</p>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${['VERIFIED', 'AUTO_VERIFIED', 'AUTHORITY_VERIFIED'].includes(land.verification?.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${['VERIFIED', 'AUTO_VERIFIED', 'AUTHORITY_VERIFIED'].includes(land.verification?.status) ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                                {land.verification?.status || 'PENDING'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Verified Property Catalog</h2>
                                    <Link to="/lands?verified=true" className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:underline">
                                        View Market <ArrowRight size={16} />
                                    </Link>
                                </div>

                                <div className="overflow-x-auto">
                                    {!stats.verifiedLandsList || stats.verifiedLandsList.length === 0 ? (
                                        <div className="p-20 text-center">
                                            <Search className="mx-auto text-slate-200 h-16 w-16 mb-4" />
                                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No verified stands currently available.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Stand</th>
                                                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Location</th>
                                                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Price</th>
                                                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {stats.verifiedLandsList.slice(0, 5).map((land) => (
                                                    <tr key={land._id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-8 py-6" onClick={() => navigate(`/lands/${land._id}`)}>
                                                            <p className="font-black text-slate-800 group-hover:text-blue-600 transition-colors cursor-pointer">Stand {land.standNumber}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{land.landDetails?.zoning}</p>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-1 text-slate-600 font-bold text-sm">
                                                                <MapPin size={14} className="text-slate-400" />
                                                                {land.location?.address?.suburb}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <p className="font-black text-slate-800 text-lg">${land.transaction?.listedPrice?.amount?.toLocaleString()}</p>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate('/messages', { state: { partnerId: land.owner?._id, partnerName: `${land.owner?.firstName} ${land.owner?.lastName}` } });
                                                                }}
                                                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                                                            >
                                                                Inquire
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <h2 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tighter">Command Center</h2>
                            <div className="grid gap-4">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={action.isDisabled ? undefined : action.onClick}
                                        disabled={action.isDisabled}
                                        title={action.isDisabled ? action.lockedReason : ''}
                                        className={`w-full flex items-center gap-4 p-5 rounded-3xl border transition-all group ${
                                            action.isDisabled
                                                ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                                                : 'bg-slate-50 border border-slate-100 hover:border-blue-300 hover:bg-white cursor-pointer'
                                        }`}
                                    >
                                        <div className={`p-4 rounded-2xl ${action.isDisabled ? 'bg-gray-300 text-gray-600' : `${action.color} text-white`} shadow-lg flex items-center justify-center`}>
                                            {action.isDisabled ? <Lock size={20} /> : <action.icon size={20} />}
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className={`font-black uppercase tracking-tighter text-sm ${action.isDisabled ? 'text-gray-500' : 'text-slate-800'}`}>
                                                {action.label}
                                                {action.isDisabled && <span className="ml-2 text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded">Locked</span>}
                                            </p>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${action.isDisabled ? 'text-gray-400' : 'text-slate-400'}`}>
                                                {action.isDisabled ? action.lockedReason : action.description}
                                            </p>
                                        </div>
                                        {!action.isDisabled && <ArrowRight className="ml-auto text-slate-300 group-hover:text-blue-600 transition-colors" size={16} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
