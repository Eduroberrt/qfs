"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import UserLayout from '@/components/Layout/UserLayout';

const SupportPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    department: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    department: '',
    subject: '',
    message: ''
  });

  const departments = [
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'account', label: 'Account Issues' },
    { value: 'kyc', label: 'KYC & Verification' },
    { value: 'trading', label: 'Trading Support' },
    { value: 'general', label: 'General Inquiry' }
  ];

  const validateForm = () => {
    const newErrors = {
      department: '',
      subject: '',
      message: ''
    };

    if (!formData.department.trim()) {
      newErrors.department = 'Please select a department';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 20) {
      newErrors.message = 'Message must be at least 20 characters';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('http://localhost:8000/api/support/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          department: formData.department,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Support ticket submitted successfully! You will receive a notification when we respond.', {
          duration: 5000,
        });
        
        // Reset form
        setFormData({
          department: '',
          subject: '',
          message: ''
        });
        console.log('Support ticket created:', data);
      } else {
        const errorData = await response.json();
        toast.error('Failed to submit support ticket. Please try again.', {
          duration: 5000,
        });
        console.error('Failed to create support ticket:', errorData);
      }
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast.error('Network error. Please check your connection and try again.', {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <UserLayout>
      <div className="container mx-auto px-6 py-8 pb-24">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Support Center</h1>
          <p className="text-gray-300 text-lg">Get help from our support team. We're here to assist you 24/7.</p>
        </div>

        {/* Support Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold text-white mb-2">Submit a Support Ticket</h2>
              <p className="text-gray-300">Tell us how we can help you</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Department Selection */}
              <div>
                <label className="block text-muted text-sm mb-2">
                  Department <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className={`w-full bg-darkmode border ${
                    errors.department 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-section border-opacity-20 focus:border-primary'
                  } rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors`}
                >
                  <option value="">Choose a department...</option>
                  {departments.map((dept) => (
                    <option key={dept.value} value={dept.value} className="bg-darkmode">
                      {dept.label}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-red-400 text-sm mt-2">{errors.department}</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-muted text-sm mb-2">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Brief description of your issue"
                  className={`w-full bg-darkmode border ${
                    errors.subject 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-section border-opacity-20 focus:border-primary'
                  } rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors`}
                />
                <div className="flex justify-between mt-2">
                  {errors.subject ? (
                    <p className="text-red-400 text-sm">{errors.subject}</p>
                  ) : (
                    <p className="text-gray-400 text-sm">Minimum 5 characters</p>
                  )}
                  <p className="text-gray-400 text-sm">{formData.subject.length}/100</p>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-muted text-sm mb-2">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Please provide detailed information about your issue. Include any relevant account details, error messages, or steps you've already taken."
                  rows={6}
                  className={`w-full bg-darkmode border ${
                    errors.message 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-section border-opacity-20 focus:border-primary'
                  } rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors resize-none`}
                />
                <div className="flex justify-between mt-2">
                  {errors.message ? (
                    <p className="text-red-400 text-sm">{errors.message}</p>
                  ) : (
                    <p className="text-gray-400 text-sm">Minimum 20 characters</p>
                  )}
                  <p className="text-gray-400 text-sm">{formData.message.length}/1000</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-darkmode font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Submit Support Ticket</span>
                    </>
                  )}
                </button>
              </div>

              {/* Help Text */}
              <div className="text-center pt-4">
                <p className="text-gray-400 text-sm">
                  We typically respond within 24 hours. You'll receive a notification when we reply.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default SupportPage;