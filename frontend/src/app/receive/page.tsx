"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import UserLayout from '@/components/Layout/UserLayout';
import authService from '@/services/auth';

const ReceivePage = () => {
  const router = useRouter();
  const [selectedCoin, setSelectedCoin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Mock transaction data - in real app this would come from an API
  
  // Fetch user deposits on component mount
  const fetchUserDeposits = async () => {
    try {
      const response = await authService.authenticatedRequest('http://localhost:8000/api/deposits/');

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.deposits);
      } else {
        console.error('Failed to fetch deposits:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch deposits:', error);
    }
  };

  useEffect(() => {
    fetchUserDeposits();
  }, []);

  const handleProceed = async () => {
    if (!selectedCoin) {
      toast.error('Please select a coin first');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create the deposit transaction using authenticatedRequest for automatic token refresh
      const response = await authService.authenticatedRequest('http://localhost:8000/api/deposits/create/', {
        method: 'POST',
        body: JSON.stringify({
          coin_type: selectedCoin,
          amount: 0.0, // Set to 0 for manual deposits
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Deposit transaction created successfully!');
        
        // Refresh the transactions list to show the new pending transaction
        await fetchUserDeposits();
        
        // Reset processing state
        setIsProcessing(false);
        
        // Add a small delay to let user see the updated table, then redirect
        setTimeout(() => {
          router.push(`/receive/details?coin=${selectedCoin}`);
        }, 1500);
      } else {
        throw new Error('Failed to create deposit transaction');
      }
    } catch (error) {
      console.error('Error creating deposit:', error);
      toast.error('Failed to create deposit transaction');
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-500 bg-opacity-10 border-green-500 border-opacity-30';
      case 'pending': return 'bg-yellow-500 bg-opacity-10 border-yellow-500 border-opacity-30';
      case 'rejected': return 'bg-red-500 bg-opacity-10 border-red-500 border-opacity-30';
      default: return 'bg-gray-500 bg-opacity-10 border-gray-500 border-opacity-30';
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes loading-bar {
          0% { opacity: 0.6; transform: scaleX(0.8); }
          50% { opacity: 1; transform: scaleX(1); }
          100% { opacity: 0.6; transform: scaleX(0.8); }
        }
      `}</style>
      <UserLayout>
      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-darkmode border border-section border-opacity-30 rounded-xl p-8 mx-4 max-w-sm w-full text-center">
            {/* Continuous Loading Animation */}
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-section border-opacity-20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-2 border-primary border-opacity-30 border-r-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              </div>
            </div>
            
            {/* Processing Text */}
            <h3 className="text-xl font-semibold text-white mb-2">Processing Transaction</h3>
            <p className="text-muted text-sm mb-4">Please wait while we process your transaction...</p>
            
            {/* Continuous Progress Bar */}
            <div className="w-full bg-section bg-opacity-20 rounded-full h-2 mb-4">
              <div 
                className="bg-primary h-2 rounded-full"
                style={{
                  width: '100%',
                  animation: 'loading-bar 2s ease-in-out infinite'
                }}
              ></div>
            </div>
            
            <p className="text-xs text-muted">This may take a few moments</p>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Receive Funds</h1>
          <p className="text-muted">Generate deposit address to receive cryptocurrency</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20 items-start">
          {/* Receive Form Card - Fixed height and independent */}
          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6 h-fit">
            <h2 className="text-xl font-semibold text-white mb-6">Receive Transaction</h2>
            
            <div className="space-y-6">
              {/* Select Coin */}
              <div>
                <label className="block text-white font-medium mb-3">
                  Select Coin
                </label>
                <select
                  value={selectedCoin}
                  onChange={(e) => setSelectedCoin(e.target.value)}
                  className="w-full bg-darkmode border border-section border-opacity-30 focus:border-primary rounded-lg px-4 py-3 text-white focus:outline-none transition-colors"
                >
                  <option value="">Select cryptocurrency...</option>
                  <option value="bitcoin">Bitcoin (BTC)</option>
                  <option value="ethereum">Ethereum (ETH)</option>
                  <option value="ripple">Ripple (XRP)</option>
                  <option value="stellar">Stellar (XLM)</option>
                  <option value="usdt">Tether (USDT)</option>
                  <option value="bnb">BNB (BNB)</option>
                  <option value="bnb_tiger">BNB Tiger</option>
                </select>
              </div>

              {/* Proceed Button */}
              <button
                type="button"
                onClick={handleProceed}
                disabled={isProcessing || !selectedCoin}
                className="w-full bg-primary text-darkmode font-medium py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-darkmode" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Proceed</span>
                )}
              </button>
            </div>
          </div>

          {/* Transaction History Card - Limited to 10 recent transactions */}
          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Recent Transactions</h2>
            
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full min-w-[500px]">
                <thead className="sticky top-0 bg-darkmode border-b border-section border-opacity-20 z-10">
                  <tr>
                    <th className="text-left text-muted text-sm font-medium py-3 px-2 bg-darkmode">Date</th>
                    <th className="text-left text-muted text-sm font-medium py-3 px-2 bg-darkmode">Coin</th>
                    <th className="text-left text-muted text-sm font-medium py-3 px-2 bg-darkmode">Amount</th>
                    <th className="text-left text-muted text-sm font-medium py-3 px-2 bg-darkmode">ID</th>
                    <th className="text-left text-muted text-sm font-medium py-3 px-2 bg-darkmode">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((transaction, index) => (
                    <tr key={transaction.id} className="border-b border-section border-opacity-10">
                      <td className="py-3 px-2 text-white text-sm">{new Date(transaction.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-2 text-white text-sm">{transaction.coin_display}</td>
                      <td className="py-3 px-2 text-white text-sm font-medium">{transaction.amount || 'Pending'}</td>
                      <td className="py-3 px-2 text-muted text-sm">{transaction.id}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBg(transaction.status)} ${getStatusColor(transaction.status)}`}>
                          {transaction.status_display}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-section bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-muted">No transactions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
    </>
  );
};

export default ReceivePage;