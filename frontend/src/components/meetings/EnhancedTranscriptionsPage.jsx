import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  User, 
  ArrowLeft, 
  Calendar, 
  MessageSquare, 
  Play,
  Pause,
  Search,
  RefreshCw,
  Download,
  Clock,
  Users,
  Target,
  ListChecks,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { enhancedTranscriptionAPI } from '../../services/enhancedTranscriptionAPI';

// Utility function to format duration from seconds to readable format
const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const EnhancedTranscriptionsPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isBulkParsing, setIsBulkParsing] = useState(false);
  const [bulkParseProgress, setBulkParseProgress] = useState(null);

  useEffect(() => {
    loadTranscriptions();
  }, []);

  const loadTranscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await enhancedTranscriptionAPI.getAdvisorTranscriptions();
      setMeetings(response.meetings || []);
    } catch (error) {
      console.error('Error loading transcriptions:', error);
      setError('Failed to load transcriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseTranscription = async (meetingId) => {
    try {
      const response = await enhancedTranscriptionAPI.parseMeetingTranscription(meetingId);
      if (response.success) {
        // Update the meeting in the list
        setMeetings(prev => prev.map(meeting => 
          meeting._id === meetingId 
            ? { ...meeting, hasParsedData: true, needsParsing: false }
            : meeting
        ));
        
        // If this meeting is selected, update it
        if (selectedMeeting && selectedMeeting._id === meetingId) {
          setSelectedMeeting(prev => ({ ...prev, hasParsedData: true, needsParsing: false }));
        }
      }
    } catch (error) {
      console.error('Error parsing transcription:', error);
      setError('Failed to parse transcription');
    }
  };

  const handleBulkParse = async () => {
    try {
      setIsBulkParsing(true);
      setBulkParseProgress({ status: 'Starting bulk parse...', processed: 0, total: 0 });
      
      const response = await enhancedTranscriptionAPI.bulkParseTranscriptions();
      
      if (response.success) {
        setBulkParseProgress({
          status: 'Bulk parse completed!',
          processed: response.results.total,
          total: response.results.total,
          results: response.results
        });
        
        // Reload transcriptions to get updated data
        setTimeout(() => {
          loadTranscriptions();
          setBulkParseProgress(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error in bulk parse:', error);
      setBulkParseProgress({
        status: 'Bulk parse failed',
        error: error.message
      });
    } finally {
      setIsBulkParsing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const response = await enhancedTranscriptionAPI.searchTranscriptions(searchQuery);
      setSearchResults(response.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatTimestamp = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (selectedMeeting) {
    return (
      <MeetingTranscriptionDetails 
        meeting={selectedMeeting} 
        onBack={() => setSelectedMeeting(null)}
        onParse={() => handleParseTranscription(selectedMeeting._id)}
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
       <div className="bg-green-50 border border-green-200 rounded-lg p-4">
         <p className="text-green-700">{error}</p>
       </div>
     );
   }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
                     <div className="flex items-center gap-3 mb-2">
             <FileText className="h-8 w-8 text-green-600" />
             <h1 className="text-3xl font-bold text-blue-900">Enhanced Meeting Transcriptions</h1>
           </div>
           <p className="text-blue-700">
             View and manage parsed transcription data from Daily.co meetings
           </p>
        </div>
        
        <div className="flex items-center gap-3">
                     <button
             onClick={handleBulkParse}
             disabled={isBulkParsing}
             className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
           >
             {isBulkParsing ? (
               <Loader2 className="h-4 w-4 animate-spin" />
             ) : (
               <RefreshCw className="h-4 w-4" />
             )}
             {isBulkParsing ? 'Parsing...' : 'Bulk Parse All'}
           </button>
           
           <button
             onClick={loadTranscriptions}
             className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
           >
             <RefreshCw className="h-4 w-4" />
             Refresh
           </button>
        </div>
      </div>

             {/* Bulk Parse Progress */}
       {bulkParseProgress && (
         <div className="bg-green-50 border border-green-200 rounded-lg p-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <CheckCircle className="h-5 w-5 text-green-600" />
               <span className="font-medium text-green-800">{bulkParseProgress.status}</span>
             </div>
             {bulkParseProgress.results && (
               <div className="text-sm text-green-600">
                 {bulkParseProgress.results.successful} successful, {bulkParseProgress.results.failed} failed
               </div>
             )}
             <button
               onClick={() => setBulkParseProgress(null)}
               className="text-green-500 hover:text-green-700"
             >
               <X className="h-4 w-4" />
             </button>
           </div>
         </div>
       )}

             {/* Search Bar */}
       <div className="bg-white rounded-lg shadow p-4">
         <div className="flex gap-3">
           <div className="flex-1">
             <input
               type="text"
               placeholder="Search transcriptions by content..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
               className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
             />
           </div>
           <button
             onClick={handleSearch}
             disabled={isSearching || !searchQuery.trim()}
             className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center gap-2"
           >
             {isSearching ? (
               <Loader2 className="h-4 w-4 animate-spin" />
             ) : (
               <Search className="h-4 w-4" />
             )}
             Search
           </button>
         </div>
       </div>

             {/* Search Results */}
       {searchResults.length > 0 && (
         <div className="bg-white rounded-lg shadow">
           <div className="p-4 border-b border-blue-200">
             <h3 className="text-lg font-semibold text-blue-900">
               Search Results for "{searchQuery}"
             </h3>
             <p className="text-sm text-blue-700">{searchResults.length} results found</p>
           </div>
           <div className="divide-y divide-blue-200">
             {searchResults.map((result, index) => (
               <div key={index} className="p-4 hover:bg-blue-50">
                 <div className="flex items-center justify-between mb-2">
                   <div>
                     <h4 className="font-medium text-blue-900">
                       {result.client?.firstName} {result.client?.lastName}
                     </h4>
                     <p className="text-sm text-blue-700">{result.roomName}</p>
                   </div>
                   <span className="text-sm text-blue-600">
                     {new Date(result.scheduledAt).toLocaleDateString()}
                   </span>
                 </div>
                 <div className="space-y-2">
                   {result.matchingSegments.slice(0, 3).map((segment, segIndex) => (
                     <div key={segIndex} className="bg-blue-50 rounded p-2 text-sm">
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-xs text-blue-600">
                           {formatTimestamp(segment.startTime)}
                         </span>
                         {segment.speaker && (
                           <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                             {segment.speaker}
                           </span>
                         )}
                       </div>
                       <p className="text-blue-900">{segment.text}</p>
                     </div>
                   ))}
                   {result.matchingSegments.length > 3 && (
                     <p className="text-sm text-blue-600">
                       +{result.matchingSegments.length - 3} more matches
                     </p>
                   )}
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}

             {/* Transcriptions List */}
       {meetings.length === 0 ? (
         <div className="text-center py-12 bg-white rounded-lg shadow">
           <FileText className="h-16 w-16 text-blue-300 mx-auto mb-4" />
           <h3 className="text-lg font-medium text-blue-900 mb-2">No Transcriptions Found</h3>
           <p className="text-blue-700">No meetings with transcriptions have been conducted yet.</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {meetings.map((meeting) => (
             <div 
               key={meeting._id}
               className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-6"
             >
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                   <User className="h-6 w-6 text-blue-900" />
                 </div>
                 <div className="flex-1">
                   <h3 className="font-semibold text-blue-900">
                     {meeting.clientId?.firstName} {meeting.clientId?.lastName}
                   </h3>
                   <p className="text-sm text-blue-700">{meeting.clientId?.email}</p>
                 </div>
               </div>
               
               <div className="space-y-3">
                 <div className="flex items-center gap-2 text-sm text-blue-700">
                   <MessageSquare className="h-4 w-4" />
                   <span>{meeting.roomName}</span>
                 </div>
                 
                 <div className="flex items-center gap-2 text-sm text-blue-700">
                   <Calendar className="h-4 w-4" />
                   <span>{new Date(meeting.scheduledAt).toLocaleDateString()}</span>
                 </div>

                 {/* Transcription Status */}
                 <div className="flex items-center gap-2">
                   {meeting.hasParsedData ? (
                     <div className="flex items-center gap-2 text-green-600">
                       <CheckCircle className="h-4 w-4" />
                       <span className="text-sm font-medium">Parsed</span>
                     </div>
                   ) : meeting.needsParsing ? (
                     <div className="flex items-center gap-2 text-green-500">
                       <AlertCircle className="h-4 w-4" />
                       <span className="text-sm font-medium">Needs Parsing</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 text-blue-600">
                       <FileText className="h-4 w-4" />
                       <span className="text-sm font-medium">No VTT URL</span>
                     </div>
                   )}
                 </div>

                 {/* Action Buttons */}
                 <div className="flex gap-2 pt-2">
                   {meeting.needsParsing && (
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         handleParseTranscription(meeting._id);
                       }}
                       className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                     >
                       Parse Now
                     </button>
                   )}
                   
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       setSelectedMeeting(meeting);
                     }}
                     className="flex-1 px-3 py-2 bg-blue-900 text-white text-sm rounded hover:bg-blue-800 transition-colors"
                   >
                     View Details
                   </button>
                 </div>
               </div>
             </div>
           ))}
         </div>
       )}
    </div>
  );
};

// Meeting Transcription Details Component
const MeetingTranscriptionDetails = ({ meeting, onBack, onParse }) => {
  const [transcriptionDetails, setTranscriptionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (meeting.hasParsedData) {
      loadTranscriptionDetails();
    }
  }, [meeting._id]);

  const loadTranscriptionDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await enhancedTranscriptionAPI.getMeetingTranscriptionDetails(meeting._id);
      setTranscriptionDetails(response.data);
    } catch (error) {
      console.error('Error loading transcription details:', error);
      setError('Failed to load transcription details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParse = async () => {
    await onParse();
    if (meeting.hasParsedData) {
      loadTranscriptionDetails();
    }
  };

  if (!meeting.hasParsedData && !meeting.needsParsing) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transcription Data</h3>
          <p className="text-gray-600 mb-4">
            This meeting doesn't have any transcription data available.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  if (meeting.needsParsing) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-orange-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Transcription Needs Parsing</h3>
          <p className="text-gray-600 mb-4">
            This meeting has a transcription URL but the content hasn't been parsed yet.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleParse}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Parse Transcription
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transcription details...</p>
        </div>
      </div>
    );
  }

     if (error || !transcriptionDetails) {
     return (
       <div className="bg-green-50 border border-green-200 rounded-lg p-4">
         <p className="text-green-700">{error || 'Failed to load transcription details'}</p>
         <button
           onClick={onBack}
           className="mt-3 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
         >
           Back to List
         </button>
       </div>
     );
   }

  const { transcription } = transcriptionDetails;

  // Add safety checks and fallbacks for transcription data
  const safeTranscription = {
    totalDuration: transcription?.totalDuration || 0,
    totalSegments: transcription?.totalSegments || 0,
    speakers: transcription?.speakers || [],
    segments: transcription?.segments || [],
    summary: {
      keyPoints: transcription?.summary?.keyPoints || [],
      actionItems: transcription?.summary?.actionItems || [],
      decisions: transcription?.summary?.decisions || [],
      participantCount: transcription?.summary?.participantCount || 0,
      participationRate: transcription?.summary?.participationRate || []
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
             <div className="p-6 border-b border-blue-200">
         <div className="flex items-center justify-between">
           <div>
             <button
               onClick={onBack}
               className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2"
             >
               <ArrowLeft className="h-4 w-4" />
               Back to Transcriptions
             </button>
             <h2 className="text-2xl font-bold text-blue-900">
               {meeting.clientId?.firstName} {meeting.clientId?.lastName} - Meeting Transcription
             </h2>
             <div className="flex items-center gap-4 text-sm text-blue-700 mt-2">
               <span>{meeting.roomName}</span>
               <span>•</span>
               <span>{new Date(meeting.scheduledAt).toLocaleDateString()}</span>
               <span>•</span>
               <span>{formatDuration(safeTranscription.totalDuration)}</span>
             </div>
           </div>
         </div>
       </div>

             {/* Tab Navigation */}
       <div className="px-6 pt-4">
         <div className="border-b border-blue-200">
           <nav className="-mb-px flex space-x-8">
             {[
               { id: 'overview', label: 'Overview', icon: Target },
               { id: 'transcript', label: 'Full Transcript', icon: FileText },
               { id: 'speakers', label: 'Speakers', icon: Users },
               { id: 'summary', label: 'AI Summary', icon: Brain }
             ].map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                   activeTab === tab.id
                     ? 'border-green-500 text-green-600'
                     : 'border-transparent text-blue-600 hover:text-blue-800 hover:border-blue-300'
                 }`}
               >
                 <tab.icon className="h-4 w-4" />
                 {tab.label}
               </button>
             ))}
           </nav>
         </div>
       </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-blue-50 rounded-lg p-4">
                 <div className="flex items-center gap-3">
                   <Clock className="h-8 w-8 text-blue-900" />
                   <div>
                     <p className="text-sm text-blue-700">Total Duration</p>
                     <p className="text-2xl font-bold text-blue-900">
                       {formatDuration(safeTranscription.totalDuration)}
                     </p>
                   </div>
                 </div>
               </div>
               
               <div className="bg-green-50 rounded-lg p-4">
                 <div className="flex items-center gap-3">
                   <Users className="h-8 w-8 text-green-600" />
                   <div>
                     <p className="text-sm text-green-600">Speakers</p>
                     <p className="text-2xl font-bold text-green-900">
                       {safeTranscription.speakers.length}
                     </p>
                   </div>
                 </div>
               </div>
               
               <div className="bg-blue-50 rounded-lg p-4">
                 <div className="flex items-center gap-3">
                   <FileText className="h-8 w-8 text-blue-900" />
                   <div>
                     <p className="text-sm text-blue-700">Segments</p>
                     <p className="text-2xl font-bold text-blue-900">
                       {safeTranscription.totalSegments}
                     </p>
                   </div>
                 </div>
               </div>
             </div>

                         {/* Key Points */}
             <div className="bg-white border border-blue-200 rounded-lg p-4">
               <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                 <Target className="h-5 w-5 text-blue-900" />
                 Key Points
               </h3>
               <ul className="space-y-2">
                 {safeTranscription.summary.keyPoints.map((point, index) => (
                   <li key={index} className="flex items-start gap-2">
                     <span className="w-2 h-2 bg-blue-900 rounded-full mt-2 flex-shrink-0"></span>
                     <span className="text-blue-900">{point}</span>
                   </li>
                 ))}
               </ul>
             </div>

             {/* Action Items */}
             <div className="bg-white border border-green-200 rounded-lg p-4">
               <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                 <ListChecks className="h-5 w-5 text-green-600" />
                 Action Items
               </h3>
               <ul className="space-y-2">
                 <ul className="space-y-2">
                   {safeTranscription.summary.actionItems.map((item, index) => (
                     <li key={index} className="flex items-start gap-2">
                       <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                       <span className="text-green-900">{item}</span>
                     </li>
                   ))}
                 </ul>
               </ul>
             </div>
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-900">Full Transcript</h3>
              <button className="px-3 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {safeTranscription.segments.map((segment, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-blue-600 font-mono">
                       {formatTimestamp(segment.startTime)}
                    </span>
                    {segment.speaker && (
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        {segment.speaker}
                      </span>
                    )}
                  </div>
                  <p className="text-blue-900 bg-white p-3 rounded border border-blue-200">
                    {segment.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'speakers' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-900">Speaker Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeTranscription.speakers.map((speaker, index) => (
                <div key={index} className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-900">{speaker.name}</h4>
                    <span className="text-sm text-blue-600">
                      {speaker.messageCount} messages
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">Speaking Time:</span>
                      <span className="font-medium">{formatDuration(speaker.totalDuration)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">Participation:</span>
                      <span className="font-medium">
                        {((speaker.totalDuration / safeTranscription.totalDuration) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-blue-900">AI-Generated Summary</h3>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Meeting Overview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Duration:</span>
                  <span className="ml-2 text-blue-900">{formatDuration(safeTranscription.totalDuration)}</span>
                </div>
                <div>
                  <span className="text-blue-700">Participants:</span>
                  <span className="ml-2 text-blue-900">{safeTranscription.summary.participantCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Decisions Made</h4>
              <ul className="space-y-2">
                {safeTranscription.summary.decisions.map((decision, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-900 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-blue-900">{decision}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Participation Breakdown</h4>
              <div className="space-y-3">
                {safeTranscription.summary.participationRate.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-blue-900">{participant.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${participant.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-blue-700 w-12 text-right">
                        {participant.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTranscriptionsPage;
