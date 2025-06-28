import { useState } from 'react';
import { Download, Trash2, AlertCircle, Check, Shield, Database, FileText, AlertTriangle } from 'lucide-react';

const PrivacyControls = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('data');

  const handleDownloadData = () => {
    setIsDownloading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Downloading user data...');
      // In a real app, this would trigger a file download
      setIsDownloading(false);
      setDownloadComplete(true);
      
      // Reset download complete message after 3 seconds
      setTimeout(() => setDownloadComplete(false), 3000);
    }, 1500);
  };

  const handleDeleteData = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Deleting user data...');
      // In a real app, this would delete the user's data
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      // Show success message or redirect
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-text-primary">Privacy & Data</h2>
        <p className="text-text-secondary">Manage your data and privacy settings</p>
      </div>
      
      <div className="space-y-8">
        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('data')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'data'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Data Management</span>
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'permissions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Permissions</span>
            </button>
          </nav>
        </div>

        {activeTab === 'data' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-500/5 to-primary/5 p-6 rounded-2xl border border-border/50">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1.5">Your Data, Your Control</h3>
                  <p className="text-text-secondary">
                    You have full control over your data. Download a copy for your records or request deletion at any time.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-background-secondary/50 p-6 rounded-2xl border border-border/50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-semibold text-text-primary mb-1">Download Your Data</h3>
                    <p className="text-text-secondary text-sm">
                      Export all your data in a portable format (JSON, CSV, or PDF)
                    </p>
                    {downloadComplete && (
                      <div className="mt-3 inline-flex items-center text-sm font-medium text-emerald-600 bg-emerald-50/50 px-3 py-1.5 rounded-lg">
                        <Check className="w-4 h-4 mr-1.5" />
                        Your download will start shortly
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadData}
                      disabled={isDownloading || downloadComplete}
                      className="inline-flex items-center px-5 py-2.5 bg-background-secondary hover:bg-background-tertiary/50 border border-border text-text-primary rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDownloading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Preparing...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download Data
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-background-secondary/50 p-6 rounded-2xl border border-border/50">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-semibold text-text-primary mb-1">Delete Account Data</h3>
                    <p className="text-text-secondary text-sm">
                      Permanently delete all your data from our servers. This action cannot be undone.
                    </p>
                    {showDeleteConfirm && (
                      <div className="mt-3 p-3 bg-red-50/50 border border-red-100 rounded-lg">
                        <div className="flex">
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Are you sure?</p>
                            <p className="text-sm text-red-700">This will permanently delete all your data. This action cannot be undone.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleDeleteData}
                      disabled={isDeleting}
                      className={`inline-flex items-center px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        showDeleteConfirm
                          ? 'bg-red-600 hover:bg-red-700 text-white border border-red-700'
                          : 'bg-background-secondary hover:bg-background-tertiary/50 border border-red-500/50 text-red-500 hover:text-red-600 hover:border-red-600/50'
                      }`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleting 
                        ? 'Deleting...' 
                        : showDeleteConfirm 
                          ? 'Confirm Deletion' 
                          : 'Delete All Data'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="space-y-6">
            <div className="bg-background-secondary/50 p-6 rounded-2xl border border-border/50">
              <h3 className="text-lg font-semibold text-text-primary mb-4">App Permissions</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background-tertiary/30 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100/50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">Notifications</h4>
                      <p className="text-sm text-text-secondary">Allow push notifications</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-background-tertiary/30 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100/50 rounded-lg">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">Payment Information</h4>
                      <p className="text-sm text-text-secondary">Save payment details for faster checkout</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-background-tertiary/30 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100/50 rounded-lg">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">Two-Factor Authentication</h4>
                      <p className="text-sm text-text-secondary">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/5 to-primary/5 p-6 rounded-2xl border border-border/50">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1.5">Your Privacy Matters</h3>
                  <p className="text-text-secondary mb-4">
                    We're committed to protecting your personal information and giving you control over your data.
                  </p>
                  <a
                    href="#"
                    className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    View our Privacy Policy
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyControls;
