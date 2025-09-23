"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authService, { User } from '@/services/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>('not_submitted');
  const [walletBalances, setWalletBalances] = useState<any>(null);
  const router = useRouter();

  // Popular crypto data
  const cryptoAssets = [
    { name: 'Bitcoin', symbol: 'BTC', price: '$67,234.56', change: '+2.34%', changeColor: 'text-green-500', key: 'bitcoin' },
    { name: 'Ethereum', symbol: 'ETH', price: '$3,456.78', change: '+1.87%', changeColor: 'text-green-500', key: 'ethereum' },
    { name: 'Ripple', symbol: 'XRP', price: '$0.5234', change: '+1.23%', changeColor: 'text-green-500', key: 'ripple' },
    { name: 'Stellar', symbol: 'XLM', price: '$0.1123', change: '+0.89%', changeColor: 'text-green-500', key: 'stellar' },
    { name: 'Tether', symbol: 'USDT', price: '$1.00', change: '+0.01%', changeColor: 'text-green-500', key: 'usdt' },
    { name: 'BNB', symbol: 'BNB', price: '$543.21', change: '+1.45%', changeColor: 'text-green-500', key: 'bnb' },
    { name: 'BNB Tiger', symbol: 'BNBT', price: '$0.0045', change: '+15.67%', changeColor: 'text-green-500', key: 'bnb_tiger' },
  ];

  // Fetch wallet balances
  const fetchWalletBalances = async () => {
    try {
      const response = await authService.authenticatedRequest('http://localhost:8000/api/wallet/balance/');

      if (response.ok) {
        const data = await response.json();
        setWalletBalances(data.wallet);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balances:', error);
    }
  };

  // Get user balance for a specific crypto
  const getUserBalance = (cryptoKey: string) => {
    if (!walletBalances) return '0.00';
    const balanceKey = `${cryptoKey}_balance`;
    return walletBalances[balanceKey] || '0.00';
  };

  // Calculate total balance from all cryptocurrencies
  const getTotalBalance = () => {
    if (!walletBalances) return '0.00';
    
    let total = 0;
    cryptoAssets.forEach(asset => {
      const balance = parseFloat(getUserBalance(asset.key));
      // For this example, we'll use simplified conversion rates
      // In a real application, you'd fetch current market prices
      const conversionRates: { [key: string]: number } = {
        bitcoin: 67234.56,
        ethereum: 3456.78,
        ripple: 0.5234,
        stellar: 0.1123,
        usdt: 1.00,
        bnb: 543.21,
        bnb_tiger: 0.0045
      };
      
      const usdValue = balance * (conversionRates[asset.key] || 0);
      total += usdValue;
    });
    
    return total.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Debug: Check authentication status
        const isAuth = authService.isAuthenticated();
        console.log('Is authenticated:', isAuth);
        
        if (!isAuth) {
          console.log('Not authenticated - redirecting to home');
          router.push('/');
          return;
        }

        // Debug: Check if token exists
        const token = authService.getAccessToken();
        console.log('Access token exists:', !!token);
        console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');

        const userProfile = await authService.getProfile();
        console.log('User profile loaded successfully:', userProfile);
        setUser(userProfile);

        // Fetch wallet balances
        await fetchWalletBalances();

        // Fetch KYC status
        try {
          const kycData = await authService.getKYCStatus();
          setKycStatus(kycData.status || 'not_submitted');
        } catch (kycError) {
          console.error('Failed to fetch KYC status:', kycError);
          // Default to not_submitted if KYC API fails
          setKycStatus('not_submitted');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        
        // Check if it's a token issue
        const token = authService.getAccessToken();
        if (!token) {
          console.log('No access token found - redirecting to login');
          toast.error('Please log in to access the dashboard.');
          router.push('/auth/login');
        } else {
          console.log('Token exists but profile fetch failed');
          toast.error('Failed to load user profile. Please try refreshing the page or log in again.');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    toast.success('Logged out successfully');
    router.push('/');
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
    <div className="min-h-screen bg-darkmode flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-section bg-opacity-20 border-b border-section border-opacity-20 px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="text-xl font-bold text-white">QFS Vault Ledger</div>
          
          {/* Right side - Notifications & Profile */}
          <div className="flex items-center gap-4">
            {/* Admin Panel Link (for admin users) */}
            {(user?.email === 'admin@example.com' || user?.email === 'admin@admin.com' || user?.email === 'admin@qfsvaultledger.org') && (
              <Link 
                href="/admin/kyc" 
                className="text-primary hover:text-white transition-colors flex items-center gap-2 px-3 py-1 border border-primary rounded-md hover:bg-primary hover:text-darkmode"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </Link>
            )}
            
            {/* Bell Icon with notification count */}
            <div className="relative">
              <svg className="w-6 h-6 text-white cursor-pointer hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">0</span>
            </div>
            
            {/* Profile Image */}
            <Link href="/profile" className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer">
              <span className="text-darkmode font-semibold text-sm">{user.name?.charAt(0).toUpperCase()}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Balance Card */}
      <div className="px-6 py-4">
        <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Total Balance</h2>
          <p className="text-3xl font-bold text-primary mb-4">${getTotalBalance()}</p>
          <div className="flex items-center gap-3">
            {kycStatus === 'verified' ? (
              <span className="text-green-500 font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verified
              </span>
            ) : kycStatus === 'pending' ? (
              <span className="text-yellow-500 font-medium flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verification Pending
              </span>
            ) : kycStatus === 'rejected' ? (
              <>
                <span className="text-red-500 font-medium flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verification Failed
                </span>
                <Link href="/verify" className="bg-primary hover:bg-opacity-80 text-darkmode px-4 py-2 rounded-lg font-medium transition-colors">
                  Try Again
                </Link>
              </>
            ) : (
              <>
                <span className="text-red-500 font-medium">Not Verified</span>
                <Link href="/verify" className="bg-primary hover:bg-opacity-80 text-darkmode px-4 py-2 rounded-lg font-medium transition-colors">
                  Verify Now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Border */}
      <div className="px-6">
        <hr className="border-section border-opacity-20" />
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-5 gap-2 md:gap-4">
          {/* Buy Button */}
          <button 
            onClick={() => router.push('/support')}
            className="flex flex-col items-center gap-2 p-2 md:p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-white text-xs md:text-sm font-medium whitespace-nowrap">Buy</span>
          </button>

          {/* Send Button */}
          <button 
            onClick={() => router.push('/send')}
            className="flex flex-col items-center gap-2 p-2 md:p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="text-white text-xs md:text-sm font-medium whitespace-nowrap">Send</span>
          </button>

          {/* Receive Button */}
          <button 
            onClick={() => router.push('/receive')}
            className="flex flex-col items-center gap-2 p-2 md:p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-white text-xs md:text-sm font-medium whitespace-nowrap">Receive</span>
          </button>

          {/* Swap Button */}
          <button 
            onClick={() => router.push('/support')}
            className="flex flex-col items-center gap-2 p-2 md:p-4 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-white text-xs md:text-sm font-medium whitespace-nowrap">Swap</span>
          </button>

          {/* Link Wallet Button */}
          <button 
            onClick={() => router.push('/support')}
            className="flex flex-col items-center gap-2 p-2 md:p-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-white text-xs md:text-sm font-medium whitespace-nowrap">Link</span>
          </button>
        </div>
      </div>

      {/* Redemption Center Appointments Section */}
      <div className="px-6 py-6">
        <h3 className="text-xl font-bold text-white mb-6">Redemption Center Appointments</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* MedBed Appointment */}
          <button 
            onClick={() => router.push('/support')}
            className="flex flex-col items-center gap-3 p-4 bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg hover:bg-opacity-20 transition-colors"
          >
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-white text-sm font-medium text-center">MedBed Appointment</span>
          </button>

          {/* Humanitarian Projects */}
          <button 
            onClick={() => router.push('/support')}
            className="flex flex-col items-center gap-3 p-4 bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg hover:bg-opacity-20 transition-colors"
          >
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-white text-sm font-medium text-center">Humanitarian Projects</span>
          </button>

          {/* QFS Gold Card */}
          <button 
            onClick={() => router.push('/support')}
            className="flex flex-col items-center gap-3 p-4 bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg hover:bg-opacity-20 transition-colors"
          >
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-white text-sm font-medium text-center">QFS Gold Card</span>
          </button>

          {/* Q-Phones */}
          <button 
            onClick={() => router.push('/support')}
            className="flex flex-col items-center gap-3 p-4 bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg hover:bg-opacity-20 transition-colors"
          >
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-white text-sm font-medium text-center">Q-Phones</span>
          </button>
        </div>
      </div>

      {/* Main Dashboard Body - Popular Crypto Assets */}
      <div className="flex-1 px-6 pb-20">
        <h3 className="text-xl font-bold text-white mb-6">Popular Crypto Assets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cryptoAssets.map((asset, index) => (
            <div key={index} className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-4 hover:bg-opacity-20 transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-white font-semibold">{asset.name}</h4>
                  <p className="text-muted text-sm">{asset.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{asset.price}</p>
                  <p className={`text-sm ${asset.changeColor}`}>{asset.change}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted text-sm">Your Balance:</span>
                <span className="text-primary font-semibold">${getUserBalance(asset.key)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.random() * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Fixed to bottom */}
      <footer className="fixed bottom-0 left-0 right-0 bg-section bg-opacity-20 border-t border-section border-opacity-20 px-6 py-4 backdrop-blur-sm">
        <div className="flex justify-around md:justify-between items-center max-w-md md:max-w-full mx-auto md:mx-6">
          {/* Settings */}
          <Link href="/profile" className="flex flex-col items-center gap-1 text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs">Settings</span>
          </Link>

          {/* Notifications */}
          <button className="flex flex-col items-center gap-1 text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="text-xs">Notifications</span>
          </button>

          {/* Wallet */}
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-xs">Wallet</span>
          </Link>

          {/* Support */}
          <button 
            onClick={() => router.push('/support')}
            className="flex flex-col items-center gap-1 text-muted hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">Support</span>
          </button>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 text-muted hover:text-red-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;