import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Shield, Send, FileText, User, MapPin, Phone, Mail, MessageSquare } from 'lucide-react';

const FraudReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    reporterInfo: {
      name: '',
      email: '',
      phone: '',
      anonymous: false
    },
    suspiciousLand: {
      standNumber: '',
      location: '',
      ownerName: ''
    },
    fraudType: 'FAKE_LISTING',
    description: '',
    evidence: [],
    contactPreference: 'EMAIL'
  });

  const fraudTypes = [
    { value: 'FAKE_LISTING', label: 'Fake Listing' },
    { value: 'TITLE_DEED_FRAUD', label: 'Title Deed Fraud' },
    { value: 'MULTIPLE_OWNERSHIP', label: 'Multiple Ownership Claims' },
    { value: 'FAKE_DOCUMENTS', label: 'Fake Documents' },
    { value: 'PRICE_MANIPULATION', label: 'Price Manipulation' },
    { value: 'UNAUTHORIZED_SALE', label: 'Unauthorized Sale' },
    { value: 'IDENTITY_THEFT', label: 'Identity Theft' },
    { value: 'OTHER', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      evidence: [...prev.evidence, ...files]
    }));
  };

  const removeEvidence = (index) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submissionData = {
        reporterInfo: formData.reporterInfo,
        suspiciousLand: formData.suspiciousLand,
        fraudType: formData.fraudType,
        description: formData.description,
        contactPreference: formData.contactPreference
      };

      const res = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submissionData)
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Fraud report submitted successfully. We will investigate within 24-48 hours.');
        setTimeout(() => {
          navigate('/lands');
        }, 3000);
      } else {
        setError(data.message || 'Failed to submit fraud report. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting fraud report:', err);
      setError('Failed to submit fraud report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Fraudulent Activity</h1>
          <p className="text-gray-600">
            Help us keep the LandSolutions platform safe by reporting suspicious activities
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Reporter Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Your Information
            </h2>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="reporterInfo.anonymous"
                  checked={formData.reporterInfo.anonymous}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Report anonymously</span>
              </label>
            </div>

            {!formData.reporterInfo.anonymous && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="reporterInfo.name"
                    value={formData.reporterInfo.name}
                    onChange={handleChange}
                    required={!formData.reporterInfo.anonymous}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="reporterInfo.email"
                    value={formData.reporterInfo.email}
                    onChange={handleChange}
                    required={!formData.reporterInfo.anonymous}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="reporterInfo.phone"
                    value={formData.reporterInfo.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+263 123 456 789"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Suspicious Land Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Suspicious Land Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stand Number *
                </label>
                <input
                  type="text"
                  name="suspiciousLand.standNumber"
                  value={formData.suspiciousLand.standNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1234A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="suspiciousLand.location"
                  value={formData.suspiciousLand.location}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Borrowdale, Harare"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listed Owner Name
                </label>
                <input
                  type="text"
                  name="suspiciousLand.ownerName"
                  value={formData.suspiciousLand.ownerName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Owner name as listed"
                />
              </div>
            </div>
          </div>

          {/* Fraud Type */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Type of Fraud
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fraudTypes.map((type) => (
                <label key={type.value} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="fraudType"
                    value={type.value}
                    checked={formData.fraudType === type.value}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-900">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Detailed Description
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please describe the suspicious activity in detail *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide as much detail as possible about what makes this listing suspicious..."
              />
            </div>
          </div>

          {/* Evidence Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Supporting Evidence
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500">Upload evidence</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-600 mt-2">
                  Documents, images, or videos that support your claim
                </p>
              </div>
            </div>

            {formData.evidence.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium text-gray-900">Uploaded Evidence:</h3>
                {formData.evidence.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvidence(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Preference */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Preference</h2>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="contactPreference"
                  value="EMAIL"
                  checked={formData.contactPreference === 'EMAIL'}
                  onChange={handleChange}
                  className="mr-3"
                />
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="contactPreference"
                  value="PHONE"
                  checked={formData.contactPreference === 'PHONE'}
                  onChange={handleChange}
                  className="mr-3"
                />
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Phone</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="contactPreference"
                  value="NO_CONTACT"
                  checked={formData.contactPreference === 'NO_CONTACT'}
                  onChange={handleChange}
                  className="mr-3"
                />
                <span className="text-sm font-medium text-gray-900">No follow-up contact needed</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting Report...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Fraud Report
                </>
              )}
            </button>
          </div>
        </form>

        {/* Important Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Important Notice</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• False reports may result in legal consequences</li>
                <li>• All reports are investigated within 24-48 hours</li>
                <li>• Your identity will be protected if you choose to report anonymously</li>
                <li>• Provide as much evidence as possible to support your claim</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudReport;
