// Location: frontend/src/components/meetings/ClientTranscriptDetails.jsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MessageSquare, FileText, Eye } from 'lucide-react';
import { meetingAPI } from '../../services/api';
import TranscriptViewer from './TranscriptViewer';

const ClientTranscriptDetails = ({ client, onBack }) => {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClientMeetings();
  }, [client.client._id]);

  const loadClientMeetings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await meetingAPI.getMeetingsByClient(client.client._id);
      
      // Filter meetings that have transcripts
      const meetingsWithTranscripts = response.meetings.filter(meeting => 
        meeting.transcript?.hasFinalTranscript || 
        (meeting.transcript?.messagesCount && meeting.transcript.messagesCount > 0)
      );
      
      setMeetings(meetingsWithTranscripts);
    } catch (error) {
      console.error('Error loading client meetings:', error);
      setError('Failed to load client meetings');
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedMeetingId) {
    return (
      <TranscriptViewer 
        meetingId={selectedMeetingId}
        onClose={() => setSelectedMeetingId(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {client.client.firstName} {client.client.lastName}
          </h1>
          <p className="text-gray-600">{client.client.email}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading meetings...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No meetings with transcripts found for this client.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div 
              key={meeting.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(meeting.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{meeting.duration || 0} minutes</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{meeting.transcript?.messagesCount || 0} messages</span>
                    </div>
                    {meeting.transcript?.hasSummary && (
                      <span className="text-green-600 text-xs">✓ AI Summary</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Status: <span className="capitalize">{meeting.status}</span>
                  </p>
                </div>
                
                <button
                  onClick={() => setSelectedMeetingId(meeting.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View Transcript
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientTranscriptDetails;
