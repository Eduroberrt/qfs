"use client";
import { Suspense } from 'react';
import ResetPassword from '@/components/Auth/ResetPassword';

function ResetPasswordContent() {
  return <ResetPassword />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-darkmode flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}