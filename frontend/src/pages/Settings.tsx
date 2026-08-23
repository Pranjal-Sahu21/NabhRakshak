import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as React.FC<any>;
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  CogIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const { user, updateProfile, logout } = useAuth();
  const { theme, toggleTheme, accentColor, setAccentColor, animations, setAnimations } = useTheme() as any;
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    alerts: true,
    reports: true,
    maintenance: false
  });
  
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    units: 'metric',
    autoRefresh: true,
    refreshInterval: 30,
    defaultView: '3d',
    showGrid: true,
    showLabels: true,
    trackingHistory: 7
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: 30,
    loginAlerts: true,
    deviceTracking: true
  });

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    organization: user?.organization || '',
    role: user?.role || '',
    phone: (user as any)?.phone || '',
    bio: (user as any)?.bio || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'preferences', name: 'Preferences', icon: CogIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'data', name: 'Data & Privacy', icon: GlobeAltIcon }
  ];

  const accentColors = [
    { name: 'Blue', value: 'blue', color: '#3B82F6' },
    { name: 'Purple', value: 'purple', color: '#8B5CF6' },
    { name: 'Green', value: 'green', color: '#10B981' },
    { name: 'Red', value: 'red', color: '#EF4444' },
    { name: 'Yellow', value: 'yellow', color: '#F59E0B' },
    { name: 'Pink', value: 'pink', color: '#EC4899' },
    { name: 'Indigo', value: 'indigo', color: '#6366F1' },
    { name: 'Teal', value: 'teal', color: '#14B8A6' }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ru', name: 'Русский' }
  ];

  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'EST', label: 'EST (Eastern Standard Time)' },
    { value: 'PST', label: 'PST (Pacific Standard Time)' },
    { value: 'GMT', label: 'GMT (Greenwich Mean Time)' },
    { value: 'CET', label: 'CET (Central European Time)' },
    { value: 'JST', label: 'JST (Japan Standard Time)' },
    { value: 'IST', label: 'IST (India Standard Time)' }
  ];

  const saveProfile = async () => {
    setIsLoading(true);
    try {
      await updateProfile(profile);
      // Show success message
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      alert('New passwords do not match');
      return;
    }
    
    setIsLoading(true);
    try {
      // Mock password change
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPasswordForm({ current: '', new: '', confirm: '' });
      setShowPasswordModal(false);
      // Show success message
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    try {
      // Mock account deletion
      await new Promise(resolve => setTimeout(resolve, 2000));
      logout();
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    setIsLoading(true);
    try {
      // Mock data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Trigger download
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const SettingCard = ({ title, description, children }) => (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-normal text-white">{title}</h3>
        {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
      </div>
      {children}
    </MotionDiv>
  );

  const Toggle = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-white font-medium">{label}</div>
        {description && <div className="text-gray-400 text-sm">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-neon-blue' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      <SettingCard title="Personal Information" description="Update your profile details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Organization</label>
            <input
              type="text"
              value={profile.organization}
              onChange={(e) => setProfile(prev => ({ ...prev, organization: e.target.value }))}
              className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
            <input
              type="text"
              value={profile.role}
              onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
              className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white h-24"
            placeholder="Tell us about yourself..."
          />
        </div>
        <div className="mt-6">
          <button
            onClick={saveProfile}
            disabled={isLoading}
            className="neon-button px-6 py-2 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </SettingCard>

      <SettingCard title="Account Actions" description="Manage your account">
        <div className="space-y-4">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center space-x-2 glass-button px-4 py-2"
          >
            <KeyIcon className="w-4 h-4" />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center space-x-2 glass-button px-4 py-2 text-red-400 border-red-400/30"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </SettingCard>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <SettingCard title="Notification Preferences" description="Choose how you want to be notified">
        <div className="space-y-4">
          <Toggle
            enabled={notifications.email}
            onChange={(value) => setNotifications(prev => ({ ...prev, email: value }))}
            label="Email Notifications"
            description="Receive notifications via email"
          />
          <Toggle
            enabled={notifications.push}
            onChange={(value) => setNotifications(prev => ({ ...prev, push: value }))}
            label="Push Notifications"
            description="Receive browser push notifications"
          />
          <Toggle
            enabled={notifications.sms}
            onChange={(value) => setNotifications(prev => ({ ...prev, sms: value }))}
            label="SMS Notifications"
            description="Receive notifications via text message"
          />
          <Toggle
            enabled={notifications.alerts}
            onChange={(value) => setNotifications(prev => ({ ...prev, alerts: value }))}
            label="Alert Notifications"
            description="Critical alerts and warnings"
          />
          <Toggle
            enabled={notifications.reports}
            onChange={(value) => setNotifications(prev => ({ ...prev, reports: value }))}
            label="Report Notifications"
            description="Weekly and monthly reports"
          />
          <Toggle
            enabled={notifications.maintenance}
            onChange={(value) => setNotifications(prev => ({ ...prev, maintenance: value }))}
            label="Maintenance Notifications"
            description="System maintenance and updates"
          />
        </div>
      </SettingCard>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <SettingCard title="General Preferences" description="Customize your experience">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
              className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Date Format</label>
            <select
              value={preferences.dateFormat}
              onChange={(e) => setPreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
              className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Units</label>
            <select
              value={preferences.units}
              onChange={(e) => setPreferences(prev => ({ ...prev, units: e.target.value }))}
              className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="metric">Metric</option>
              <option value="imperial">Imperial</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <Toggle
            enabled={preferences.autoRefresh}
            onChange={(value) => setPreferences(prev => ({ ...prev, autoRefresh: value }))}
            label="Auto Refresh"
            description="Automatically refresh data"
          />
          
          {preferences.autoRefresh && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                value={preferences.refreshInterval}
                onChange={(e) => setPreferences(prev => ({ ...prev, refreshInterval: Number(e.target.value) }))}
                className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
                min="5"
                max="300"
              />
            </div>
          )}
        </div>
      </SettingCard>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <SettingCard title="Theme" description="Customize the look and feel">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Color Theme</label>
            <div className="flex space-x-3">
              <button
                onClick={() => toggleTheme()}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  theme === 'dark' ? 'border-neon-blue bg-neon-blue/20' : 'border-gray-600'
                }`}
              >
                <ComputerDesktopIcon className="w-4 h-4" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => toggleTheme()}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  theme === 'light' ? 'border-neon-blue bg-neon-blue/20' : 'border-gray-600'
                }`}
              >
                <DevicePhoneMobileIcon className="w-4 h-4" />
                <span>Light</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Accent Color</label>
            <div className="grid grid-cols-4 gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setAccentColor(color.value)}
                  className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                    accentColor === color.value ? 'border-white' : 'border-gray-600'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color.color }}
                  />
                  <span className="text-sm">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Toggle
            enabled={animations}
            onChange={setAnimations}
            label="Animations"
            description="Enable smooth animations and transitions"
          />
        </div>
      </SettingCard>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <SettingCard title="Security Settings" description="Protect your account">
        <div className="space-y-4">
          <Toggle
            enabled={security.twoFactor}
            onChange={(value) => setSecurity(prev => ({ ...prev, twoFactor: value }))}
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
          />
          <Toggle
            enabled={security.loginAlerts}
            onChange={(value) => setSecurity(prev => ({ ...prev, loginAlerts: value }))}
            label="Login Alerts"
            description="Get notified when someone logs into your account"
          />
          <Toggle
            enabled={security.deviceTracking}
            onChange={(value) => setSecurity(prev => ({ ...prev, deviceTracking: value }))}
            label="Device Tracking"
            description="Track devices that access your account"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={security.sessionTimeout}
              onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
              className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
              min="5"
              max="480"
            />
          </div>
        </div>
      </SettingCard>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <SettingCard title="Data Management" description="Control your data and privacy">
        <div className="space-y-4">
          <button
            onClick={exportData}
            disabled={isLoading}
            className="flex items-center space-x-2 glass-button px-4 py-2"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span>{isLoading ? 'Exporting...' : 'Export My Data'}</span>
          </button>
          
          <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-yellow-400 font-medium">Data Retention</h4>
                <p className="text-gray-300 text-sm mt-1">
                  Your data is retained for 7 years as required by space monitoring regulations.
                  You can request data deletion after this period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingCard>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <CogIcon className="w-8 h-8 text-neon-blue" />
          <div>
            <h1 className="text-3xl font-normal text-white">Settings</h1>
            <p className="text-gray-400">Manage your account and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                          : 'text-gray-400 hover:text-white hover:bg-dark-lighter/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <MotionDiv
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'notifications' && renderNotificationsTab()}
                {activeTab === 'preferences' && renderPreferencesTab()}
                {activeTab === 'appearance' && renderAppearanceTab()}
                {activeTab === 'security' && renderSecurityTab()}
                {activeTab === 'data' && renderDataTab()}
              </MotionDiv>
            </AnimatePresence>
          </div>
        </div>

        {/* Password Change Modal */}
        <AnimatePresence>
          {showPasswordModal && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowPasswordModal(false)}
            >
              <MotionDiv
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-normal text-white">Change Password</h3>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="text-gray-400 hover:text-white text-xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                      className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                      className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                      className="w-full bg-dark-lighter border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={changePassword}
                    disabled={isLoading || !passwordForm.current || !passwordForm.new || !passwordForm.confirm}
                    className="flex-1 neon-button py-2 disabled:opacity-50"
                  >
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 glass-button py-2"
                  >
                    Cancel
                  </button>
                </div>
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Delete Account Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <MotionDiv
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                  <h3 className="text-xl font-normal text-white">Delete Account</h3>
                </div>

                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={deleteAccount}
                    disabled={isLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Deleting...' : 'Delete Account'}
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 glass-button py-2"
                  >
                    Cancel
                  </button>
                </div>
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Settings;