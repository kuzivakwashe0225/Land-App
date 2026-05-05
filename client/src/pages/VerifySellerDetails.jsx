import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Upload, CheckCircle, AlertCircle, Camera, X, RefreshCw } from "lucide-react";

function VerifySellerDetails() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [files, setFiles] = useState({
    NATIONAL_ID: null,
    PROOF_OF_ADDRESS: null,
    ID_WITH_SELFIE: null,
  });

  // Camera state for ID with selfie
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedSelfie, setCapturedSelfie] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const user = currentUser?.rest || currentUser;
    if (user?.verification?.sellerDetailsApproved === true) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  // Stop camera when component unmounts or camera is closed
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) setFiles({ ...files, [type]: file });
  };

  // ── Camera handlers ────────────────────────────────────────────────────────
  const openCamera = async () => {
    try {
      setError(null);
      console.log("Opening camera...");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support camera access or you are not using a secure (HTTPS) connection.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      });
      setCameraStream(stream);
      setShowCamera(true);
      setCapturedSelfie(null);

      // Attach stream to video element after state update
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Video play failed:", e));
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
      setError(`Camera access error: ${err.message}`);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    // Mirror the image (selfie camera is usually mirrored)
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.scale(-1, 1); // Reset

    canvas.toBlob((blob) => {
      const file = new File([blob], `selfie-with-id-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setCapturedSelfie(URL.createObjectURL(blob));
      setFiles(prev => ({ ...prev, ID_WITH_SELFIE: file }));
    }, 'image/jpeg', 0.9);
  };

  const retakePhoto = () => {
    setCapturedSelfie(null);
    setFiles(prev => ({ ...prev, ID_WITH_SELFIE: null }));
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const confirmSelfie = () => {
    closeCamera();
  };

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Personal Details Verification submission started...");
    setLoading(true);
    setError(null);

    if (!files.NATIONAL_ID || !files.PROOF_OF_ADDRESS || !files.ID_WITH_SELFIE) {
      const missing = [];
      if (!files.NATIONAL_ID) missing.push("National ID");
      if (!files.PROOF_OF_ADDRESS) missing.push("Proof of Address");
      if (!files.ID_WITH_SELFIE) missing.push("ID with Selfie");

      setError(`Please provide all required documents. Missing: ${missing.join(", ")}`);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("documents", files.NATIONAL_ID);
    formData.append("documents", files.PROOF_OF_ADDRESS);
    formData.append("documents", files.ID_WITH_SELFIE);
    formData.append("docTypes", JSON.stringify(["NATIONAL_ID", "PROOF_OF_ADDRESS", "ID_WITH_SELFIE"]));

    try {
      const res = await fetch("/api/user/verify-seller-details/submit", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `Server error: ${res.status}` }));
        throw new Error(errorData.message || "Failed to submit documents");
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Submission failed");
      }

      console.log("Personal details verification submitted successfully");
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err) {
      console.error("Verification submission error:", err);
      setError(err.message || "Network error. Please try again.");
      setLoading(false);
    }
  };

  const docConfig = [
    {
      key: "NATIONAL_ID",
      label: "National ID",
      description: "Upload a clear photo or scan of your Zimbabwean National ID card",
      icon: "🪪",
      accept: ".pdf,.jpg,.jpeg,.png",
      useCamera: false,
    },
    {
      key: "PROOF_OF_ADDRESS",
      label: "Proof of Address",
      description: "Upload a utility bill, bank statement, or letter showing your current address (within 3 months)",
      icon: "🏠",
      accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
      useCamera: false,
    },
    {
      key: "ID_WITH_SELFIE",
      label: "ID with Selfie",
      description: "Take a live photo of yourself holding your National ID card — your face and ID must both be clearly visible",
      icon: "🤳",
      accept: "image/*",
      useCamera: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-8 text-white text-center">
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">Verify Your Identity</h1>
          <p className="text-slate-400">Complete personal details verification to unlock verified seller status and allow your listings to appear as verified to buyers.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">✓ Why verify your details?</p>
            <ul className="space-y-1 text-xs">
              <li>• Your listings will appear as <strong>Verified</strong> to buyers</li>
              <li>• Buyers gain confidence in your legitimacy</li>
              <li>• Faster transaction completion rates</li>
              <li>• Unlock exclusive seller features</li>
            </ul>
          </div>

          <div className="grid gap-6">
            {docConfig.map(({ key, label, description, icon, accept, useCamera }) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span>{icon}</span> {label}
                </label>
                <p className="text-xs text-slate-500">{description}</p>

                {useCamera ? (
                  // ── Camera mode for ID with Selfie ─────────────────────────
                  <div>
                    {files[key] ? (
                      <div className="border-2 border-green-200 bg-green-50 rounded-2xl p-4 flex flex-col items-center gap-3">
                        {capturedSelfie && (
                          <img src={capturedSelfie} alt="Captured selfie" className="w-40 h-32 object-cover rounded-lg" />
                        )}
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle size={20} />
                          <span className="font-bold text-sm">{files[key].name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { retakePhoto(); openCamera(); }}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          <RefreshCw size={16} /> Retake Photo
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={openCamera}
                        className="w-full border-2 border-dashed border-blue-300 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer"
                      >
                        <Camera size={40} className="text-blue-500" />
                        <span className="font-bold text-blue-700">Open Camera</span>
                        <span className="text-xs text-blue-500">Hold your ID next to your face and take a photo</span>
                      </button>
                    )}
                  </div>
                ) : (
                  // ── File upload for other docs ─────────────────────────────
                  <div className="relative group">
                    <input
                      type="file"
                      accept={accept}
                      onChange={(e) => handleFileChange(e, key)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      required={!files[key]}
                    />
                    <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${
                      files[key] ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-white"
                    }`}>
                      {files[key] ? (
                        <>
                          <CheckCircle className="text-green-500 mb-2" size={32} />
                          <span className="text-green-700 font-bold text-sm truncate max-w-[200px]">{files[key].name}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" size={32} />
                          <span className="text-slate-500 text-sm font-medium">Click or drag file to upload</span>
                          <span className="text-slate-400 text-[10px] mt-1">PDF, Images (Max 5MB)</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 border border-red-100 animate-pulse">
              <AlertCircle className="shrink-0" />
              <p className="font-bold text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 text-green-700 rounded-2xl flex items-center gap-3 border border-green-100">
              <CheckCircle className="shrink-0" />
              <p className="font-bold text-sm">Documents received successfully! Your verification is now pending review. Our team will verify your details shortly. Redirecting...</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50 mt-2"
          >
            {loading ? "Verifying..." : "Submit Verification Documents"}
          </button>
        </form>
      </div>

      {/* ── Camera Modal ────────────────────────────────────────────────────── */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-700">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Camera size={20} className="text-blue-400" /> Take ID with Selfie
              </h3>
              <button onClick={closeCamera} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-5">
              <div className="bg-slate-800 rounded-xl overflow-hidden mb-4 aspect-video flex items-center justify-center">
                {capturedSelfie ? (
                  <img src={capturedSelfie} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }} // Mirror for selfie camera
                  />
                )}
              </div>

              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />

              <div className="bg-blue-900/40 rounded-xl p-3 mb-4 text-xs text-blue-200 text-center">
                📌 Hold your <strong>National ID card</strong> clearly next to your face. Ensure both your face and ID text are visible and in focus.
              </div>

              <div className="flex gap-3">
                {capturedSelfie ? (
                  <>
                    <button
                      onClick={retakePhoto}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-xl hover:bg-slate-600 font-semibold"
                    >
                      <RefreshCw size={18} /> Retake
                    </button>
                    <button
                      onClick={confirmSelfie}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 font-semibold"
                    >
                      <CheckCircle size={18} /> Use This Photo
                    </button>
                  </>
                ) : (
                  <button
                    onClick={capturePhoto}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 font-bold text-lg"
                  >
                    <Camera size={24} /> Capture Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerifySellerDetails;
