import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Clock, 
  Users, 
  Download, 
  RefreshCw, 
  MessageSquare, 
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';

const EnhancedTranscriptDisplay = ({ meeting, onTranscriptLoad }) => {
  const [transcriptData, setTranscriptData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('all');
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch transcript content
  const fetchTranscript = useCallback(async (forceRefresh = false) => {
    if (!meeting._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First try to get the conversation format
      const response = await axios.get(`/api/transcripts/${meeting._id}/conversation`);
      
      if (response.data.success) {
        setTranscriptData(response.data);
        onTranscriptLoad?.(response.data);
      } else {
        // If no conversation available, try to fetch WebVTT
        const webvttResponse = await axios.get(`/api/transcripts/${meeting._id}/webvtt`);
        if (webvttResponse.data.success) {
          // Re-fetch conversation after WebVTT processing
          setTimeout(() => fetchTranscript(), 2000);
        }
      }
    } catch (err) {
      console.error('Failed to fetch transcript:', err);
      
      // Try WebVTT endpoint as fallback
      if (!forceRefresh) {
        try {
          const webvttResponse = await axios.get(`/api/transcripts/${meeting._id}/webvtt`);
          if (webvttResponse.data.success) {
            // Re-fetch conversation after processing
            setTimeout(() => fetchTranscript(true), 2000);
            return;
          }
        } catch (webvttError) {
          console.error('WebVTT fetch also failed:', webvttError);
        }
      }
      
      setError(err.response?.data?.error || 'Failed to load transcript');
    } finally {
      setLoading(false);
    }
  }, [meeting._id, onTranscriptLoad]);

  // Format speaker name for display
  const formatSpeakerName = (speakerName) => {
    if (!speakerName || speakerName === 'Unknown') return 'Unknown Speaker';
    
    // Clean up speaker names
    const cleaned = speakerName.replace(/['"]/g, '').trim();
    return cleaned || 'Unknown Speaker';
  };

  // Get avatar color based on speaker
  const getSpeakerColor = (speakerName) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200', 
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-pink-100 text-pink-700 border-pink-200'
    ];
    
    const index = speakerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Filter conversation based on search and speaker
  const filterConversation = (conversation) => {
    if (!conversation) return [];
    
    let filtered = conversation;
    
    // Filter by speaker
    if (selectedSpeaker !== 'all') {
      filtered = filtered.filter(msg => 
        formatSpeakerName(msg.speaker).toLowerCase() === selectedSpeaker.toLowerCase()
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatSpeakerName(msg.speaker).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Get unique speakers
  const getUniqueSpeakers = (conversation) => {
    if (!conversation) return [];
    const speakers = [...new Set(conversation.map(msg => formatSpeakerName(msg.speaker)))];
    return speakers.filter(speaker => speaker !== 'Unknown Speaker');
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && meeting.transcript?.status === 'active') {
      const interval = setInterval(() => {
        fetchTranscript(true);
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, meeting.transcript?.status, fetchTranscript]);

  // Auto-fetch if transcript is available
  useEffect(() => {
    if (meeting.hasTranscript && !transcriptData) {
      fetchTranscript();
    }
  }, [meeting.hasTranscript, transcriptData, fetchTranscript]);

  // Export functionality
  const exportTranscript = (format = 'json') => {
    if (!transcriptData) return;

    let content, mimeType, filename;

    switch (format) {
      case 'txt':
        content = transcriptData.conversation
          .map(msg => `[${msg.timestamp}] ${formatSpeakerName(msg.speaker)}: ${msg.text}`)
          .join('\n\n');
        mimeType = 'text/plain';
        filename = `meeting-transcript-${meeting._id}.txt`;
        break;
      case 'csv':
        content = 'Timestamp,Speaker,Message\n' + 
          transcriptData.conversation
            .map(msg => `"${msg.timestamp}","${formatSpeakerName(msg.speaker)}","${msg.text.replace(/"/g, '""')}"`)
            .join('\n');
        mimeType = 'text/csv';
        filename = `meeting-transcript-${meeting._id}.csv`;
        break;
      default:
        content = JSON.stringify(transcriptData, null, 2);
        mimeType = 'application/json';
        filename = `meeting-transcript-${meeting._id}.json`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <RefreshCw className="h-8 w-8 text-blue-500 mx-auto mb-3 animate-spin" />
        <p className="text-gray-600 font-medium">Loading transcript...</p>
        <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
      </div>
    );
  }

  // No transcript available
  if (!meeting.hasTranscript && !loading) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium mb-2">No transcript available</p>
        <p className="text-sm text-gray-500 mb-4">
          Transcripts are generated automatically during video calls
        </p>
        {meeting.transcript?.status === 'not_started' && (
          <div className="text-xs text-gray-400">
            Transcription was not enabled for this meeting
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium mb-2">Failed to load transcript</p>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchTranscript()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!transcriptData) return null;

  const { conversation, participants, meetingInfo, summary } = transcriptData;
  const filteredConversation = filterConversation(conversation);
  const uniqueSpeakers = getUniqueSpeakers(conversation);

  return (
    <div className="space-y-6">
      {/* Meeting Info Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <h6 className="font-semibold text-gray-800 flex items-center text-lg">
            <Play className="h-5 w-5 mr-2 text-blue-600" />
            Meeting Transcript
          </h6>
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <span className="flex items-center bg-white px-3 py-1 rounded-full">
              <Clock className="h-4 w-4 mr-1" />
              {meetingInfo.duration || 0} min
            </span>
            <span className="flex items-center bg-white px-3 py-1 rounded-full">
              <Users className="h-4 w-4 mr-1" />
              {meetingInfo.participantCount || 0} speakers
            </span>
            <span className="flex items-center bg-white px-3 py-1 rounded-full">
              <MessageSquare className="h-4 w-4 mr-1" />
              {conversation.length} messages
            </span>
          </div>
        </div>
        
        {/* Participants */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">Participants: </span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
            {participants.advisor} (Advisor)
          </span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
            {participants.client} (Client)
          </span>
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center text-sm text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Transcript Available
            </span>
            {meeting.transcript?.status === 'active' && (
              <span className="flex items-center text-sm text-blue-600">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse mr-1"></div>
                Live Transcription
              </span>
            )}
          </div>
          
          {meeting.transcript?.status === 'active' && (
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
          )}
        </div>
      </div>

      {/* Summary Section */}
      {summary && (summary.keyPoints?.length > 0 || summary.actionItems?.length > 0) && (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h6 className="font-semibold text-yellow-800 mb-4 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Meeting Summary
          </h6>
          
          <div className="grid md:grid-cols-2 gap-6">
            {summary.keyPoints?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-2">Key Points:</p>
                <ul className="text-sm text-yellow-600 space-y-1">
                  {summary.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {summary.actionItems?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-2">Action Items:</p>
                <ul className="text-sm text-yellow-600 space-y-1">
                  {summary.actionItems.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedSpeaker}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Speakers</option>
                {uniqueSpeakers.map(speaker => (
                  <option key={speaker} value={speaker}>{speaker}</option>
                ))}
              </select>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showTimestamps}
                onChange={(e) => setShowTimestamps(e.target.checked)}
                className="mr-2"
              />
              Show timestamps
            </label>
            
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              {expanded ? 'Collapse' : `Expand (${filteredConversation.length})`}
            </button>
          </div>
        </div>
        
        {/* Results info */}
        {(searchTerm || selectedSpeaker !== 'all') && (
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredConversation.length} of {conversation.length} messages
            {searchTerm && (
              <span> containing "{searchTerm}"</span>
            )}
            {selectedSpeaker !== 'all' && (
              <span> from {selectedSpeaker}</span>
            )}
          </div>
        )}
      </div>

      {/* Conversation Display */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className={`${expanded ? 'max-h-none' : 'max-h-96'} overflow-y-auto`}>
          {filteredConversation.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No messages found matching your filters
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {(expanded ? filteredConversation : filteredConversation.slice(0, 20)).map((message, index) => (
                <div key={index} className="flex items-start space-x-3">
                  {/* Speaker Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getSpeakerColor(message.speaker)}`}>
                    {formatSpeakerName(message.speaker).split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline space-x-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatSpeakerName(message.speaker)}
                      </p>
                      {showTimestamps && (
                        <span className="text-xs text-gray-500 font-mono">
                          {message.timestamp}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {searchTerm ? (
                        message.text.replace(
                          new RegExp(`(${searchTerm})`, 'gi'),
                          '<mark class="bg-yellow-200">$1</mark>'
                        )
                      ) : (
                        message.text
                      )}
                    </p>
                  </div>
                </div>
              ))}
              
              {!expanded && filteredConversation.length > 20 && (
                <div className="text-center pt-6 border-t">
                  <button
                    onClick={() => setExpanded(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    Show {filteredConversation.length - 20} more messages
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions and Export */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-xs text-gray-500">
          Transcript last updated: {new Date(transcriptData.fetchedAt || Date.now()).toLocaleString()}
          {meeting.transcript?.fetchStatus && (
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              Status: {meeting.transcript.fetchStatus}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchTranscript(true)}
            disabled={loading}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <div className="relative group">
            <button className="flex items-center text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded transition-colors">
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => exportTranscript('json')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Export as JSON
              </button>
              <button
                onClick={() => exportTranscript('txt')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Export as Text
              </button>
              <button
                onClick={() => exportTranscript('csv')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Export as CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTranscriptDisplay;
