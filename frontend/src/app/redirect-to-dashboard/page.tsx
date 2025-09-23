"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth';

export default function RedirectToDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (authService.isAuthenticated()) {
      // Redirect to dashboard if authenticated
      router.push('/dashboard');
    } else {
      // Redirect to homepage with sign up modal trigger
      router.push('/?signup=true');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-darkmode flex items-center justify-center">
      <div className="text-white text-xl">Redirecting...</div>
    </div>
  );
}