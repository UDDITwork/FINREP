const axios = require('axios');
const { logger } = require('../utils/logger');

class TranscriptionParserService {
  constructor() {
    this.logger = logger;
  }

  /**
   * Parse WebVTT content from Daily.co transcription URL
   * @param {string} vttUrl - The Daily.co transcription download URL
   * @returns {Object} Parsed transcription data
   */
  async parseTranscriptionFromUrl(vttUrl) {
    const requestId = `PARSE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.logger.info('📄 [TRANSCRIPTION PARSER] Starting VTT parsing', {
        requestId,
        vttUrl: vttUrl.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });

      // Download the VTT content
      const response = await axios.get(vttUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'FINREP-TranscriptionParser/1.0'
        }
      });

      const vttContent = response.data;
      
      this.logger.info('✅ [TRANSCRIPTION PARSER] VTT content downloaded', {
        requestId,
        contentLength: vttContent.length,
        timestamp: new Date().toISOString()
      });

      // Parse the VTT content
      const parsedData = this.parseVTTContent(vttContent);
      
      this.logger.info('✅ [TRANSCRIPTION PARSER] VTT content parsed successfully', {
        requestId,
        speakerCount: parsedData.speakers.length,
        totalSegments: parsedData.totalSegments,
        totalDuration: parsedData.totalDuration,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: parsedData,
        requestId
      };

    } catch (error) {
      this.logger.error('❌ [TRANSCRIPTION PARSER] Failed to parse transcription', {
        requestId,
        error: error.message,
        status: error.response?.status,
        vttUrl: vttUrl.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: error.message,
        requestId
      };
    }
  }

  /**
   * Parse WebVTT content and extract structured data
   * @param {string} vttContent - Raw WebVTT content
   * @returns {Object} Structured transcription data
   */
  parseVTTContent(vttContent) {
    const lines = vttContent.split('\n');
    const segments = [];
    let currentSegment = null;
    let speakerMap = new Map();
    let speakerCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and WebVTT header
      if (!line || line.startsWith('WEBVTT') || line.startsWith('NOTE')) {
        continue;
      }

      // Check if line contains timestamp (format: HH:MM:SS.mmm --> HH:MM:SS.mmm)
      const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
      
      if (timestampMatch) {
        // Save previous segment if exists
        if (currentSegment) {
          segments.push(currentSegment);
        }
        
        // Start new segment
        currentSegment = {
          startTime: this.parseTimestamp(timestampMatch[1]),
          endTime: this.parseTimestamp(timestampMatch[2]),
          text: '',
          speaker: null,
          confidence: 0.9 // Default confidence
        };
      } else if (currentSegment && line) {
        // This line contains text content
        if (!currentSegment.text) {
          currentSegment.text = line;
          
          // Try to identify speaker from text
          const speakerMatch = line.match(/^([A-Z][a-z]+):\s*(.*)/);
          if (speakerMatch) {
            const speakerName = speakerMatch[1];
            currentSegment.text = speakerMatch[2];
            
            if (!speakerMap.has(speakerName)) {
              speakerMap.set(speakerName, {
                id: `speaker_${speakerCounter++}`,
                name: speakerName,
                totalDuration: 0,
                segments: []
              });
            }
            currentSegment.speaker = speakerName;
          }
        } else {
          // Append additional lines
          currentSegment.text += ' ' + line;
        }
      }
    }

    // Add the last segment
    if (currentSegment) {
      segments.push(currentSegment);
    }

    // Calculate speaker statistics
    const speakers = Array.from(speakerMap.values());
    speakers.forEach(speaker => {
      speaker.segments = segments.filter(s => s.speaker === speaker.name);
      speaker.totalDuration = speaker.segments.reduce((total, seg) => {
        return total + (seg.endTime - seg.startTime);
      }, 0);
      speaker.messageCount = speaker.segments.length;
    });

    // Calculate total duration
    const totalDuration = segments.length > 0 ? 
      Math.max(...segments.map(s => s.endTime)) : 0;

    // Generate summary and key points
    const summary = this.generateSummary(segments, speakers);

    return {
      segments,
      speakers,
      totalDuration,
      totalSegments: segments.length,
      summary,
      rawVTT: vttContent,
      parsedAt: new Date()
    };
  }

  /**
   * Parse timestamp string to seconds
   * @param {string} timestamp - Timestamp in HH:MM:SS.mmm format
   * @returns {number} Time in seconds
   */
  parseTimestamp(timestamp) {
    const parts = timestamp.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseFloat(parts[2]);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Generate summary from transcription segments
   * @param {Array} segments - Transcription segments
   * @param {Array} speakers - Speaker information
   * @returns {Object} Summary data
   */
  generateSummary(segments, speakers) {
    const allText = segments.map(s => s.text).join(' ');
    
    // Extract potential action items (lines ending with action words)
    const actionWords = ['will', 'going to', 'need to', 'should', 'must', 'plan to'];
    const actionItems = segments
      .filter(s => actionWords.some(word => s.text.toLowerCase().includes(word)))
      .map(s => s.text)
      .slice(0, 5); // Limit to 5 action items

    // Extract key points (longer segments with important keywords)
    const keyWords = ['important', 'key', 'critical', 'main', 'primary', 'essential'];
    const keyPoints = segments
      .filter(s => s.text.length > 20 && keyWords.some(word => s.text.toLowerCase().includes(word)))
      .map(s => s.text)
      .slice(0, 5); // Limit to 5 key points

    // Calculate participation metrics
    const totalSpeakingTime = speakers.reduce((total, s) => total + s.totalDuration, 0);
    const participationRate = speakers.map(s => ({
      name: s.name,
      percentage: totalSpeakingTime > 0 ? (s.totalDuration / totalSpeakingTime * 100).toFixed(1) : 0,
      duration: s.totalDuration,
      messageCount: s.messageCount
    }));

    return {
      keyPoints: keyPoints.length > 0 ? keyPoints : ['No specific key points identified'],
      actionItems: actionItems.length > 0 ? actionItems : ['No specific action items identified'],
      decisions: this.extractDecisions(segments),
      participantCount: speakers.length,
      totalDuration: totalSpeakingTime,
      participationRate,
      generatedAt: new Date()
    };
  }

  /**
   * Extract potential decisions from transcription
   * @param {Array} segments - Transcription segments
   * @returns {Array} Decision statements
   */
  extractDecisions(segments) {
    const decisionKeywords = ['decided', 'agreed', 'concluded', 'resolved', 'determined', 'chose'];
    
    return segments
      .filter(s => decisionKeywords.some(word => s.text.toLowerCase().includes(word)))
      .map(s => s.text)
      .slice(0, 3); // Limit to 3 decisions
  }

  /**
   * Format timestamp for display
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted timestamp
   */
  formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

module.exports = new TranscriptionParserService();
