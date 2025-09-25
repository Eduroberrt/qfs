"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import UserLayout from '@/components/Layout/UserLayout';
import authService from '@/services/auth';

const ReceiveDetailsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCoin, setSelectedCoin] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [copied, setCopied] = useState(false);

  // Coin configurations
  const coinConfig = {
    bitcoin: {
      name: 'Bitcoin',
      symbol: 'BTC',
      icon: '₿',
      network: 'Bitcoin Network',
    },
    ethereum: {
      name: 'Ethereum',
      symbol: 'ETH', 
      icon: 'Ξ',
      network: 'Ethereum Network',
    },
    ripple: {
      name: 'Ripple',
      symbol: 'XRP',
      icon: '◉',
      network: 'Ripple Network',
    },
    stellar: {
      name: 'Stellar',
      symbol: 'XLM',
      icon: '✦',
      network: 'Stellar Network',
    },
    usdt: {
      name: 'Tether',
      symbol: 'USDT',
      icon: '₮',
      network: 'Ethereum Network (ERC-20)',
    },
    bnb: {
      name: 'BNB',
      symbol: 'BNB',
      icon: '🟡',
      network: 'BNB Chain',
    },
    bnb_tiger: {
      name: 'BNB Tiger',
      symbol: 'BNBT',
      icon: '🐅',
      network: 'BNB Chain',
    }
  };

  useEffect(() => {
    const coin = searchParams?.get('coin');
    if (coin && coinConfig[coin as keyof typeof coinConfig]) {
      setSelectedCoin(coin);
      fetchWalletAddress(coin);
    } else {
      toast.error('Invalid coin selected');
      router.push('/receive');
    }
  }, [searchParams, router]);

  const fetchWalletAddress = async (coin: string) => {
    try {
      const token = authService.getAccessToken();
      if (!token) {
        toast.error('Please log in to continue');
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.qfsvaultledger.org'}/api/deposits/wallet-address/?coin_type=${coin}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get wallet address');
      }

      setWalletAddress(data.wallet_address);
    } catch (error) {
      console.error('Failed to get wallet address:', error);
      toast.error('Failed to load wallet address');
      router.push('/receive');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success('Wallet address copied to clipboard!');
      
      // Track wallet copy event
      try {
        const token = authService.getAccessToken();
        if (token) {
          await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.qfsvaultledger.org'}/api/wallet/track-copy/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              coin_type: selectedCoin,
              wallet_address: walletAddress
            })
          });
        }
      } catch (trackingError) {
        // Don't show error to user for tracking failure
        console.error('Failed to track wallet copy:', trackingError);
      }
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500 bg-opacity-10 border-green-500 border-opacity-30';
      case 'pending': return 'bg-yellow-500 bg-opacity-10 border-yellow-500 border-opacity-30';
      case 'failed': return 'bg-red-500 bg-opacity-10 border-red-500 border-opacity-30';
      default: return 'bg-gray-500 bg-opacity-10 border-gray-500 border-opacity-30';
    }
  };

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Receive {selectedCoin && coinConfig[selectedCoin as keyof typeof coinConfig]?.name || 'Cryptocurrency'}
          </h1>
          <p className="text-muted">
            {selectedCoin && coinConfig[selectedCoin as keyof typeof coinConfig]?.network || 'Cryptocurrency Network'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {/* QR Code Card */}
          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6 text-center">QR Code</h2>
            
            {walletAddress ? (
              <div className="w-48 h-48 bg-white p-2 rounded-lg mx-auto mb-4">
                <img 
                  src={`/images/qr-codes/${selectedCoin}.png`}
                  alt={`${coinConfig[selectedCoin as keyof typeof coinConfig]?.name} QR Code`}
                  className="w-full h-full object-contain rounded"
                  onError={(e) => {
                    // Fallback to .jpg if .png doesn't exist
                    const target = e.target as HTMLImageElement;
                    if (target.src.endsWith('.png')) {
                      target.src = `/images/qr-codes/${selectedCoin}.jpg`;
                    } else {
                      // If both fail, show fallback placeholder
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }
                  }}
                />
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs text-center hidden rounded">
                  QR Code for:<br/>{coinConfig[selectedCoin as keyof typeof coinConfig]?.name}<br/>
                  {walletAddress.substring(0, 20)}...
                </div>
              </div>
            ) : (
              <div className="w-48 h-48 bg-darkmode bg-opacity-50 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            
            <p className="text-center text-muted text-sm">
              Scan this QR code with your crypto wallet
            </p>
          </div>

          {/* Wallet Address Card */}
          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Wallet Address</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-3">
                  {selectedCoin && coinConfig[selectedCoin as keyof typeof coinConfig]?.name || 'Cryptocurrency'} Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={walletAddress}
                    readOnly
                    className="w-full p-3 bg-darkmode border border-section border-opacity-30 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={walletAddress ? "" : "Loading address..."}
                  />
                  <button
                    onClick={copyToClipboard}
                    disabled={!walletAddress}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-primary text-white text-xs rounded hover:bg-opacity-90 disabled:opacity-50"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm text-muted">
                    <p className="text-white font-medium mb-1">Important Instructions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Only send {selectedCoin && coinConfig[selectedCoin as keyof typeof coinConfig]?.name || 'this cryptocurrency'} ({selectedCoin && coinConfig[selectedCoin as keyof typeof coinConfig]?.symbol || 'CRYPTO'}) to this address</li>
                      <li>Send from {selectedCoin && coinConfig[selectedCoin as keyof typeof coinConfig]?.network || 'the appropriate network'} only</li>
                      <li>Double-check the address before sending</li>
                      <li>Your deposit request has been submitted to admin</li>
                      <li>Admin will verify and update status once received</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

const ReceiveDetailsPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReceiveDetailsContent />
    </Suspense>
  );
};

export default ReceiveDetailsPage;