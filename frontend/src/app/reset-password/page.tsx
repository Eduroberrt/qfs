"use client";
import { Suspense } from 'react';

function ResetPasswordContent() {
  return (
    <div className="min-h-screen bg-darkmode flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Reset Password</h1>
        <p className="text-muted">This feature will be available soon.</p>
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