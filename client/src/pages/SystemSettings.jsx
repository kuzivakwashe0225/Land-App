import React, { useState } from 'react';
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    verificationTimeout: 72,
    maxFlagsPerDay: 3,
    flagStrikesUntilBan: 3,
    banDuration7Day: 7,
    banDuration30Day: 30,
    gpsToleranceMeters: 500,
    minVerificationScore: 70,
    enableAutoVerification: true,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    platformFeePercentage: 2.5
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: typeof value === 'string' && !isNaN(value) && field !== 'enableAutoVerification' && field !== 'enableEmailNotifications' && field !== 'enableSMSNotifications'
        ? parseFloat(value)
        : value
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
      setSaved(true);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <Settings className="h-8 w-8" />
            System Settings
          </h1>
          <p className="text-gray-600">Configure platform parameters and verification rules</p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b space-y-8">
            {/* Verification Settings */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Verification Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Timeout (hours)
                  </label>
                  <input
                    type="number"
                    value={settings.verificationTimeout}
                    onChange={(e) => handleChange('verificationTimeout', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">How long before verification request expires</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Verification Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.minVerificationScore}
                    onChange={(e) => handleChange('minVerificationScore', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Score required for auto-approval</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GPS Tolerance (meters)
                  </label>
                  <input
                    type="number"
                    value={settings.gpsToleranceMeters}
                    onChange={(e) => handleChange('gpsToleranceMeters', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Allow deviation from authority GPS</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enableAutoVerification}
                      onChange={(e) => handleChange('enableAutoVerification', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Auto-Verification</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Automatically verify listings meeting score threshold</p>
                </div>
              </div>
            </div>

            {/* Flag Abuse Prevention */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Flag Abuse Prevention</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Flags Per Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.maxFlagsPerDay}
                    onChange={(e) => handleChange('maxFlagsPerDay', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Daily flag submission limit per user</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strikes Until Ban
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.flagStrikesUntilBan}
                    onChange={(e) => handleChange('flagStrikesUntilBan', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Strikes before permanent suspension</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    7-Day Ban Duration (days)
                  </label>
                  <input
                    type="number"
                    value={settings.banDuration7Day}
                    onChange={(e) => handleChange('banDuration7Day', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Duration for first strike ban</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    30-Day Ban Duration (days)
                  </label>
                  <input
                    type="number"
                    value={settings.banDuration30Day}
                    onChange={(e) => handleChange('banDuration30Day', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Duration for second strike ban</p>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Notification Settings</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableEmailNotifications}
                    onChange={(e) => handleChange('enableEmailNotifications', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableSMSNotifications}
                    onChange={(e) => handleChange('enableSMSNotifications', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                </label>
              </div>
            </div>

            {/* Platform Settings */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Platform Settings</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Fee (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.platformFeePercentage}
                  onChange={(e) => handleChange('platformFeePercentage', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 md:w-1/3"
                />
                <p className="text-xs text-gray-500 mt-1">Commission on successful transactions</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
            {saved && (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="h-5 w-5" />
                All changes saved
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="ml-auto flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              <Save className="h-5 w-5" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Configuration Tip</p>
            <p>These settings apply to the entire platform. Changes take effect immediately and affect all users and listings.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
