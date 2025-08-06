import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  AlertTriangle,  
  Mail,
  Edit,
  Check,
  ChevronDown,
  Calendar,
  Clock,
  Shield,
  Phone,
  Globe,
  MapPin,
  Smartphone,
} from 'lucide-react';
import { updateUserProfile, ensureUserProfile } from '../../auth/services/authService';

const ProfileSettings = ({ user, colors }) => {
  // A helper function to build input classes
  const inputStyle = `w-full px-3 py-2 bg-${colors.background} border border-${colors.border} rounded-lg focus:ring-2 focus:ring-${colors.primary} focus:border-${colors.primary} transition-all duration-200`;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    photoURL: '',
    uid: ''
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load user data from localStorage and auth context
  useEffect(() => {
    const storedUserData = localStorage.getItem('user');
    let initialData = {
      displayName: '',
      email: '',
      photoURL: '',
      uid: '',
      age: '',
      gender: '',
      location: '',
    };

    if (storedUserData) {
      const data = JSON.parse(storedUserData);
      initialData = { ...initialData, ...data };
    }

    if (user) {
      initialData = {
        ...initialData,
        displayName: user.displayName || initialData.displayName,
        email: user.email || initialData.email,
        photoURL: user.photoURL || initialData.photoURL,
        uid: user.uid || initialData.uid,
      };
    }
    setFormData(initialData);
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Ensure user profile exists before updating
      if (user && user.uid) {
        await ensureUserProfile(user);
      }
      
      // Prepare data for saving - only include fields that should be updated
      const profileUpdates = {
        displayName: formData.displayName,
        age: formData.age,
        gender: formData.gender,
        location: formData.location,
        photoURL: formData.photoURL
      };

      // Remove empty fields
      Object.keys(profileUpdates).forEach(key => {
        if (profileUpdates[key] === '' || profileUpdates[key] === null || profileUpdates[key] === undefined) {
          delete profileUpdates[key];
        }
      });

      // Update profile in database
      await updateUserProfile(profileUpdates);
      
      // Update localStorage with new data
      const storedUserData = localStorage.getItem('user');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        const updatedData = { ...userData, ...profileUpdates };
        localStorage.setItem('user', JSON.stringify(updatedData));
      }
      
      setIsSaved(true);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInitials = (name) => {
    if (!name || name.trim() === '') return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (isDarkMode = false) => {
    const name = getUserName();
    if (!name) return isDarkMode ? '#374151' : '#e5e7eb'; // gray-700 for dark, gray-200 for light
    
    // Generate a color based on the user's name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to HSL color for better visual variety
    const hue = Math.abs(hash) % 360;
    // Return appropriate color for light or dark mode
    return isDarkMode ? `hsl(${hue}, 60%, 35%)` : `hsl(${hue}, 70%, 85%)`;
  };

  const getUserName = () => formData.displayName || '';
  const getUserEmail = () => formData.email || '';
  const getUserPhoto = () => formData.photoURL || formData.photoUrl || '';
  const isUserVerified = () => user?.emailVerified || false;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 px-4 md:px-10 py-6">
      {/* Section 1: Personal Information */}
      <section id="personal-info">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-xl font-bold text-${colors.textPrimary}`}>Personal Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-all`}
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
        <div className={`bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-sm`}>
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={`block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1`}>Full Name</label>
                  <input type="text" name="displayName" value={formData.displayName} onChange={handleInputChange} className={inputStyle} />
                </div>
                <div>
                  <label className={`block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1`}>Email Address</label>
                  <input type="email" name="email" value={formData.email} disabled className={`${inputStyle} bg-gray-100 dark:bg-gray-700/50`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1`}>Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleInputChange} className={inputStyle} />
                </div>
                <div>
                  <label className={`block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1`}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className={inputStyle}>
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1`}>Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} className={inputStyle} />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1`}>Profile Picture URL</label>
                  <input type="text" name="photoURL" value={formData.photoURL} onChange={handleInputChange} className={inputStyle} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className={`px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors`}>Cancel</button>
                <button type="submit" disabled={isLoading} className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50`}>{isLoading ? 'Saving...' : 'Update Profile'}</button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-md border-2 border-white dark:border-gray-700`} style={{ backgroundColor: getAvatarColor(colors.background === 'gray-900') }}>
                {getUserPhoto() ? <img src={getUserPhoto()} alt={getUserName()} className="w-full h-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-white shadow-md font-bold text-2xl" style={{ backgroundColor: getAvatarColor() }}>{getUserInitials(getUserName())}</div>}
              </div>
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-1 text-gray-400" />
                  <div>
                    <p className={`text-sm font-medium text-gray-500 dark:text-gray-400`}>Full Name</p>
                    <p className={`font-semibold`}>{getUserName() || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-1 text-gray-400" />
                  <div>
                    <p className={`text-sm font-medium text-gray-500 dark:text-gray-400`}>Email</p>
                    <p className={`font-semibold`}>{getUserEmail() || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-1 text-gray-400" />
                  <div>
                    <p className={`text-sm font-medium text-gray-500 dark:text-gray-400`}>Age</p>
                    <p className={`font-semibold`}>{formData.age || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-1 text-gray-400" />
                  <div>
                    <p className={`text-sm font-medium text-gray-500 dark:text-gray-400`}>Gender</p>
                    <p className={`font-semibold`}>{formData.gender || 'N/A'}</p>
                  </div>
                </div>
                <div className="sm:col-span-2 flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-1 text-gray-400" />
                  <div>
                    <p className={`text-sm font-medium text-gray-500 dark:text-gray-400`}>Location</p>
                    <p className={`font-semibold`}>{formData.location || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Account Security */}
      <section id="account-security">
        <h2 className={`text-xl font-bold text-${colors.textPrimary} mb-4 pb-2 border-b border-gray-200 dark:border-gray-700`}>Account Security</h2>
        <div className={`bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-sm`}>
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="flex justify-between items-center w-full font-semibold">
            <span>Change Password</span>
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showPasswordChange ? 'rotate-180' : ''}`} />
          </button>
          {showPasswordChange && (
            <form className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputStyle} />
              <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputStyle} />
              <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputStyle} />
              <div className="flex justify-end">
                <button type="submit" className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors`}>Update Password</button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Section 3: Danger Zone */}
      <section id="danger-zone">
         <h2 className={`text-xl font-bold text-red-600 dark:text-red-500 mb-4 pb-2 border-b border-red-200 dark:border-red-800`}>Danger Zone</h2>
        <div className={`bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-lg flex flex-col md:flex-row justify-between items-center gap-4`}>
          <div>
            <h3 className={`font-bold text-red-800 dark:text-red-300`}>Delete Your Account</h3>
            <p className={`text-sm text-red-700 dark:text-red-400 mt-1`}>Once you delete your account, this action is permanent and cannot be undone.</p>
          </div>
          <button onClick={() => setShowDeleteModal(true)} className={`px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex-shrink-0`}>
            Delete Account
          </button>
        </div>
      </section>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Confirm Deletion</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Are you sure you want to delete your account? This action is irreversible and all your data will be permanently lost.
              </p>
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Cancel
              </button>
              <button 
                // Add deletion logic to onClick here
                className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
