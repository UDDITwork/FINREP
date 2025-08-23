// services/dailyTranscriptionService.js
// ⭐ REWRITTEN FOR MEETING MODEL ONLY APPROACH + HEAVY LOGGING

const axios = require('axios');
const Meeting = require('../models/Meeting'); // ✅ Only Meeting model
// const Transcription = require('../models/Transcription'); // ❌ REMOVED
const { logger } = require('../utils/logger');

class DailyTranscriptionService {
  constructor() {
    this.apiKey = process.env.DAILY_API_KEY;
    this.baseURL = 'https://api.daily.co/v1';
    
    if (!this.apiKey) {
      throw new Error('DAILY_API_KEY is required');
    }

    this.apiHeaders = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    console.log('🔧 [DAILY SERVICE] Initialized with Meeting model only approach');
  }

  /**
   * ⭐ ENHANCED: Fetch all transcriptions from Daily.co API
   */
  async fetchAllTranscriptions(limit = 100) {
    const requestId = `FETCH_ALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('🔍 [DAILY SERVICE] Fetching transcriptions from Daily.co API:', {
        requestId,
        limit,
        timestamp: new Date().toISOString()
      });

      const response = await axios.get(`${this.baseURL}/transcript`, {
        headers: this.apiHeaders,
        params: { limit }
      });

      console.log('✅ [DAILY SERVICE] Transcriptions fetched successfully:', {
        requestId,
        count: response.data.data?.length || 0,
        totalCount: response.data.total_count
      });

      return {
        success: true,
        transcriptions: response.data.data || [],
        totalCount: response.data.total_count || 0,
        requestId
      };
    } catch (error) {
      console.error('❌ [DAILY SERVICE] Failed to fetch transcriptions from Daily.co:', {
        requestId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      return {
        success: false,
        error: error.message,
        details: error.response?.data,
        requestId
      };
    }
  }

  /**
   * ⭐ ENHANCED: Get transcription download link
   */
  async getTranscriptionDownloadLink(transcriptId) {
    const requestId = `GET_LINK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('🔗 [DAILY SERVICE] Getting transcription download link:', {
        requestId,
        transcriptId,
        timestamp: new Date().toISOString()
      });

      const response = await axios.get(
        `${this.baseURL}/transcript/${transcriptId}/access-link`,
        {
          headers: this.apiHeaders
        }
      );

      console.log('✅ [DAILY SERVICE] Download link retrieved successfully:', {
        requestId,
        transcriptId,
        hasLink: !!response.data.link,
        linkExpires: response.data.expires
      });

      return {
        success: true,
        downloadUrl: response.data.link,
        expiresAt: response.data.expires,
        requestId
      };
    } catch (error) {
      console.error('❌ [DAILY SERVICE] Failed to get transcription download link:', {
        requestId,
        transcriptId,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      });

      return {
        success: false,
        error: error.message,
        requestId
      };
    }
  }

  /**
   * ⭐ ENHANCED: Download transcription content
   */
  async downloadTranscriptionContent(downloadUrl) {
    const requestId = `DOWNLOAD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('⬇️ [DAILY SERVICE] Downloading transcription content:', {
        requestId,
        downloadUrl,
        timestamp: new Date().toISOString()
      });

      const response = await axios.get(downloadUrl, {
        headers: {
          'Accept': 'text/vtt, text/plain, */*'
        }
      });

      console.log('✅ [DAILY SERVICE] Content downloaded successfully:', {
        requestId,
        contentLength: response.data?.length || 0,
        format: this.detectTranscriptFormat(response.data),
        startsWithWebVTT: response.data?.startsWith('WEBVTT')
      });

      return {
        success: true,
        content: response.data,
        format: this.detectTranscriptFormat(response.data),
        requestId
      };
    } catch (error) {
      console.error('❌ [DAILY SERVICE] Failed to download transcription content:', {
        requestId,
        downloadUrl,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        requestId
      };
    }
  }

  /**
   * ⭐ REWRITTEN: Process and store transcription in Meeting model ONLY
   */
  async processAndStoreTranscription(dailyTranscript) {
    const requestId = `PROCESS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('💾 [DAILY SERVICE] Processing and storing transcription in Meeting model:', {
        requestId,
        transcriptId: dailyTranscript.transcriptId,
        status: dailyTranscript.status,
        roomId: dailyTranscript.roomId,
        roomName: dailyTranscript.roomName,
        mtgSessionId: dailyTranscript.mtgSessionId,
        duration: dailyTranscript.duration,
        timestamp: new Date().toISOString()
      });

      // ⭐ STEP 1: Find matching meeting using enhanced Meeting model method
      const meeting = await Meeting.findByDailyTranscript({
        roomId: dailyTranscript.roomId,
        roomName: dailyTranscript.roomName,
        mtgSessionId: dailyTranscript.mtgSessionId,
        transcriptId: dailyTranscript.transcriptId
      });

      if (!meeting) {
        console.warn('⚠️ [DAILY SERVICE] No matching meeting found for transcription:', {
          requestId,
          transcriptId: dailyTranscript.transcriptId,
          searchCriteria: {
            roomId: dailyTranscript.roomId,
            roomName: dailyTranscript.roomName,
            mtgSessionId: dailyTranscript.mtgSessionId
          }
        });
        return { 
          success: false, 
          error: 'No matching meeting found',
          requestId 
        };
      }

      console.log('✅ [DAILY SERVICE] Found matching meeting:', {
        requestId,
        meetingId: meeting._id,
        roomName: meeting.roomName,
        dailyRoomId: meeting.dailyRoomId,
        clientName: meeting.clientId ? `${meeting.clientId.firstName} ${meeting.clientId.lastName}` : 'Unknown'
      });

      // ⭐ STEP 2: Update meeting with Daily.co transcript data using Meeting model method
      await meeting.updateWithDailyTranscript(dailyTranscript);

      console.log('✅ [DAILY SERVICE] Meeting updated with Daily.co transcript data:', {
        requestId,
        meetingId: meeting._id,
        transcriptId: meeting.transcript.transcriptId,
        transcriptStatus: meeting.transcript.status
      });

      // ⭐ STEP 3: If transcript is finished and VTT available, fetch and store content
      if (dailyTranscript.status === 't_finished' && dailyTranscript.isVttAvailable) {
        console.log('⬇️ [DAILY SERVICE] Transcript finished, fetching content...');
        
        const contentResult = await this.fetchAndStoreTranscriptionContentInMeeting(meeting, dailyTranscript.transcriptId);
        
        if (!contentResult.success) {
          console.error('❌ [DAILY SERVICE] Failed to fetch content for finished transcript:', {
            requestId,
            error: contentResult.error
          });
          return contentResult;
        }
      } else {
        console.log('⏳ [DAILY SERVICE] Transcript not ready for content fetch:', {
          requestId,
          transcriptId: dailyTranscript.transcriptId,
          status: dailyTranscript.status,
          isVttAvailable: dailyTranscript.isVttAvailable
        });
      }

      return {
        success: true,
        meeting,
        requestId
      };
    } catch (error) {
      console.error('❌ [DAILY SERVICE] Failed to process and store transcription:', {
        requestId,
        transcriptId: dailyTranscript.transcriptId,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        requestId
      };
    }
  }

  /**
   * ⭐ NEW METHOD: Fetch and store transcription content in Meeting model only
   */
  async fetchAndStoreTranscriptionContentInMeeting(meeting, transcriptId) {
    const requestId = `FETCH_CONTENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('📄 [DAILY SERVICE] Fetching and storing content in Meeting model:', {
        requestId,
        meetingId: meeting._id,
        transcriptId,
        timestamp: new Date().toISOString()
      });

      // ⭐ Mark as fetching using Meeting model method
      await meeting.markTranscriptFetching();

      // ⭐ Get download link
      const linkResult = await this.getTranscriptionDownloadLink(transcriptId);
      if (!linkResult.success) {
        await meeting.markTranscriptFetchFailed(new Error(linkResult.error));
        return { 
          success: false, 
          error: linkResult.error,
          requestId 
        };
      }

      console.log('🔗 [DAILY SERVICE] Download link obtained:', {
        requestId,
        hasLink: !!linkResult.downloadUrl,
        expiresAt: linkResult.expiresAt
      });

      // ⭐ Download content
      const contentResult = await this.downloadTranscriptionContent(linkResult.downloadUrl);
      if (!contentResult.success) {
        await meeting.markTranscriptFetchFailed(new Error(contentResult.error));
        return { 
          success: false, 
          error: contentResult.error,
          requestId 
        };
      }

      console.log('📄 [DAILY SERVICE] Content downloaded successfully:', {
        requestId,
        contentLength: contentResult.content?.length || 0,
        format: contentResult.format
      });

      // ⭐ Store content and mark as completed using Meeting model method
      await meeting.markTranscriptFetchCompleted({
        content: contentResult.content,
        downloadUrl: linkResult.downloadUrl,
        downloadExpiry: linkResult.expiresAt ? new Date(linkResult.expiresAt) : null
      });

      console.log('✅ [DAILY SERVICE] Transcription content stored in Meeting model successfully:', {
        requestId,
        meetingId: meeting._id,
        transcriptId,
        contentLength: contentResult.content?.length || 0,
        hasParsedTranscript: !!meeting.transcript.parsedTranscript
      });

      return { 
        success: true, 
        meeting,
        contentLength: contentResult.content?.length || 0,
        requestId 
      };
    } catch (error) {
      console.error('❌ [DAILY SERVICE] Failed to fetch and store transcription content:', {
        requestId,
        meetingId: meeting._id,
        transcriptId,
        error: error.message
      });

      await meeting.markTranscriptFetchFailed(error);
      return { 
        success: false, 
        error: error.message,
        requestId 
      };
    }
  }

  /**
   * ⭐ ENHANCED: Sync all transcriptions from Daily.co - Meeting model only
   */
  async syncAllTranscriptions() {
    const requestId = `SYNC_ALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('🔄 [DAILY SERVICE] Starting transcription sync from Daily.co (Meeting model only):', {
        requestId,
        timestamp: new Date().toISOString()
      });

      const result = await this.fetchAllTranscriptions(100);
      if (!result.success) {
        throw new Error(result.error);
      }

      const processedCount = { success: 0, failed: 0, skipped: 0 };

      console.log('📊 [DAILY SERVICE] Processing transcriptions:', {
        requestId,
        totalTranscriptions: result.transcriptions.length,
        timestamp: new Date().toISOString()
      });

      for (const dailyTranscript of result.transcriptions) {
        try {
          const processResult = await this.processAndStoreTranscription(dailyTranscript);
          if (processResult.success) {
            processedCount.success++;
            console.log('✅ [DAILY SERVICE] Processed transcription successfully:', {
              requestId,
              transcriptId: dailyTranscript.transcriptId,
              meetingId: processResult.meeting?._id
            });
          } else {
            processedCount.failed++;
            console.warn('⚠️ [DAILY SERVICE] Failed to process transcription:', {
              requestId,
              transcriptId: dailyTranscript.transcriptId,
              error: processResult.error
            });
          }
        } catch (error) {
          processedCount.failed++;
          console.error('❌ [DAILY SERVICE] Error processing transcription:', {
            requestId,
            transcriptId: dailyTranscript.transcriptId,
            error: error.message
          });
        }
      }

      console.log('✅ [DAILY SERVICE] Transcription sync completed:', {
        requestId,
        totalFetched: result.transcriptions.length,
        processed: processedCount,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        totalFetched: result.transcriptions.length,
        processed: processedCount,
        requestId
      };
    } catch (error) {
      console.error('❌ [DAILY SERVICE] Transcription sync failed:', {
        requestId,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        requestId
      };
    }
  }

  /**
   * ⭐ REWRITTEN: Retry failed transcription fetches - Meeting model only
   */
  async retryFailedFetches(maxAttempts = 3) {
    const requestId = `RETRY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('🔄 [DAILY SERVICE] Finding failed transcription fetches in Meeting model:', {
        requestId,
        maxAttempts,
        timestamp: new Date().toISOString()
      });

      // ⭐ Find meetings with failed transcript fetches using Meeting model
      const failedMeetings = await Meeting.find({
        'transcript.fetchStatus': 'failed',
        'transcript.fetchAttempts': { $lt: maxAttempts }
      }).populate('clientId');

      console.log('📊 [DAILY SERVICE] Found failed transcript fetches:', {
        requestId,
        count: failedMeetings.length,
        maxAttempts
      });

      let retryResults = { success: 0, failed: 0 };

      for (const meeting of failedMeetings) {
        try {
          console.log('🔄 [DAILY SERVICE] Retrying transcript fetch for meeting:', {
            requestId,
            meetingId: meeting._id,
            transcriptId: meeting.transcript.transcriptId,
            currentAttempts: meeting.transcript.fetchAttempts
          });

          if (meeting.transcript.transcriptId) {
            const result = await this.fetchAndStoreTranscriptionContentInMeeting(
              meeting, 
              meeting.transcript.transcriptId
            );
            
            if (result.success) {
              retryResults.success++;
              console.log('✅ [DAILY SERVICE] Retry successful for meeting:', {
                requestId,
                meetingId: meeting._id
              });
            } else {
              retryResults.failed++;
              console.log('❌ [DAILY SERVICE] Retry failed for meeting:', {
                requestId,
                meetingId: meeting._id,
                error: result.error
              });
            }
          } else {
            retryResults.failed++;
            console.log('⚠️ [DAILY SERVICE] No transcriptId found for retry:', {
              requestId,
              meetingId: meeting._id
            });
          }
        } catch (error) {
          retryResults.failed++;
          console.error('❌ [DAILY SERVICE] Retry exception for meeting:', {
            requestId,
            meetingId: meeting._id,
            error: error.message
          });
        }
      }

      console.log('✅ [DAILY SERVICE] Retry process completed:', {
        requestId,
        totalRetried: failedMeetings.length,
        retryResults,
        timestamp: new Date().toISOString()
      });

      return { 
        success: true, 
        retryResults,
        requestId 
      };
    } catch (error) {
      console.error('❌ [DAILY SERVICE] Failed to retry transcription fetches:', {
        requestId,
        error: error.message
      });
      return { 
        success: false, 
        error: error.message,
        requestId 
      };
    }
  }

  /**
   * ⭐ UTILITY: Detect transcript format
   */
  detectTranscriptFormat(content) {
    if (typeof content !== 'string') return 'unknown';
    
    if (content.startsWith('WEBVTT')) return 'webvtt';
    if (/^\d+$/.test(content.split('\n')[0])) return 'srt';
    return 'txt';
  }

  /**
   * ⭐ ENHANCED: Get meeting statistics for transcription processing
   */
  async getMeetingTranscriptionStats() {
    const requestId = `STATS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('📊 [DAILY SERVICE] Getting meeting transcription statistics:', {
        requestId,
        timestamp: new Date().toISOString()
      });

      const stats = await Meeting.aggregate([
        {
          $group: {
            _id: '$transcript.status',
            count: { $sum: 1 }
          }
        }
      ]);

      const fetchStats = await Meeting.aggregate([
        {
          $group: {
            _id: '$transcript.fetchStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      const summary = {
        transcriptStatus: {},
        fetchStatus: {},
        totalMeetings: 0
      };

      stats.forEach(stat => {
        summary.transcriptStatus[stat._id || 'not_started'] = stat.count;
        summary.totalMeetings += stat.count;
      });

      fetchStats.forEach(stat => {
        summary.fetchStatus[stat._id || 'pending'] = stat.count;
      });

      console.log('✅ [DAILY SERVICE] Transcription statistics compiled:', {
        requestId,
        summary,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        stats: summary,
        requestId
      };
    } catch (error) {
      console.error('❌ [DAILY SERVICE] Failed to get transcription statistics:', {
        requestId,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        requestId
      };
    }
  }
}

module.exports = DailyTranscriptionService;