// Location: frontend/src/components/meetings/TranscriptionsPage.jsx

import React, { useState, useEffect } from 'react';
import { FileText, User, ArrowLeft, Calendar, MessageSquare } from 'lucide-react';
import { meetingAPI } from '../../services/api';
import ClientTranscriptDetails from './ClientTranscriptDetails';

const TranscriptionsPage = () => {
  const [clientsWithTranscripts, setClientsWithTranscripts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClientsWithTranscripts();
  }, []);

  const loadClientsWithTranscripts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await meetingAPI.getAdvisorClientsWithTranscripts();
      setClientsWithTranscripts(response.data || []);
    } catch (error) {
      console.error('Error loading clients with transcripts:', error);
      setError('Failed to load clients with transcripts');
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedClient) {
    return (
      <ClientTranscriptDetails 
        client={selectedClient} 
        onBack={() => setSelectedClient(null)} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transcriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Meeting Transcriptions</h1>
        </div>
        <p className="text-gray-600">
          View all meeting transcriptions organized by client
        </p>
      </div>

      {clientsWithTranscripts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transcriptions Found</h3>
          <p className="text-gray-600">No meetings with transcriptions have been conducted yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientsWithTranscripts.map((item) => (
            <div 
              key={item.client._id}
              onClick={() => setSelectedClient(item)}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {item.client.firstName} {item.client.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{item.client.email}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>{item.meetingCount} meetings with transcripts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Last meeting: {new Date(item.lastMeetingDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranscriptionsPage;
