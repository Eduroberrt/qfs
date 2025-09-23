'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { Account, Transaction } from '@/types';

const Dashboard = () => {
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Test API connection
        const status = await apiService.getStatus();
        setApiStatus(status);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading QFS Ledger...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure Django backend is running at http://127.0.0.1:8000/
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">QFS Ledger Dashboard</h1>
          <p className="text-gray-600 mt-2">Advanced Financial Management System</p>
        </div>

        {/* API Status Card */}
        {apiStatus && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold text-green-800 mb-4">🟢 Backend Connection</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-lg text-green-600">{apiStatus.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Message</p>
                <p className="text-lg text-gray-900">{apiStatus.message}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Version</p>
                <p className="text-lg text-gray-900">{apiStatus.version}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Total Accounts</h3>
            <p className="text-3xl font-bold text-blue-600">{accounts.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Transactions</h3>
            <p className="text-3xl font-bold text-green-600">{transactions.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Total Assets</h3>
            <p className="text-3xl font-bold text-purple-600">$0.00</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Net Income</h3>
            <p className="text-3xl font-bold text-indigo-600">$0.00</p>
          </div>
        </div>

        {/* Architecture Info */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🏗️ Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🔧 Backend (Django)</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• REST API at http://127.0.0.1:8000/api/</li>
                <li>• Django REST Framework</li>
                <li>• SQLite Database</li>
                <li>• JWT Authentication</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">⚛️ Frontend (React)</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Next.js 14 at http://localhost:3000/</li>
                <li>• React with TypeScript</li>
                <li>• Tailwind CSS styling</li>
                <li>• API service integration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;