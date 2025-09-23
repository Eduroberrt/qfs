"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authService, { User } from '@/services/auth';
import toast from 'react-hot-toast';
import UserLayout from '@/components/Layout/UserLayout';

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>('not_submitted');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userProfile = await authService.getProfile();
        setUser(userProfile);

        // Fetch real-time KYC status separately like dashboard does
        try {
          const kycData = await authService.getKYCStatus();
          setKycStatus(kycData.status || 'not_submitted');
        } catch (kycError) {
          console.error('Failed to fetch KYC status:', kycError);
          // Default to not_submitted if KYC API fails
          setKycStatus('not_submitted');
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkmode flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <UserLayout>
      <div className="container mx-auto px-6 py-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Details Card */}
          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Basic Details</h2>
            
            {/* Profile Picture */}
            <div className="flex items-center mb-6">
              <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center mr-4">
                <span className="text-darkmode font-bold text-2xl">{user.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{user.name}</h3>
                <p className="text-muted">Member since {new Date().getFullYear()}</p>
              </div>
            </div>

            {/* User Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-muted text-sm mb-1">Full Name</label>
                <div className="bg-darkmode border border-section border-opacity-20 rounded-lg p-3">
                  <span className="text-white">{user.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-muted text-sm mb-1">Email Address</label>
                <div className="bg-darkmode border border-section border-opacity-20 rounded-lg p-3">
                  <span className="text-white">{user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-muted text-sm mb-1">User ID</label>
                <div className="bg-darkmode border border-section border-opacity-20 rounded-lg p-3">
                  <span className="text-white">{user.id}</span>
                </div>
              </div>

              <div>
                <label className="block text-muted text-sm mb-1">Account Status</label>
                <div className="bg-darkmode border border-section border-opacity-20 rounded-lg p-3">
                  <span className="text-green-500">Active</span>
                </div>
              </div>

              <div>
                <label className="block text-muted text-sm mb-1">Verification Status</label>
                <div className="bg-darkmode border border-section border-opacity-20 rounded-lg p-3 flex items-center justify-between">
                  {kycStatus === 'verified' ? (
                    <span className="text-green-500 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  ) : kycStatus === 'pending' ? (
                    <>
                      <span className="text-yellow-500 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Under Review
                      </span>
                      <button 
                        onClick={() => router.push('/verify')}
                        className="bg-gray-500 text-white px-3 py-1 rounded text-sm font-medium cursor-not-allowed opacity-50"
                        disabled
                      >
                        Pending
                      </button>
                    </>
                  ) : kycStatus === 'rejected' ? (
                    <>
                      <span className="text-red-500 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Rejected
                      </span>
                      <button 
                        onClick={() => router.push('/verify')}
                        className="bg-primary hover:bg-opacity-80 text-darkmode px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Resubmit
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-red-500 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Not Verified
                      </span>
                      <button 
                        onClick={() => router.push('/verify')}
                        className="bg-primary hover:bg-opacity-80 text-darkmode px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Verify Now
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-muted text-sm mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full bg-darkmode border border-section border-opacity-20 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block text-muted text-sm mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full bg-darkmode border border-section border-opacity-20 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-muted text-sm mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full bg-darkmode border border-section border-opacity-20 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>

              {/* Password Requirements */}
              <div className="bg-darkmode border border-section border-opacity-20 rounded-lg p-3">
                <p className="text-muted text-sm mb-2">Password requirements:</p>
                <ul className="text-muted text-xs space-y-1">
                  <li>• At least 6 characters long</li>
                  <li>• Must contain uppercase and lowercase letters</li>
                  <li>• Must contain at least one number</li>
                  <li>• Must contain at least one special character</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-primary hover:bg-opacity-80 disabled:bg-opacity-50 text-darkmode py-3 rounded-lg font-medium transition-colors"
              >
                {isChangingPassword ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>

            {/* Security Tips */}
            <div className="mt-6 bg-darkmode border border-section border-opacity-20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Security Tips</h4>
              <ul className="text-muted text-sm space-y-1">
                <li>• Never share your password with anyone</li>
                <li>• Use a unique password for your QFS Ledger account</li>
                <li>• Enable two-factor authentication for extra security</li>
                <li>• Log out when using shared devices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default ProfilePage;