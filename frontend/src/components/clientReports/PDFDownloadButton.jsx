/**
 * FILE LOCATION: frontend/src/components/clientReports/PDFDownloadButton.jsx
 * 
 * PURPOSE: Professional PDF download button for client reports
 * 
 * FUNCTIONALITY:
 * - Single prominent PDF download button
 * - Progress tracking with visual feedback
 * - Error handling and user notifications
 * - Professional styling with green/dark blue theme
 */

import React, { useState } from 'react';
import { Download, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import pdfAPI from '../../services/pdfAPI';

const PDFDownloadButton = ({ clientId, clientName, className = '' }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, generating, success, error

  // Debug logging for client ID
  console.log('🔍 [PDF Button] Component props:', {
    clientId,
    clientIdType: typeof clientId,
    clientIdValue: clientId,
    clientName,
    timestamp: new Date().toISOString()
  });

  const handleDownload = async () => {
    // Ensure clientId is a string with better conversion logic
    let stringClientId;
    
    if (typeof clientId === 'string') {
      stringClientId = clientId;
    } else if (clientId && typeof clientId === 'object') {
      // Handle MongoDB ObjectId or other objects
      if (clientId.toString && typeof clientId.toString === 'function') {
        stringClientId = clientId.toString();
      } else if (clientId._id) {
        stringClientId = clientId._id.toString();
      } else if (clientId.id) {
        stringClientId = clientId.id.toString();
      } else {
        stringClientId = JSON.stringify(clientId);
      }
    } else {
      stringClientId = String(clientId);
    }
    
    console.log('🚀 [PDF Button] Download initiated', {
      originalClientId: clientId,
      stringClientId,
      clientIdType: typeof clientId,
      stringClientIdType: typeof stringClientId,
      clientIdLength: stringClientId?.length,
      clientName,
      timestamp: new Date().toISOString()
    });

    if (!stringClientId || stringClientId === 'undefined' || stringClientId === 'null' || stringClientId === '[object Object]') {
      toast.error('Invalid client ID for PDF generation');
      return;
    }

    setIsGenerating(true);
    setStatus('generating');
    setProgress(0);

    try {
      // Debug: Check authentication token
      const token = localStorage.getItem('token');
      console.log('🔍 [PDF Button] Authentication check:', {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPrefix: token?.substring(0, 20) + '...'
      });

      // Use the same approach as the working script
      console.log('🚀 [PDF Button] Using direct fetch approach like working script');
      
      const response = await fetch(`http://localhost:5000/api/pdf/generate-client-report/${stringClientId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 [PDF Button] Response status:', response.status);

      if (response.ok) {
        const blob = await response.blob();
        console.log('✅ [PDF Button] PDF generated successfully!', blob);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${clientName.replace(/\s+/g, '-').toLowerCase()}-report.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        window.URL.revokeObjectURL(url);
        
        setStatus('success');
        setProgress(100);
        
        // Reset after 3 seconds
        setTimeout(() => {
          setStatus('idle');
          setProgress(0);
        }, 3000);
        
        return { success: true };
      } else {
        const errorData = await response.json();
        console.log('❌ [PDF Button] PDF generation failed:', errorData);
        throw new Error(errorData.message || 'PDF generation failed');
      }

    } catch (error) {
      console.error('❌ PDF Download Error:', error);
      setStatus('error');
      setProgress(0);
      
      // Reset after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
      }, 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'generating':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating PDF...</span>
            <span className="text-sm opacity-75">({Math.round(progress)}%)</span>
          </>
        );
      
      case 'success':
        return (
          <>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Download Complete!</span>
          </>
        );
      
      case 'error':
        return (
          <>
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>Generation Failed</span>
          </>
        );
      
      default:
        return (
          <>
            <FileText className="w-5 h-5" />
            <span>Generate PDF Report</span>
          </>
        );
    }
  };

  const getButtonStyles = () => {
    const baseStyles = "inline-flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
    
    switch (status) {
      case 'generating':
        return `${baseStyles} bg-blue-600 hover:bg-blue-700 focus:ring-blue-300`;
      
      case 'success':
        return `${baseStyles} bg-green-600 hover:bg-green-700 focus:ring-green-300`;
      
      case 'error':
        return `${baseStyles} bg-red-600 hover:bg-red-700 focus:ring-red-300`;
      
      default:
        return `${baseStyles} bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-300 shadow-lg hover:shadow-xl`;
    }
  };

  return (
    <div className={`pdf-download-container ${className}`}>
      {/* Main Download Button */}
      <button
        onClick={handleDownload}
        disabled={isGenerating || !clientId}
        className={getButtonStyles()}
        title={clientId ? `Generate comprehensive PDF report for ${clientName || 'client'}` : 'Client ID required'}
      >
        {getButtonContent()}
      </button>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Status Message */}
      {status === 'generating' && (
        <div className="mt-2 text-sm text-gray-600 text-center">
          Creating comprehensive financial report with charts and analysis...
        </div>
      )}

      {/* Feature Highlights */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Professional advisor branding</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Comprehensive financial analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Interactive charts & visualizations</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Goal tracking & recommendations</span>
        </div>
      </div>

      {/* Error State */}
      {status === 'error' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">PDF generation failed</span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            Please try again or contact support if the issue persists.
          </p>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">PDF downloaded successfully!</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Your comprehensive financial report is ready for review.
          </p>
        </div>
      )}
    </div>
  );
};

export default PDFDownloadButton;
