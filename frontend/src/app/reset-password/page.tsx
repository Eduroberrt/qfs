"use client";
import { Suspense } from 'react';
// import ResetPassword from '@/components/Auth/ResetPassword';

function ResetPasswordContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Reset Password</h1>
        <p className="text-gray-600">This feature is temporarily unavailable.</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-darkmode flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}