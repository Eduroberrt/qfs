"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth';
import toast from 'react-hot-toast';
import UserLayout from '@/components/Layout/UserLayout';

const VerifyPage = () => {
  const [documentType, setDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const documentTypes = [
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'national_id', label: 'National ID Card' },
    { value: 'utility_bill', label: 'Utility Bill' },
    { value: 'bank_statement', label: 'Bank Statement' }
  ];

  const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const handleFileSelect = (file: File) => {
    // More flexible file type checking
    const fileName = file.name.toLowerCase();
    const isValidType = allowedFileTypes.includes(file.type) || 
                       fileName.endsWith('.jpg') || 
                       fileName.endsWith('.jpeg') || 
                       fileName.endsWith('.png') || 
                       fileName.endsWith('.gif') || 
                       fileName.endsWith('.pdf');
    
    if (!isValidType) {
      toast.error(`Please upload a valid file type (JPG, PNG, GIF, PDF). Current type: ${file.type}`);
      return;
    }

    if (file.size > maxFileSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    toast.success('File selected successfully!');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentType) {
      toast.error('Please select a document type');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    
    // Show immediate feedback
    toast('Uploading document...', {
      icon: '📤',
      duration: Infinity, // Keep it until we dismiss it
      id: 'upload-toast'
    });

    try {
      const formData = new FormData();
      formData.append('document_file', selectedFile);
      formData.append('document_type', documentType);

      const response = await authService.submitKYCDocument(formData);
      
      // Dismiss loading toast and show success
      toast.dismiss('upload-toast');
      toast.success('Document submitted successfully! Redirecting to dashboard...', { 
        duration: 4000,
        icon: '✅'
      });
      
      // Redirect to dashboard after successful submission
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error: any) {
      // Dismiss loading toast and show error
      toast.dismiss('upload-toast');
      toast.error(error.message || 'Failed to submit document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Introduction Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Card 1 - KYC Requirements */}
          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">KYC Verification Required</h3>
                <p className="text-muted text-sm leading-relaxed">
                  In order to receive and send funds with your QFS Vault Ledger account, the law requires us to collect identifying information on our clients and keep it up to date.
                </p>
                <p className="text-muted text-sm leading-relaxed mt-3">
                  QFS Vault Ledger follows the regulations as required for KYC Verification. All data uploaded by customers are fully encrypted and will never be shared with third-parties.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2 - JUMIO Partnership */}
          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Powered by JUMIO</h3>
                <p className="text-muted text-sm leading-relaxed">
                  In order to combat fraud and follow required rules and regulations, QFS Vault Ledger partnered up with JUMIO, a U.S company that provides REAL-TIME end-to-end identity verification in over 200 countries.
                </p>
                <p className="text-muted text-sm leading-relaxed mt-3">
                  The verification process may take a few days. During this process and once verification is complete you won't be able to edit your name on your payments profile.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Document Type Selection */}
            <div>
              <label className="block text-white font-medium mb-3">
                Choose Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full bg-darkmode border border-section border-opacity-30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                required
              >
                <option value="">Select document type...</option>
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-white font-medium mb-3">
                Upload Document
              </label>
              
              {/* Drag and Drop Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary bg-opacity-5' 
                    : 'border-section border-opacity-30 hover:border-primary hover:border-opacity-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-16 h-16 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-muted text-sm">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-primary hover:text-white text-sm transition-colors"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-16 h-16 bg-section bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-white">
                      Drag and drop your file here, or <span className="text-primary">browse</span>
                    </p>
                    <p className="text-muted text-sm">
                      Files Allowed: JPG, PNG, GIF, PDF (Max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading || !documentType || !selectedFile}
              className="w-full bg-primary text-darkmode font-medium py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-darkmode" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Submit for Verification</span>
              )}
            </button>
          </form>
        </div>

        {/* Tips Section */}
        <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6 mt-8 mb-20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tips on submitting documents:
          </h3>
          <ul className="space-y-2 text-muted text-sm">
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>Capture the entire document including all four corners.</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>Your image must be readable, in focus, and free of reflections and glare.</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>Incomplete or obstructed documents or dark or blurry photos won't be accepted.</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>To prevent abuse, we allow a limited number of verification attempts.</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>Uploading documents or photos other than what is requested may result in account suspension.</span>
            </li>
          </ul>
        </div>
      </div>
    </UserLayout>
  );
};

export default VerifyPage;