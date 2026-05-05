import React, { useState } from 'react';
import { format } from 'date-fns';

const LandVerificationCard = ({ land, onVerify, onFlag, onViewDetails, userRole, currentUserId }) => {
  const [showDocuments, setShowDocuments] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagType, setFlagType] = useState('SUSPICIOUS_ACTIVITY');
  const [evidence, setEvidence] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);

  // Derive permissions based on role
  const canFlag = ['VERIFICATION_OFFICER', 'SYSTEM_ADMIN'].includes(userRole);
  const canVerify = ['MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'].includes(userRole);
  const isOwner = currentUserId && land.owner?._id?.toString() === currentUserId?.toString();
  const canSeeDocuments = ['MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'].includes(userRole) || isOwner;

  const getVerificationStatus = () => {
    if (land.verification?.isVerified) {
      return { status: 'VERIFIED', color: 'green', icon: '✓' };
    } else if (land.transaction?.status === 'FLAGGED') {
      return { status: 'FLAGGED', color: 'red', icon: '⚠' };
    } else {
      return { status: 'PENDING', color: 'yellow', icon: '⟳' };
    }
  };

  const verificationStatus = getVerificationStatus();

  const handleFlagSubmit = () => {
    if (flagReason.trim()) {
      onFlag(land._id, {
        flagType: flagType,
        description: flagReason,
        evidence: evidence || null
      });
      setFlagReason('');
      setEvidence('');
      setFlagType('SUSPICIOUS_ACTIVITY');
      setShowFlagModal(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Image Thumbnail */}
      <div className="relative h-48 bg-gray-200 overflow-hidden group">
        {land.images && land.images.length > 0 ? (
          <>
            <img
              src={land.images[0]}
              alt={land.standNumber}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.parentElement.innerHTML = '<div class="absolute inset-0 bg-gray-300 flex items-center justify-center"><span class="text-gray-500 text-sm">Image unavailable</span></div>';
              }}
            />
            {land.images.length > 1 && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-semibold">
                +{land.images.length - 1} more
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <div className="text-gray-400 mb-2 text-2xl">📷</div>
              <p className="text-sm text-gray-500">No images</p>
            </div>
          </div>
        )}
      </div>

      {/* Header with verification status */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{land.standNumber}</h3>
            <p className="text-sm text-gray-600">{land.titleDeedNumber}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-${verificationStatus.color}-100 text-${verificationStatus.color}-800`}>
            <span className="mr-1">{verificationStatus.icon}</span>
            {verificationStatus.status}
          </div>
        </div>
      </div>

      {/* Location and details */}
      <div className="p-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Location</p>
            <p className="text-sm text-gray-600">
              {land.location.address.street}, {land.location.address.suburb}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Size</p>
              <p className="text-sm text-gray-600">{land.landDetails.size.squareMeters} m²</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Zoning</p>
              <p className="text-sm text-gray-600">{land.landDetails.zoning}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700">Price</p>
            <p className="text-lg font-bold text-green-600">
              ${land.transaction.listedPrice.amount.toLocaleString()}
            </p>
          </div>

          {/* Owner information */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Owner</p>
                <p className="text-sm text-gray-600">
                  {land.owner?.firstName} {land.owner?.lastName}
                </p>
                <p className="text-xs text-gray-500">{land.owner?.email}</p>
              </div>
              {land.owner?.verification?.sellerDetailsApproved ? (
                <div className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  ✓ Verified
                </div>
              ) : (
                <div className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                  ⟳ Pending
                </div>
              )}
            </div>
          </div>

          {/* Verification details */}
          {land.verification && (
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-gray-700">Verification Status</p>
                {canSeeDocuments && (
                  <button
                    onClick={() => setShowDocuments(!showDocuments)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showDocuments ? 'Hide' : 'Show'} Documents
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Deeds Office:</span>
                  <span className={`font-semibold ${land.verification.deedsOfficeVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {land.verification.deedsOfficeVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Municipal:</span>
                  <span className={`font-semibold ${land.verification.municipalVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {land.verification.municipalVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                {land.verification.verificationDate && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Verified On:</span>
                    <span className="text-gray-600">
                      {format(new Date(land.verification.verificationDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {/* System Verification Score & Details */}
              {land.verification.autoVerification && (
                <div className={`mt-3 p-3 rounded border ${land.verification.autoVerification.verificationScore < 70 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <p className={`text-sm font-semibold ${land.verification.autoVerification.verificationScore < 70 ? 'text-red-800' : 'text-blue-800'}`}>
                      🤖 System Verification Score
                    </p>
                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${land.verification.autoVerification.verificationScore >= 90 ? 'bg-green-200 text-green-800' : land.verification.autoVerification.verificationScore >= 70 ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>
                      {land.verification.autoVerification.verificationScore}%
                    </span>
                  </div>

                  {/* Show rejection reason if auto-rejected */}
                  {land.verification.status === 'REJECTED' && land.verification.autoVerification.reason && (
                    <div className="mb-2 p-2 bg-red-100 rounded border border-red-300">
                      <p className="text-xs font-semibold text-red-800">❌ Auto-Rejected:</p>
                      <p className="text-xs text-red-700">{land.verification.autoVerification.reason}</p>
                      {land.verification.autoVerification.isDuplicateRejection && (
                        <p className="text-xs text-red-700 font-semibold mt-1">🚫 Duplicate detection: This stand is already listed</p>
                      )}
                    </div>
                  )}

                  {/* Show verification notes/flags */}
                  {land.verification.autoVerification?.flags?.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Verification Checks:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {land.verification.autoVerification.flags.map((note, index) => (
                          <li key={index} className={`text-xs ${land.verification.autoVerification.verificationScore < 70 ? 'text-red-700' : 'text-blue-700'}`}>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {/* Documents */}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">📄 Documents</p>
                  {land.verification?.verificationDocuments?.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                      {land.verification.verificationDocuments.length}
                    </span>
                  )}
                </div>

                {canSeeDocuments ? (
                  land.verification?.verificationDocuments && land.verification.verificationDocuments.length > 0 ? (
                    <>
                      {showDocuments && (
                        <div className="space-y-1 p-3 bg-gray-50 rounded mb-2">
                          {land.verification.verificationDocuments.map((doc, index) => (
                            <div key={index} className="flex justify-between items-center text-xs">
                              <span className="text-gray-600">
                                <span className="font-semibold">{doc.documentType.replace('_', ' ')}</span>
                                {doc.uploadedAt && (
                                  <span className="text-gray-500 text-xs ml-2">
                                    ({new Date(doc.uploadedAt).toLocaleDateString()})
                                  </span>
                                )}
                              </span>
                              <a
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-semibold"
                                title="Download document"
                              >
                                ⬇
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => setShowDocuments(!showDocuments)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        {showDocuments ? '▼ Hide' : '▶ Show'} Documents
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No documents uploaded</p>
                  )
                ) : (
                  <p className="text-xs text-gray-600">
                    🔒 Documents visible to authorized users only
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Fraud flags */}
          {land.fraudFlags && land.fraudFlags.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-sm font-semibold text-red-700 mb-2">Fraud Flags ({land.fraudFlags.length})</p>
              <div className="space-y-1">
                {land.fraudFlags.slice(0, 2).map((flag, index) => (
                  <div key={index} className="text-xs text-red-600">
                    <span className="font-semibold">{flag.flagType.replace('_', ' ')}:</span> {flag.description}
                  </div>
                ))}
                {land.fraudFlags.length > 2 && (
                  <p className="text-xs text-gray-500">+{land.fraudFlags.length - 2} more flags</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(land)}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>

          {userRole === 'BUYER' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/messages?partnerId=${land.owner?._id}&partnerName=${land.owner?.firstName}+${land.owner?.lastName}`;
              }}
              className="flex-1 bg-white border border-blue-600 text-blue-600 px-3 py-2 rounded text-sm hover:bg-blue-50 transition-colors"
            >
              Inquire
            </button>
          )}

          {canVerify && !land.verification?.isVerified && onVerify && (
            <button
              onClick={() => onVerify(land._id)}
              disabled={
                land.verification?.autoVerification?.isDuplicateRejection ||
                (land.verification?.autoVerification?.verificationScore < 70 && userRole !== 'SYSTEM_ADMIN')
              }
              title={
                land.verification?.autoVerification?.isDuplicateRejection
                  ? 'Cannot approve: This is a duplicate stand'
                  : land.verification?.autoVerification?.verificationScore < 70 && userRole !== 'SYSTEM_ADMIN'
                  ? `Admin Override Required (Score: ${land.verification.autoVerification.verificationScore}% < 70%)`
                  : ''
              }
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors text-white ${
                land.verification?.autoVerification?.isDuplicateRejection
                  ? 'bg-gray-600 cursor-not-allowed'
                  : land.verification?.autoVerification?.verificationScore < 70 && userRole !== 'SYSTEM_ADMIN'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {land.verification?.autoVerification?.isDuplicateRejection
                ? '🚫 Duplicate (Cannot Approve)'
                : land.verification?.autoVerification?.verificationScore < 70 && userRole !== 'SYSTEM_ADMIN'
                ? `🔒 Admin Only (${land.verification.autoVerification.verificationScore}%)`
                : 'Verify'}
            </button>
          )}

          {canFlag && (
            <button
              onClick={() => setShowFlagModal(true)}
              className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Flag
            </button>
          )}
        </div>
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Flag Land as Suspicious</h3>
            <p className="text-sm text-gray-600 mb-4">
              Report suspicious activity for {land.standNumber}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flag Type
              </label>
              <select
                value={flagType}
                onChange={(e) => setFlagType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="SUSPICIOUS_ACTIVITY">Suspicious Activity</option>
                <option value="DUPLICATE_LISTING">Duplicate Listing</option>
                <option value="OWNERSHIP_DISPUTE">Ownership Dispute</option>
                <option value="FAKE_DOCUMENTS">Fake Documents</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Please describe why you believe this land listing is suspicious..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence (Optional)
              </label>
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Supporting evidence or additional details..."
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">{evidence.length}/1000</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleFlagSubmit}
                disabled={!flagReason.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Flag
              </button>
              <button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason('');
                  setEvidence('');
                  setFlagType('SUSPICIOUS_ACTIVITY');
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandVerificationCard;
