const cron = require('node-cron');
const DailyTranscriptionService = require('../services/dailyTranscriptionService');
const { logger } = require('../utils/logger');

class TranscriptionSyncJob {
  constructor() {
    this.dailyService = new DailyTranscriptionService();
    this.isRunning = false;
  }

  // Run sync job
  async run() {
    if (this.isRunning) {
      logger.warn('⚠️ Transcription sync job already running, skipping');
      return;
    }

    this.isRunning = true;

    try {
      logger.info('🚀 Starting scheduled transcription sync job');

      // Sync all transcriptions
      const syncResult = await this.dailyService.syncAllTranscriptions();
      
      if (syncResult.success) {
        logger.info('✅ Scheduled transcription sync completed', syncResult);
      } else {
        logger.error('❌ Scheduled transcription sync failed', {
          error: syncResult.error
        });
      }

      // Retry failed fetches
      const retryResult = await this.dailyService.retryFailedFetches();
      
      if (retryResult.success) {
        logger.info('✅ Failed transcription retries completed', retryResult);
      } else {
        logger.error('❌ Failed transcription retries failed', {
          error: retryResult.error
        });
      }

    } catch (error) {
      logger.error('❌ Transcription sync job error', {
        error: error.message,
        stack: error.stack
      });
    } finally {
      this.isRunning = false;
    }
  }

  // Schedule the job to run every 05 minutes
  schedule() {
    cron.schedule('*/05 * * * *', () => {
      this.run();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    logger.info('📅 Transcription sync job scheduled to run every 05 minutes');
  }

  // Run job manually
  async runManually() {
    logger.info('🔧 Running transcription sync job manually');
    await this.run();
  }
}

// Export singleton instance
const transcriptionSyncJob = new TranscriptionSyncJob();

module.exports = transcriptionSyncJob;
