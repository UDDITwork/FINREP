import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  RefreshCw, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User,
  Calendar,
  Play,
  Loader,
  ExternalLink
} from 'lucide-react';
import { transcriptionAPI } from '../../services/api';

const TranscriptionManager = () => {
  const [transcriptions, setTranscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedTranscription, setSelectedTranscription] = useState(null);
  const [filter, setFilter] = useState('all'); // all, finished, processing, failed

  useEffect(() => {
    loadTranscriptions();
  }, [filter]);

  const loadTranscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = {};
      if (filter !== 'all') {
        if (filter === 'failed') {
          params.fetchStatus = 'failed';
        } else {
          params.status = filter;
        }
      }

      const response = await transcriptionAPI.getAdvisorTranscriptions(params);
      setTranscriptions(response.transcriptions || []);
    } catch (error) {
      console.error('Failed to load transcriptions:', error);
      setError('Failed to load transcriptions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncTranscriptions = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      
      const response = await transcriptionAPI.syncTranscriptions();
      
      if (response.success) {
        await loadTranscriptions(); // Reload the list
        alert(`Sync completed! Processed ${response.data.processed.success} transcriptions successfully.`);
      } else {
        setError('Sync failed: ' + response.error);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setError('Failed to sync transcriptions from Daily.co');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    try {
      const response = await transcriptionAPI.retryFailedFetches();
      if (response.success) {
        await loadTranscriptions();
        alert(`Retry completed! ${response.data.success} transcriptions processed successfully.`);
      } else {
        setError('Retry failed: ' + response.error);
      }
    } catch (error) {
      console.error('Retry failed:', error);
      setError('Failed to retry failed transcriptions');
    }
  };

  const handleViewTranscription = async (transcription) => {
    try {
      const response = await transcriptionAPI.getTranscriptionById(transcription.id);
      if (response.success) {
        setSelectedTranscription(response.transcription);
      }
    } catch (error) {
      console.error('Failed to load transcription details:', error);
      setError('Failed to load transcription details');
    }
  };

  const handleFetchContent = async (transcriptionId) => {
    try {
      const response = await transcriptionAPI.fetchTranscriptionContent(transcriptionId);
      if (response.success) {
        await loadTranscriptions(); // Reload to show updated status
        alert('Transcription content fetched successfully!');
      } else {
        setError('Failed to fetch content: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
      setError('Failed to fetch transcription content');
    }
  };

  const getStatusBadge = (transcription) => {
    const { status, fetchStatus, hasContent } = transcription;
    
    if (fetchStatus === 'failed') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Failed</span>;
    }
    
    if (fetchStatus === 'fetching') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Fetching...</span>;
    }
    
    if (status === 'finished' && hasContent) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Complete</span>;
    }
    
    if (status === 'finished' && !hasContent) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Ready to Fetch</span>;
    }
    
    if (status === 'processing') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">Processing</span>;
    }
    
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transcription Manager</h1>
            <p className="text-gray-600">Manage Daily.co meeting transcriptions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRetryFailed}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Failed
          </button>
          
          <button
            onClick={handleSyncTranscriptions}
            disabled={isSyncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSyncing ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync from Daily.co'}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="all">All Transcriptions</option>
            <option value="finished">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Transcriptions List */}
      {transcriptions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transcriptions Found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? 'No transcriptions available. Try syncing from Daily.co.' 
              : `No ${filter} transcriptions found.`
            }
          </p>
          <button
            onClick={handleSyncTranscriptions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sync from Daily.co
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {transcriptions.map((transcription) => (
              <div key={transcription.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Client and Meeting Info */}
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {transcription.client?.firstName} {transcription.client?.lastName}
                      </span>
                      {getStatusBadge(transcription)}
                    </div>
                    
                    {/* Meeting Details */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(transcription.createdAt).toLocaleString()}</span>
                      </div>
                      {transcription.duration > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(transcription.duration)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Meeting Room */}
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Meeting:</span> {transcription.meeting?.roomName}
                    </div>
                    
                    {/* Summary if available */}
                    {transcription.summary && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Summary:</span> {transcription.summary.participantCount} participants, {transcription.summary.keyPoints?.length || 0} key points
                      </div>
                    )}
                    
                    {/* Fetch Status */}
                    {transcription.fetchedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Content fetched: {new Date(transcription.fetchedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {transcription.hasContent ? (
                      <button
                        onClick={() => handleViewTranscription(transcription)}
                        className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        View Content
                      </button>
                    ) : transcription.status === 'finished' ? (
                      <button
                        onClick={() => handleFetchContent(transcription.id)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Fetch Content
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3 py-2 bg-gray-300 text-gray-500 text-sm rounded cursor-not-allowed flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        {transcription.status === 'processing' ? 'Processing...' : 'Not Ready'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => window.open(`/meetings/${transcription.meeting?.id || transcription.meeting?._id}`, '_blank')}
                      className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Meeting
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcription Viewer Modal */}
      {selectedTranscription && (
        <TranscriptionViewerModal
          transcription={selectedTranscription}
          onClose={() => setSelectedTranscription(null)}
        />
      )}
    </div>
  );
};

// ========================================
// TranscriptionViewerModal Component
// ========================================
const TranscriptionViewerModal = ({ transcription, onClose }) => {
  const [activeTab, setActiveTab] = useState('content'); // content, parsed, summary

  const downloadTranscript = () => {
    if (!transcription.content) return;

    const blob = new Blob([transcription.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${transcription.transcriptId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatWebVTTContent = (content) => {
    if (!content) return '';
    
    // Convert WebVTT to readable format
    const lines = content.split('\n');
    let formattedContent = '';
    let currentSpeaker = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('-->')) {
        const textLine = lines[i + 1]?.trim();
        if (textLine) {
          const speakerMatch = textLine.match(/^([^:]+):\s*(.+)$/);
          if (speakerMatch) {
            const speaker = speakerMatch[1].trim();
            const text = speakerMatch[2].trim();
            
            if (speaker !== currentSpeaker) {
              formattedContent += `\n\n${speaker}:\n`;
              currentSpeaker = speaker;
            }
            formattedContent += `${text} `;
          } else {
            formattedContent += `${textLine} `;
          }
          i++; // Skip the text line
        }
      }
    }
    
    return formattedContent.trim();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Transcription Details</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                <span>{transcription.client?.firstName} {transcription.client?.lastName}</span>
                <span>•</span>
                <span>{transcription.meeting?.roomName}</span>
                <span>•</span>
                <span>{new Date(transcription.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={downloadTranscript}
                disabled={!transcription.content}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('content')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Raw Content
              </button>
              <button
                onClick={() => setActiveTab('parsed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'parsed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Formatted Transcript
              </button>
              {transcription.parsedTranscript?.summary && (
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'summary'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Summary
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'content' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {transcription.content || 'No content available'}
              </pre>
            </div>
          )}

          {activeTab === 'parsed' && (
            <div className="space-y-4">
              {transcription.content ? (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line text-gray-800 leading-relaxed">
                    {formatWebVTTContent(transcription.content)}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No formatted transcript available</p>
              )}
            </div>
          )}

          {activeTab === 'summary' && transcription.parsedTranscript?.summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {Math.floor((transcription.parsedTranscript.summary.duration || 0) / 60)}m
                  </div>
                  <div className="text-sm text-blue-700">Duration</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {transcription.parsedTranscript.summary.participantCount || 0}
                  </div>
                  <div className="text-sm text-green-700">Participants</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-900">
                    {transcription.parsedTranscript.summary.keyPoints?.length || 0}
                  </div>
                  <div className="text-sm text-purple-700">Key Points</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-900">
                    {transcription.parsedTranscript.speakers?.length || 0}
                  </div>
                  <div className="text-sm text-orange-700">Speakers</div>
                </div>
              </div>

              {/* Speakers Breakdown */}
              {transcription.parsedTranscript.speakers?.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Speaker Breakdown</h3>
                  <div className="space-y-3">
                    {transcription.parsedTranscript.speakers.map((speaker, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{speaker.speakerName}</span>
                          <span className="text-sm text-gray-600">
                            {speaker.segments?.length || 0} segments
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Total speaking time: {Math.floor((speaker.totalDuration || 0) / 60)}m {Math.floor((speaker.totalDuration || 0) % 60)}s
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionManager;
