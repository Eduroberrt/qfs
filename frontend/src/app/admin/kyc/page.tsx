"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface KYCSubmission {
  id: number;
  user: number;
  user_name: string;
  user_email: string;
  status: string;
  document_type: string;
  document_file: string;
  document_file_url: string;
  admin_notes: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
}

const AdminKYCPage = () => {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await authService.getAdminKYCList();
      setSubmissions(response.submissions);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch KYC submissions');
      if (error.message?.includes('permission') || error.message?.includes('admin')) {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (submissionId: number, action: 'approve' | 'reject') => {
    setReviewingId(submissionId);
    
    try {
      await authService.reviewKYCSubmission(submissionId, action, reviewNotes);
      toast.success(`KYC verification ${action}d successfully`);
      
      // Refresh submissions
      await fetchSubmissions();
      
      // Close modal
      setIsModalOpen(false);
      setSelectedSubmission(null);
      setReviewNotes('');
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} verification`);
    } finally {
      setReviewingId(null);
    }
  };

  const openReviewModal = (submission: KYCSubmission) => {
    setSelectedSubmission(submission);
    setReviewNotes(submission.admin_notes || '');
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500 bg-yellow-500/10';
      case 'verified': return 'text-green-500 bg-green-500/10';
      case 'rejected': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'verified':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filterStatus === 'all') return true;
    return submission.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-darkmode flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkmode">
      {/* Header */}
      <div className="border-b border-section border-opacity-20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">KYC Verification Admin</h1>
            <Link 
              href="/dashboard" 
              className="text-primary hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm">Total Submissions</p>
                <p className="text-2xl font-bold text-white">{submissions.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {submissions.filter(s => s.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm">Verified</p>
                <p className="text-2xl font-bold text-green-500">
                  {submissions.filter(s => s.status === 'verified').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm">Rejected</p>
                <p className="text-2xl font-bold text-red-500">
                  {submissions.filter(s => s.status === 'rejected').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-white font-medium">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-darkmode border border-section border-opacity-30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-section bg-opacity-20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider">Document Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-section divide-opacity-20">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-section hover:bg-opacity-5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-white font-medium">{submission.user_name}</div>
                        <div className="text-muted text-sm">{submission.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">
                      {submission.document_type?.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1 ${getStatusColor(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                        {submission.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {submission.document_file_url && (
                        <a
                          href={submission.document_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-white transition-colors"
                        >
                          View Document
                        </a>
                      )}
                      {submission.status === 'pending' && (
                        <button
                          onClick={() => openReviewModal(submission)}
                          className="text-yellow-500 hover:text-white transition-colors ml-4"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-section bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-white text-lg font-medium mb-2">No submissions found</h3>
              <p className="text-muted">No KYC submissions match the current filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {isModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-darkmode border border-section border-opacity-20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Review KYC Submission</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-white font-medium mb-2">User</label>
                  <p className="text-muted">{selectedSubmission.user_name} ({selectedSubmission.user_email})</p>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Document Type</label>
                  <p className="text-muted">{selectedSubmission.document_type?.replace('_', ' ').toUpperCase()}</p>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Current Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1 ${getStatusColor(selectedSubmission.status)}`}>
                    {getStatusIcon(selectedSubmission.status)}
                    {selectedSubmission.status.toUpperCase()}
                  </span>
                </div>

                {selectedSubmission.document_file_url && (
                  <div>
                    <label className="block text-white font-medium mb-2">Document</label>
                    <a
                      href={selectedSubmission.document_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-white transition-colors"
                    >
                      View Submitted Document →
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-white font-medium mb-2">Admin Notes</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this verification..."
                    className="w-full bg-section bg-opacity-20 border border-section border-opacity-30 rounded-lg px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary resize-none"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => handleReview(selectedSubmission.id, 'approve')}
                  disabled={reviewingId === selectedSubmission.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {reviewingId === selectedSubmission.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Approve</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleReview(selectedSubmission.id, 'reject')}
                  disabled={reviewingId === selectedSubmission.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {reviewingId === selectedSubmission.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Reject</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKYCPage;