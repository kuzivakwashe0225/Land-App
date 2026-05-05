import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MapPin,
  FileText,
  Shield,
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  Send,
  MessageSquare,
  Lock,
  Map,
  ImageIcon
} from 'lucide-react';
import { landService } from '../services/landService';
import GISMap from '../components/GISMap';

const LandDetail = () => {
  const { landId } = useParams();
  const navigate = useNavigate();
  const userState = useSelector((state) => state.user);
  const currentUser = userState?.user || userState?.currentUser || userState;
  const userRole = currentUser?.rest?.role || currentUser?.role || 'BUYER';
  const currentUserId = currentUser?.rest?._id || currentUser?._id;

  const [land, setLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasCompletedTransaction, setHasCompletedTransaction] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchLandDetail = async () => {
      try {
        const response = await landService.getLandById(landId);
        setLand(response.data);
        setOfferPrice(response.data.transaction?.listedPrice?.amount || '');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch land details');
      } finally {
        setLoading(false);
      }
    };

    fetchLandDetail();
  }, [landId]);

  useEffect(() => {
    const checkCompletedTransaction = async () => {
      if (userRole === 'BUYER' && landId && currentUserId) {
        try {
          const response = await fetch(`/api/transaction?land=${landId}&buyer=${currentUserId}&status=COMPLETED`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.ok) {
            const data = await response.json();
            setHasCompletedTransaction(data.transactions && data.transactions.length > 0);
          }
        } catch (err) {
          console.error('Error checking completed transactions:', err);
        }
      }
    };

    checkCompletedTransaction();
  }, [userRole, landId, currentUserId]);

  const handleBuyRequest = async (e) => {
    e.preventDefault();
    if (!currentUser) return navigate('/sign-in');

    setSubmitting(true);
    try {
      const res = await fetch('/api/transaction/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landId,
          offerPrice: Number(offerPrice),
          message: offerMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Your purchase request has been sent to the seller!");
        setShowBuyModal(false);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading land details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-bold text-slate-800 mb-2">{error}</p>
          <p className="text-slate-500 mb-6">This listing may have been removed or is currently unavailable.</p>
          <button
            onClick={() => navigate('/lands')}
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId && land.owner?._id?.toString() === currentUserId?.toString();
  const isVerified = ['VERIFIED', 'AUTO_VERIFIED'].includes(land.verification?.status);
  const canViewDocuments = ['MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'].includes(userRole) || isOwner || hasCompletedTransaction;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Breadcrumb replacement / Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-blue-600 font-bold text-sm uppercase tracking-widest block mb-2">Property Details</span>
            <h1 className="text-4xl font-black text-slate-900 mb-2">
              Stand {land.standNumber}
            </h1>
            <div className="flex items-center text-slate-500 font-medium">
              <MapPin className="h-5 w-5 mr-1 text-slate-400" />
              <span>{land.location?.address?.suburb}, {land.location?.address?.city}</span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="flex items-center md:justify-end gap-2 mb-1">
              <DollarSign className="text-green-600 w-6 h-6" />
              <span className="text-4xl font-black text-slate-900">
                {land.transaction?.listedPrice?.amount?.toLocaleString()}
              </span>
            </div>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Listed Price (USD)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Action Card for Mobile (Floating on small screens, shown here) */}
            <div className="lg:hidden bg-white p-6 rounded-3xl shadow-xl border border-blue-50">
              {isVerified ? (
                <div className="space-y-4">
                  {/* Removed Request to Buy from mobile as per user request */}
                  {!isOwner && (
                    <button
                      onClick={() => {
                        navigate('/messages', { state: { partnerId: land.owner?._id, partnerName: `${land.owner?.firstName} ${land.owner?.lastName}` } });
                      }}
                      className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <MessageSquare /> Message Seller
                      </div>
                    </button>
                  )}
                  {isOwner && (
                    <div className="text-center p-4 bg-slate-50 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-xs">
                      This is your property listing
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                  <Lock className="text-amber-600" />
                  <p className="text-amber-800 text-sm font-bold">Awaiting Verification by LandSolutions</p>
                </div>
              )}
            </div>

            {/* Gallery */}
            <div className="aspect-[16/9] bg-slate-200 rounded-[2.5rem] overflow-hidden relative group">
              {land.images && land.images.length > 0 ? (
                <>
                  <img
                    src={land.images[selectedImageIndex]}
                    alt={`Land property ${selectedImageIndex + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const nextSibling = e.target.nextElementSibling;
                      if (nextSibling) {
                        nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  {land.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev - 1 + land.images.length) % land.images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Previous image"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev + 1) % land.images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Next image"
                      >
                        ›
                      </button>
                    </>
                  )}
                </>
              ) : null}
              <div className={`absolute inset-0 flex items-center justify-center bg-slate-100 flex-col gap-4 ${land.images && land.images.length > 0 ? 'hidden' : ''}`}>
                <ImageIcon className="text-slate-300 w-20 h-20" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No Images Available</p>
              </div>
              <div className="absolute top-6 left-6 flex gap-2">
                {isVerified && (
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full font-black text-xs uppercase flex items-center gap-2 shadow-lg">
                    <Shield size={14} /> Verified Stand
                  </div>
                )}
                <div className="bg-slate-900/40 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-xs uppercase">
                  {land.landDetails?.zoning}
                </div>
              </div>
              {land.images && land.images.length > 1 && (
                <div className="absolute bottom-6 left-6 bg-slate-900/40 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-xs uppercase">
                  {selectedImageIndex + 1}/{land.images.length} Photos
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-4">Project Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Area Size</p>
                  <p className="text-lg font-black text-slate-800">{land.landDetails?.size?.squareMeters} m²</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Zoning</p>
                  <p className="text-lg font-black text-slate-800 lowercase first-letter:uppercase">{land.landDetails?.zoning}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Suburb</p>
                  <p className="text-lg font-black text-slate-800 uppercase">{land.location?.address?.suburb}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">City</p>
                  <p className="text-lg font-black text-slate-800 uppercase">{land.location?.address?.city}</p>
                </div>
              </div>

              <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-2">Description</h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {land.description || "A premium, verified stand located in a prime area. Ready for development with all necessary municipal checks completed by LandSolutions verification officers."}
                </p>
              </div>
            </div>

            {/* Location Map - Show for all verified listings */}
            {isVerified && land.location?.coordinates && (
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 overflow-hidden">
                <h2 className="text-2xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-4 flex items-center gap-3">
                  <Map className="text-blue-600" />
                  Location on Map
                </h2>
                <div className="rounded-2xl overflow-hidden">
                  {land.location.coordinates?.latitude && land.location.coordinates?.longitude ? (
                    <GISMap
                      lands={[land]}
                      selectedLand={land}
                      center={[land.location.coordinates.latitude, land.location.coordinates.longitude]}
                      zoom={15}
                      height="400px"
                      editable={false}
                    />
                  ) : (
                    <div className="h-96 bg-gray-100 flex items-center justify-center rounded-lg">
                      <p className="text-gray-500 font-bold">Map data unavailable</p>
                    </div>
                  )}
                </div>
                {land.location.coordinates?.latitude && land.location.coordinates?.longitude && (
                  <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Latitude</p>
                      <p className="text-sm font-mono text-slate-700">{land.location.coordinates.latitude.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Longitude</p>
                      <p className="text-sm font-mono text-slate-700">{land.location.coordinates.longitude.toFixed(6)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Documents */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-4 flex items-center gap-3">
                <FileText className="text-blue-600" />
                Technical Documents
              </h2>
              <div className="grid gap-4">
                {canViewDocuments ? (
                  land.verification?.verificationDocuments && land.verification.verificationDocuments.length > 0 ? (
                    land.verification.verificationDocuments.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                            <FileText size={20} />
                          </div>
                          <p className="font-bold text-slate-700">{doc.documentType.replace('_', ' ')}</p>
                        </div>
                        <span className="text-blue-600 font-bold text-sm">View →</span>
                      </a>
                    ))
                  ) : (
                    <p className="text-center text-sm text-slate-500 font-bold italic py-6">No documents uploaded yet.</p>
                  )
                ) : (
                  <>
                    {['Title Deed', 'Survey Plan', 'Rates Clearance'].map((docName) => (
                      <div key={docName} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400">
                            <FileText size={20} />
                          </div>
                          <p className="font-bold text-slate-700">{docName}</p>
                        </div>
                        <Lock className="text-slate-300" size={18} />
                      </div>
                    ))}
                    <p className="text-center text-xs text-slate-400 font-bold mt-2 italic">
                      {userRole === 'BUYER'
                        ? '* Documents are visible once your purchase request is accepted.'
                        : '* Documents are restricted to authorized personnel only.'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Purchase Card */}
            <div className="hidden lg:block bg-white p-8 rounded-[2.5rem] shadow-xl border border-blue-50 sticky top-24">
              <h2 className="text-2xl font-black text-slate-800 mb-6">Market Action</h2>

              <div className="space-y-6">
                <div className="flex justify-between items-center text-sm font-bold border-b border-slate-50 pb-4">
                  <span className="text-slate-400">STATUS</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black ${land.transaction?.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                    {land.transaction?.status}
                  </span>
                </div>

                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-blue-800">
                  <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-60">Verified Ownership</p>
                  <p className="font-bold text-sm">Checked against deeds office records by LandSolutions officers.</p>
                </div>

                {isVerified || land.verification.status === 'AUTO_VERIFIED' ? (
                  <div className="space-y-4">
                    {/* Removed Request to Buy button as per user request */}
                    
                    {!isOwner && (
                      <button
                        onClick={() => {
                          // Start a conversation
                          navigate('/messages', { state: { partnerId: land.owner?._id, partnerName: `${land.owner?.firstName} ${land.owner?.lastName}` } });
                        }}
                        className="w-full bg-white border-2 border-slate-900 text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all group"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <MessageSquare className="group-hover:rotate-12 transition-transform" />
                          Message Seller
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                    <Lock className="text-amber-600" />
                    <p className="text-amber-800 text-sm font-bold">Verification in progress</p>
                  </div>
                )}

                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  By clicking you initiation a secure negotiation via the LandSolutions platform.
                </p>
              </div>
            </div>

            {/* Seller Contact */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
              <h2 className="text-xl font-bold mb-6">Listed By</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center">
                  <User className="text-slate-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-lg">{land.owner?.firstName} {land.owner?.lastName}</p>
                    {land.owner?.verification?.sellerDetailsApproved ? (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">✓ Verified</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">⟳ Pending</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Professional Seller</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Request Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 p-8 text-white relative">
              <button onClick={() => setShowBuyModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                <XCircle size={24} />
              </button>
              <h2 className="text-2xl font-black uppercase tracking-tighter font-primary">Initiate Purchase</h2>
              <p className="text-slate-400 text-sm">Send your bid to Stand {land.standNumber}'s owner.</p>
            </div>

            <form onSubmit={handleBuyRequest} className="p-8 space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Offer Amount (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 p-5 pl-12 rounded-2xl font-black text-xl text-slate-800 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Message to Seller</label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl min-h-[120px] font-medium text-slate-700 focus:outline-none focus:border-blue-400 transition-colors"
                  placeholder="e.g. I am interested in cash purchase. When can we meet for viewing?"
                  required
                ></textarea>
              </div>

              <button
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {submitting ? "Sending..." : (
                  <>
                    <Send size={20} />
                    Confirm Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandDetail;
