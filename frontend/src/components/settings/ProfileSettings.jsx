import { useState, useEffect } from 'react';
import { LogOut, User, Mail, Lock, Check, Edit } from 'lucide-react';

const ProfileSettings = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    photoURL: user?.photoURL || ''
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name || name.trim() === '') return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  
  // Use a consistent background color for the avatar
  const getAvatarColor = () => 'bg-background-tertiary border border-border/50';

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || ''
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Here you would typically make an API call to update the user's profile
      // For now, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSaved(true);
      setIsEditing(false);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Profile</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-1 text-primary hover:text-primary/80 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>
      
      <div className="space-y-6">
        <div className="flex items-start space-x-6">
          <div className="relative group">
            <div 
              className={`w-20 h-20 rounded-full ${getAvatarColor()} flex items-center justify-center overflow-hidden shadow-sm`}
            >
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <span className={`text-2xl font-bold text-text-secondary ${user?.photoURL ? 'hidden' : 'flex'}`}>
                {getUserInitials(user?.displayName || 'User')}
              </span>
            </div>
            {isEditing && (
              <div className="absolute -bottom-1 -right-1">
                <button 
                  className="bg-primary hover:bg-primary/90 text-white p-1.5 rounded-full shadow-lg transition-all transform hover:scale-110"
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle avatar upload
                  }}
                  title="Change photo"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          
          <div>
            {isEditing ? (
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="text-2xl font-bold bg-background-secondary border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter your name"
              />
            ) : (
              <h3 className="text-2xl font-bold text-text-primary">
                {user?.displayName || 'Anonymous User'}
              </h3>
            )}
            <div className="flex items-center mt-1 text-text-secondary">
              <Mail className="w-4 h-4 mr-1.5" />
              <span>{user?.email || 'No email provided'}</span>
            </div>
            {user?.emailVerified && (
              <span className="inline-flex items-center mt-1 text-xs text-green-500">
                <Check className="w-3 h-3 mr-1" /> Verified
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Full Name
                {isEditing && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-background-secondary/80 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-text-primary placeholder-text-tertiary/60 transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                  {formData.displayName && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-4 py-2.5 bg-background-secondary/50 rounded-xl text-text-primary font-medium">
                  {user?.displayName || 'Not set'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email Address
              </label>
              <div className="px-4 py-2.5 bg-background-secondary/50 rounded-xl flex items-center">
                <Mail className="w-4 h-4 text-text-tertiary/80 mr-2 flex-shrink-0" />
                <span className="text-text-primary font-medium">{user?.email || 'No email'}</span>
                {user?.emailVerified ? (
                  <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center flex-shrink-0">
                    <Check className="w-3 h-3 mr-1" /> Verified
                  </span>
                ) : (
                  <button 
                    type="button" 
                    className="ml-2 text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-2 py-0.5 rounded-full flex items-center transition-colors"
                    onClick={() => {}}
                  >
                    Unverified
                  </button>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="space-y-6 pt-6">
              <div className="border-t border-border/50 pt-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Change Password</h3>
                <p className="text-sm text-text-secondary/80 mb-4">
                  Create a strong password to secure your account
                </p>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Current Password
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background-secondary/80 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-text-primary placeholder-text-tertiary/60 transition-colors"
                      placeholder="Enter current password"
                      required
                    />
                    {currentPassword && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    New Password
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background-secondary/80 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-text-primary placeholder-text-tertiary/60 transition-colors"
                      placeholder="Enter new password"
                      required
                    />
                    {newPassword && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Confirm New Password
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                          <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background-secondary/80 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-text-primary placeholder-text-tertiary/60 transition-colors"
                      placeholder="Confirm new password"
                      required
                    />
                    {confirmPassword && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-6">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-background-secondary/80 transition-colors text-text-primary hover:text-text-primary/90"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center min-w-[140px] shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </form>

        {isSaved && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm flex items-center">
            <Check className="w-4 h-4 mr-2" />
            <span>Profile updated successfully</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
