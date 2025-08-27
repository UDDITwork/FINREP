// Location: frontend/src/components/meetings/MeetingsList.jsx

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Copy, 
  Check, 
  Play, 
  Square, 
  ExternalLink,
  Filter,
  RefreshCw,
  FileText,
  Eye,
  Send,
  Download
} from 'lucide-react';
import { meetingAPI } from '../../services/api';
import TranscriptViewer from './TranscriptViewer';
import MeetingRoom from './MeetingRoom';
import LOESendModal from './LOESendModal';
import LOEStatusBadge from './LOEStatusBadge';

const MeetingsList = ({ refreshTrigger }) => {
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'scheduled', 'active', 'completed'
  const [copied, setCopied] = useState(null);
  const [selectedTranscriptMeeting, setSelectedTranscriptMeeting] = useState(null);
  const [joinedMeeting, setJoinedMeeting] = useState(null);
  const [showDirectJoin, setShowDirectJoin] = useState(false);
  const [directJoinUrl, setDirectJoinUrl] = useState('');
  const [selectedLOEMeeting, setSelectedLOEMeeting] = useState(null);

  useEffect(() => {
    loadMeetings();
  }, [refreshTrigger, filter]);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check authentication
      const token = localStorage.getItem('token'); // Changed from 'authToken' to 'token'
      console.log('🔐 Loading meetings - Auth check:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        filter: filter
      });
      
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }
      
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      
      console.log('📡 Calling meeting API with params:', params);
      const response = await meetingAPI.getAdvisorMeetings(params);
      
      console.log('✅ Meetings loaded successfully:', {
        count: response.meetings?.length || 0,
        meetings: response.meetings
      });
      
      setMeetings(response.meetings || []);
    } catch (error) {
      console.error('❌ Failed to load meetings:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Provide specific error messages
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view meetings.');
      } else if (error.message.includes('Not authenticated')) {
        setError(error.message);
      } else {
        setError(`Failed to load meetings: ${error.message || 'Please try again.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchTranscriptionFromDaily = async (meetingId) => {
    try {
      setError(null);
      
      const response = await meetingAPI.fetchMeetingTranscriptionFromDaily(meetingId);
      
      if (response.success) {
        if (response.transcriptions.length > 0) {
          alert(`Found and processed ${response.transcriptions.length} transcriptions for this meeting!`);
          loadMeetings(); // Refresh to show updated status
        } else {
          alert('No transcriptions found for this meeting on Daily.co.');
        }
      } else {
        setError('Failed to fetch transcription: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to fetch transcription from Daily.co:', error);
      setError('Failed to fetch transcription from Daily.co');
    }
  };

  const handleCopyLink = async (link, meetingId) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(meetingId);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleUpdateStatus = async (meetingId, newStatus) => {
    try {
      await meetingAPI.updateMeetingStatus(meetingId, newStatus);
      // Refresh the meetings list
      loadMeetings();
    } catch (error) {
      console.error('Failed to update meeting status:', error);
      setError('Failed to update meeting status.');
    }
  };

  const handleJoinMeeting = (meeting) => {
    console.log('🚀 Joining meeting:', {
      meetingId: meeting.id,
      roomName: meeting.roomName,
      advisorLink: meeting.advisorMeetingLink,
      status: meeting.status
    });
    setJoinedMeeting(meeting);
  };

  const handleLeaveMeeting = () => {
    setJoinedMeeting(null);
    // Refresh meetings to get updated status
    loadMeetings();
  };

  const handleViewTranscript = (meetingId) => {
    setSelectedTranscriptMeeting(meetingId);
  };

  // ⭐ ADD THIS NEW FUNCTION AFTER handleViewTranscript
  const handleDownloadVTT = async (meetingId) => {
    try {
      console.log('🔗 Attempting to get download link for meeting:', meetingId);
      setError(null);
      
      const response = await meetingAPI.getMeetingTranscriptDownloadLink(meetingId);
      console.log('🔗 Download link response:', response);
      
      if (response.downloadLink) {
        console.log('✅ Opening download link:', response.downloadLink);
        window.open(response.downloadLink, '_blank');
      } else {
        console.error('❌ No download link in response:', response);
        setError('VTT download link not available. Please fetch transcript first.');
      }
    } catch (error) {
      console.error('❌ Failed to get VTT download link:', error);
      setError(`Failed to get VTT download link: ${error.message}`);
    }
  };

  const hasTranscript = (meeting) => {
    console.log('🔍 FULL MEETING DATA:', meeting);
    console.log('🔍 hasTranscript check:', {
      meetingId: meeting.id,
      transcriptStatus: meeting.transcript?.status,
      transcriptId: meeting.transcript?.transcriptId,
      hasContent: !!meeting.transcript?.transcriptContent,
      hasRealTime: meeting.transcript?.realTimeMessages?.length || 0,
      fullTranscriptObject: meeting.transcript
    });
    
    return meeting.transcript?.status === 'completed' || 
           meeting.transcript?.transcriptId ||
           meeting.transcript?.transcriptContent ||
           (meeting.transcript?.realTimeMessages && meeting.transcript.realTimeMessages.length > 0);
  };

  // ADD THIS DEBUG FUNCTION BEFORE return statement
  const debugMeetingButtons = (meeting) => {
    console.log('🔧 Button Debug for meeting:', meeting.id, {
      status: meeting.status,
      hasTranscript: hasTranscript(meeting),
      showStart: meeting.status === 'scheduled',
      showEnd: meeting.status === 'active',
      showDownloadVTT: meeting.status === 'completed', // FORCE SHOW FOR ALL COMPLETED
      showFetchTranscript: meeting.status === 'completed',
      transcript: meeting.transcript,
      willShowDownloadButton: meeting.status === 'completed' // NEW DEBUG INFO
    });
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    let datePrefix = '';
    if (isToday) datePrefix = 'Today, ';
    else if (isTomorrow) datePrefix = 'Tomorrow, ';
    
    return datePrefix + date.toLocaleString('en-US', {
      weekday: isToday || isTomorrow ? undefined : 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      completed: { color: 'bg-green-50 text-green-700', label: 'Completed' },
      cancelled: { color: 'bg-blue-50 text-blue-700', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getMeetingTypeBadge = (meetingType) => {
    return meetingType === 'instant' ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Instant
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        Scheduled
      </span>
    );
  };

  // Render meeting room if user joined
  if (joinedMeeting) {
    console.log('🎬 Rendering MeetingRoom with:', {
      meetingUrl: joinedMeeting.advisorMeetingLink,
      meetingId: joinedMeeting.id,
      hasOnLeave: !!handleLeaveMeeting
    });
    
    return (
      <MeetingRoom
        meetingUrl={joinedMeeting.advisorMeetingLink}
        meetingId={joinedMeeting.id}
        onLeave={handleLeaveMeeting}
      />
    );
  }

  if (isLoading && !error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading meetings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Video className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-blue-900">Recent Meetings</h2>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Meetings</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          {/* Refresh */}
          <button
            onClick={loadMeetings}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh meetings"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">Error loading meetings</h3>
              <p className="mt-1 text-sm text-blue-700">{error}</p>
              {error.includes('Not authenticated') && (
                <p className="mt-2 text-xs text-blue-600">
                  Token status: {localStorage.getItem('token') ? 'Found' : 'Missing'} | 
                  User: {localStorage.getItem('user') ? 'Logged in' : 'Not logged in'}
                </p>
              )}
              <div className="mt-3 flex gap-3">
                <button
                  onClick={loadMeetings}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
                <button
                  onClick={() => setShowDirectJoin(true)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Join with Direct Link
                </button>
                {error.includes('Not authenticated') && (
                  <a
                    href="/login"
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Go to Login
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <p className="text-blue-600 mb-2">No meetings found</p>
          <p className="text-sm text-blue-500">
            {filter === 'all' 
              ? 'Create your first meeting to get started.' 
              : `No ${filter} meetings found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => {
            debugMeetingButtons(meeting); // ADD THIS LINE
            return (
            <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Meeting Info */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-blue-900">
                        {meeting.client?.firstName} {meeting.client?.lastName}
                      </span>
                    </div>
                    {getStatusBadge(meeting.status)}
                    {getMeetingTypeBadge(meeting.meetingType)}
                    <LOEStatusBadge meetingId={meeting.id || meeting._id} />
                  </div>
                  
                  {/* Date/Time */}
                  <div className="flex items-center gap-4 text-sm text-blue-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateTime(meeting.scheduledAt)}</span>
                    </div>
                    {meeting.duration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{meeting.duration} min</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Meeting Links */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-600 w-16">Client:</span>
                      <input
                        type="text"
                        value={meeting.clientMeetingLink}
                        readOnly
                        className="flex-1 p-2 text-xs bg-blue-50 border border-blue-300 rounded text-blue-700"
                      />
                                              <button
                          onClick={() => handleCopyLink(meeting.clientMeetingLink, meeting.id)}
                          className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Copy client link"
                        >
                          {copied === meeting.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <a
                          href={meeting.clientMeetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Open client link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-600 w-16">Advisor:</span>
                      <input
                        type="text"
                        value={meeting.advisorMeetingLink}
                        readOnly
                        className="flex-1 p-2 text-xs bg-blue-50 border border-blue-300 rounded text-blue-700"
                      />
                                              <button
                          onClick={() => handleCopyLink(meeting.advisorMeetingLink, meeting.id)}
                          className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Copy advisor link"
                        >
                          {copied === meeting.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      <a
                        href={meeting.advisorMeetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Join meeting"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  {/* Join Meeting Button - Always show for testing */}
                  <button
                    onClick={() => handleJoinMeeting(meeting)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                    title={`Join meeting (Status: ${meeting.status})`}
                  >
                    <Video className="h-4 w-4" />
                    Join Meeting
                  </button>
                  
                  {/* Status Control Buttons */}
                  {meeting.status === 'scheduled' && (
                    <button
                      onClick={() => handleUpdateStatus(meeting.id, 'active')}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                      title="Start meeting"
                    >
                      <Play className="h-3 w-3" />
                      Start
                    </button>
                  )}
                  
                  {meeting.status === 'active' && (
                    <button
                      onClick={() => handleUpdateStatus(meeting.id, 'completed')}
                      className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
                      title="End meeting"
                    >
                      <Square className="h-3 w-3" />
                      End
                    </button>
                  )}

                  {/* View Transcript Button */}
                  {hasTranscript(meeting) && (
                    <button
                      onClick={() => handleViewTranscript(meeting.id)}
                      className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                      title="View transcript"
                    >
                      <FileText className="h-3 w-3" />
                      Transcript
                    </button>
                  )}

                  {/* Fetch Transcript Button */}
                  {meeting.status === 'completed' && (
                    <button
                      onClick={() => handleFetchTranscriptionFromDaily(meeting.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                      title="Fetch transcription from Daily.co"
                    >
                      <Download className="h-3 w-3" />
                      Fetch Transcript
                    </button>
                  )}

                  {/* ⭐ FORCE SHOW DOWNLOAD BUTTON FOR ALL COMPLETED MEETINGS */}
                  {meeting.status === 'completed' && (
                    <>
                      {console.log('🎯 RENDERING DOWNLOAD BUTTON for meeting:', meeting.id, 'Status:', meeting.status)}
                      <button
                        onClick={() => handleDownloadVTT(meeting.id)}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                        title="Download VTT file from Daily.co"
                      >
                        <Download className="h-3 w-3" />
                        Download VTT
                      </button>
                    </>
                  )}

                  {/* Send LOE Button */}
                  {meeting.status === 'completed' && (
                    <button
                      onClick={() => setSelectedLOEMeeting(meeting)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                      title="Send Letter of Engagement"
                    >
                      <Send className="h-3 w-3" />
                      Send LOE
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Transcript Viewer Modal */}
      {selectedTranscriptMeeting && (
        <TranscriptViewer
          meetingId={selectedTranscriptMeeting}
          onClose={() => setSelectedTranscriptMeeting(null)}
        />
      )}

      {/* LOE Send Modal */}
      {selectedLOEMeeting && (
        <LOESendModal
          isOpen={!!selectedLOEMeeting}
          onClose={() => setSelectedLOEMeeting(null)}
          meeting={selectedLOEMeeting}
          onSuccess={(loeData) => {
            const action = loeData?.wasResent ? 'resent' : 'sent';
            console.log(`✅ LOE ${action} successfully:`, loeData);
            
            // Refresh meetings to show updated LOE status
            loadMeetings();
          }}
        />
      )}

      {/* Direct Join Dialog */}
      {showDirectJoin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Meeting with Direct Link</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter a Daily.co meeting URL to join directly. This is useful if the meeting list is not loading.
            </p>
            <input
              type="url"
              value={directJoinUrl}
              onChange={(e) => setDirectJoinUrl(e.target.value)}
              placeholder="https://yourdomain.daily.co/meeting-room"
              className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDirectJoin(false);
                  setDirectJoinUrl('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (directJoinUrl.includes('daily.co')) {
                    setJoinedMeeting({
                      id: 'direct-join',
                      advisorMeetingLink: directJoinUrl
                    });
                    setShowDirectJoin(false);
                  } else {
                    alert('Please enter a valid Daily.co meeting URL');
                  }
                }}
                disabled={!directJoinUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsList;