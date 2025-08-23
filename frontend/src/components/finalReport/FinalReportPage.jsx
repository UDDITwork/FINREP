// File: frontend/src/components/finalReport/FinalReportPage.jsx
import React, { useState } from 'react';
import { FileText, Download, TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';
import FinalReportModal from './FinalReportModal';

const FinalReportPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Final Report Generator</h1>
                <p className="text-sm text-gray-600">Comprehensive client reports with data from all systems</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Generate Professional Financial Reports
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Create comprehensive PDF reports that include all client data from financial plans, 
            KYC verification, meetings, investment strategies, and more. Perfect for client 
            reviews and regulatory compliance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive Data</h3>
            <p className="text-gray-600">
              Includes data from all 13 database models: financial plans, KYC, meetings, 
              investments, risk assessments, and more.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant PDF Generation</h3>
            <p className="text-gray-600">
              Generate professional PDF reports instantly in your browser. No server 
              processing delays or file size limitations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Formatting</h3>
            <p className="text-gray-600">
              Beautiful, structured PDFs with proper sections, formatting, and branding 
              that reflect your firm's professional image.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 bg-yellow-100 rounded-lg w-fit mb-4">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Selection</h3>
            <p className="text-gray-600">
              Easy client search and selection with portfolio values, status indicators, 
              and onboarding progress displayed.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Metrics</h3>
            <p className="text-gray-600">
              View comprehensive statistics including total services, active services, 
              and portfolio values before generating reports.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 bg-red-100 rounded-lg w-fit mb-4">
              <Calendar className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Data</h3>
            <p className="text-gray-600">
              All data is fetched in real-time from your database, ensuring reports 
              contain the most current and accurate information.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            Ready to Generate Your First Report?
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Click the button below to open the report generator, select a client, 
            and create a comprehensive financial report in minutes.
          </p>
          <button
            onClick={openModal}
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
          >
            <FileText className="h-5 w-5 mr-2" />
            Generate Final Report
          </button>
        </div>

        {/* How It Works */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Select Client</h4>
              <p className="text-gray-600">
                Choose from your client list with search functionality and portfolio overview
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold text-lg">2</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Data Collection</h4>
              <p className="text-gray-600">
                System automatically fetches comprehensive data from all 13 database models
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Download PDF</h4>
              <p className="text-gray-600">
                Generate and download a professionally formatted PDF report instantly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <FinalReportModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default FinalReportPage;
