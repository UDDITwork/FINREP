/**
 * FILE LOCATION: frontend/src/components/loeAutomation/CreateLOEModal.jsx
 * 
 * PURPOSE: Modal for creating new LOE for a client
 * 
 * FUNCTIONALITY: Form to create LOE with meeting selection and custom notes
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Send, 
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Mail
} from 'lucide-react';
import { loeAutomationAPI } from '../../services/loeAutomationService';

const CreateLOEModal = ({ isOpen, onClose, client, onLOECreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Fetch meetings for this client when modal opens
  useEffect(() => {
    if (isOpen && client) {
      fetchClientMeetings();
    }
  }, [isOpen, client]);

  const fetchClientMeetings = async () => {
    // Simplified - No meetings required
    setMeetings([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      console.log('📄 [LOE Creation] Creating LOE for client:', {
        clientId: client._id,
        clientName: client.clientName,
        hasCustomNotes: !!customNotes
      });

      const response = await loeAutomationAPI.createLOEForClient(
        client._id,
        customNotes
      );

      if (response.success) {
        setSuccess(true);
        setEmailSent(true);
        
        console.log('✅ [LOE Creation] LOE created successfully:', {
          loeId: response.data.loeId,
          accessToken: response.data.accessToken,
          clientAccessUrl: response.data.clientAccessUrl
        });

        // Call the callback to refresh the dashboard
        if (onLOECreated) {
          onLOECreated(response.data);
        }
      } else {
        throw new Error(response.error || 'Failed to create LOE');
      }
    } catch (error) {
      console.error('❌ [LOE Creation] Error creating LOE:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccess(false);
      setEmailSent(false);
      setSelectedMeeting('');
      setCustomNotes('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">
                Create Letter of Engagement
              </h3>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Client Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-900">Client Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 font-medium">Name</p>
                <p className="text-blue-900">{client.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Email</p>
                <p className="text-blue-900">{client.email}</p>
              </div>
            </div>
          </div>

          {success ? (
            /* Success State */
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">
                LOE Created Successfully!
              </h3>
              <p className="text-green-700 mb-6">
                The Letter of Engagement has been created and sent to {client.clientName}.
              </p>
              
              {emailSent && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">
                      Email sent to {client.email}
                    </span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    The client will receive a secure link to sign the LOE.
                  </p>
                </div>
              )}
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-6">
                             {/* Meeting Selection - Removed for Simplified Version */}
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                 <div className="flex items-center">
                   <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <span className="text-blue-800 font-medium">Simplified LOE Creation</span>
                 </div>
                 <p className="text-blue-700 text-sm mt-1">
                   This LOE will be created with standard financial advisory services and fee structure.
                 </p>
               </div>

              {/* Custom Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  rows={4}
                  placeholder="Add any specific terms, conditions, or notes for this client..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={1000}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {customNotes.length}/1000 characters
                </p>
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

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                                 <button
                   type="submit"
                   disabled={loading}
                   className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                  {loading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Create & Send LOE
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateLOEModal;
