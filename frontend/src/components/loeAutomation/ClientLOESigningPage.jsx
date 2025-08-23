/**
 * FILE LOCATION: frontend/src/components/loeAutomation/ClientLOESigningPage.jsx
 * 
 * PURPOSE: Client-facing LOE signing page
 * 
 * FUNCTIONALITY: Display LOE content, capture signature, and generate signed PDF
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Clock,
  User,
  Building,
  Mail,
  Phone,
  Signature,
  Send
} from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';

const ClientLOESigningPage = () => {
  const { accessToken } = useParams();
  const [loeData, setLoeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Fetch LOE data when component mounts
  useEffect(() => {
    if (accessToken) {
      fetchLOEData();
    }
  }, [accessToken]);

  const fetchLOEData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [Client LOE] Fetching LOE data for token:', accessToken);
      
      const response = await fetch(`/api/loe-automation/client/${accessToken}`);
      const data = await response.json();

      if (data.success) {
        setLoeData(data.data);
        console.log('✅ [Client LOE] LOE data fetched successfully');
      } else {
        throw new Error(data.error || 'Failed to fetch LOE data');
      }
    } catch (error) {
      console.error('❌ [Client LOE] Error fetching LOE data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureChange = (signature) => {
    setSignatureData(signature);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!signatureData) {
      setError('Please provide your signature');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      console.log('📝 [Client LOE] Submitting signature...');

      const response = await fetch(`/api/loe-automation/client/${accessToken}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature: signatureData,
          ipAddress: 'client-ip', // Will be captured by backend
          userAgent: navigator.userAgent
        })
      });

      const data = await response.json();

      if (data.success) {
        setSigned(true);
        setPdfUrl(data.data.pdfUrl);
        
        console.log('✅ [Client LOE] LOE signed successfully');
        
        // Auto-download the PDF
        if (data.data.pdfUrl) {
          const link = document.createElement('a');
          link.href = data.data.pdfUrl;
          link.download = `LOE_${loeData.client.firstName}_${loeData.client.lastName}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        throw new Error(data.error || 'Failed to sign LOE');
      }
    } catch (error) {
      console.error('❌ [Client LOE] Error signing LOE:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Letter of Engagement</h2>
          <p className="text-gray-600">Please wait while we fetch your document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Document</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600">
            This link may have expired or is invalid. Please contact your advisor for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">LOE Signed Successfully!</h2>
          <p className="text-green-700 mb-6">
            Thank you, {loeData.client.firstName}! Your Letter of Engagement has been signed and sent to your advisor.
          </p>
          
          {pdfUrl && (
            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-center">
                <Download className="w-5 h-5 text-blue-600 mr-2" />
                <a
                  href={pdfUrl}
                  download={`LOE_${loeData.client.firstName}_${loeData.client.lastName}.pdf`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Download Signed LOE
                </a>
              </div>
            </div>
          )}
          
          <p className="text-sm text-gray-600">
            You will receive a confirmation email shortly. Your advisor will be notified of your signature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Advisor Firm Information */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Building className="w-12 h-12 text-blue-600 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {loeData?.advisor?.firmName || 'Financial Advisory Firm'}
                </h1>
                <p className="text-lg text-gray-600">Professional Financial Services</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-gray-700">
                  {loeData?.advisor?.firstName} {loeData?.advisor?.lastName}
                </span>
              </div>
              <div className="flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-gray-700">{loeData?.advisor?.email}</span>
              </div>
              <div className="flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-gray-700">{loeData?.advisor?.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Document Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
            <div className="flex items-center">
              <FileText className="w-8 h-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">Letter of Engagement</h2>
                <p className="text-blue-100">Client Agreement for Financial Advisory Services</p>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="px-8 py-6">
            <div className="prose max-w-none">
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  <strong>Date:</strong> {new Date().toLocaleDateString()}
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>To:</strong> {loeData?.client?.firstName} {loeData?.client?.lastName}
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Email:</strong> {loeData?.client?.email}
                </p>
              </div>

              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Dear {loeData?.client?.firstName},
                </p>
                
                <p>
                  Welcome to {loeData?.advisor?.firmName || 'our firm'}! We are delighted to have you as a client and look forward to providing you with comprehensive financial advisory services.
                </p>
                
                <p>
                  This Letter of Engagement (LOE) outlines the terms and conditions of our professional relationship, including the services we will provide, our fee structure, and your responsibilities as a client.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Services to be Provided</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Comprehensive Financial Planning and Analysis</li>
                  <li>Investment Advisory and Portfolio Management</li>
                  <li>Risk Assessment and Management Strategies</li>
                  <li>Retirement Planning and Wealth Preservation</li>
                  <li>Tax-Efficient Investment Strategies</li>
                  <li>Regular Portfolio Reviews and Rebalancing</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Fee Structure</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Initial Financial Planning Fee: $5,000</li>
                  <li>Ongoing Advisory Fee: 1% of assets under management</li>
                  <li>Reduced fee of 0.75% for assets above $1,000,000</li>
                  <li>Quarterly billing in advance</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Client Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete financial information</li>
                  <li>Communicate any changes in financial circumstances</li>
                  <li>Review and approve investment recommendations</li>
                  <li>Maintain timely payment of advisory fees</li>
                </ul>

                {loeData?.loe?.content?.customNotes && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Additional Notes</h4>
                    <p className="text-blue-800">{loeData.loe.content.customNotes}</p>
                  </div>
                )}

                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Important:</strong> By signing this Letter of Engagement, you acknowledge that you have read, understood, and agree to the terms and conditions outlined above. This agreement will remain in effect until terminated by either party with 30 days written notice.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="px-8 py-6 bg-gray-50 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Signature className="w-5 h-5 mr-2" />
              Digital Signature
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                             {/* Signature Canvas */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Please sign below to agree to the terms:
                 </label>
                 <SignatureCanvas
                   onSignatureChange={handleSignatureChange}
                   width={400}
                   height={200}
                 />
               </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800 font-medium">Error</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={submitting || !signatureData}
                  className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {submitting ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      Signing LOE...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Sign & Submit LOE
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientLOESigningPage;
