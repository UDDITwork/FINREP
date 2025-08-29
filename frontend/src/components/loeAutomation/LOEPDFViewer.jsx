/**
 * FILE LOCATION: frontend/src/components/loeAutomation/LOEPDFViewer.jsx
 * 
 * PURPOSE: Component to view and download LOE PDFs within the dashboard
 * 
 * FUNCTIONALITY: Display PDF content, download options, and signature details
 */

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Eye, 
  X, 
  FileText, 
  CheckCircle, 
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { loeAutomationAPI } from '../../services/loeAutomationService';

const LOEPDFViewer = ({ 
  isOpen, 
  onClose, 
  loeData, 
  clientName 
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'details'

  useEffect(() => {
    if (isOpen && loeData) {
      // Prefer Cloudinary URL, fallback to local URL
      const cloudinaryUrl = loeData.cloudinaryPdfUrl;
      const localUrl = loeData.signedPdfUrl;
      
      if (cloudinaryUrl && cloudinaryUrl.startsWith('http')) {
        // Use Cloudinary URL directly
        setPdfUrl(cloudinaryUrl);
        setError(null);
      } else if (localUrl) {
        // Extract filename from local URL and get full URL
        const filename = localUrl.split('/').pop();
        if (filename) {
          const url = loeAutomationAPI.getLOEPDFUrl(filename);
          setPdfUrl(url);
          setError(null);
        } else {
          setError('PDF file not found');
        }
      } else {
        setError('No PDF URL available');
      }
    }
  }, [isOpen, loeData]);

  const handleDownload = async () => {
    if (!loeData?.signedPdfUrl) return;
    
    try {
      setLoading(true);
      const filename = loeData.signedPdfUrl.split('/').pop();
      await loeAutomationAPI.downloadLOEPDF(filename);
    } catch (error) {
      setError('Failed to download PDF');
      console.error('Download error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Letter of Engagement
              </h3>
              <p className="text-sm text-gray-600">Client: {clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('view')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'view'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              View PDF
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              LOE Details
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'view' ? (
          <div className="space-y-4">
            {/* PDF Viewer */}
            {pdfUrl && !error ? (
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={pdfUrl}
                  className="w-full h-96 md:h-[600px]"
                  title="LOE PDF Viewer"
                />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">PDF Not Available</p>
                <p className="text-gray-600">{error}</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleDownload}
                disabled={loading || !pdfUrl || error}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download PDF
              </button>
            </div>
          </div>
        ) : (
          /* LOE Details Tab */
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Client Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{clientName}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      Created: {formatDate(loeData?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">LOE Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-900">
                      Status: {loeData?.status || 'Unknown'}
                    </span>
                  </div>
                  {loeData?.signedAt && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-900">
                        Signed: {formatDate(loeData.signedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Services and Fees */}
            {loeData?.content && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Services Offered</h4>
                  <ul className="space-y-2">
                    {loeData.content.services?.map((service, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-900">{service}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Fee Structure</h4>
                  <ul className="space-y-2">
                    {loeData.content.fees?.map((fee, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-900">{fee}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {loeData.content.customNotes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Notes</h4>
                    <p className="text-sm text-gray-900">{loeData.content.customNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Signature Information */}
            {loeData?.signatures?.client && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Client Signature</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Signed At</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(loeData.signatures.client.signedAt)}
                    </p>
                  </div>
                  {loeData.signatures.client.ipAddress && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">IP Address</p>
                      <p className="text-sm text-gray-900 font-mono">
                        {loeData.signatures.client.ipAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LOEPDFViewer;
