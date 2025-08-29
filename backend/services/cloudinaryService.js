/**
 * FILE LOCATION: backend/services/cloudinaryService.js
 * 
 * PURPOSE: Cloudinary integration for PDF storage with local backup
 * 
 * FUNCTIONALITY: Upload PDFs to Cloudinary and maintain local copies
 */

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
  constructor() {
    this.isConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && 
                           process.env.CLOUDINARY_API_KEY && 
                           process.env.CLOUDINARY_API_SECRET);
    
    if (this.isConfigured) {
      logger.info('✅ Cloudinary service configured successfully');
    } else {
      logger.warn('⚠️ Cloudinary not configured - using local storage only');
    }
  }

  /**
   * Upload PDF to Cloudinary with local backup
   */
  async uploadPDF(pdfBuffer, fileName, options = {}) {
    const result = {
      success: false,
      localUrl: null,
      cloudUrl: null,
      error: null
    };

    try {
      // 1. Save to local storage first
      const localUrl = await this.saveToLocal(pdfBuffer, fileName);
      result.localUrl = localUrl;
      result.success = true;

      // 2. Upload to Cloudinary if configured
      if (this.isConfigured) {
        try {
          const cloudUrl = await this.uploadToCloudinary(pdfBuffer, fileName, options);
          result.cloudUrl = cloudUrl;
          logger.info('✅ PDF uploaded to both local and Cloudinary', {
            fileName,
            localUrl,
            cloudUrl
          });
        } catch (cloudError) {
          logger.error('❌ Cloudinary upload failed, keeping local copy', {
            fileName,
            error: cloudError.message
          });
          result.error = `Cloudinary upload failed: ${cloudError.message}`;
        }
      } else {
        logger.info('📁 PDF saved to local storage only', { fileName, localUrl });
      }

    } catch (error) {
      logger.error('❌ PDF upload failed completely', {
        fileName,
        error: error.message
      });
      result.error = error.message;
      result.success = false;
    }

    return result;
  }

  /**
   * Save PDF to local storage
   */
  async saveToLocal(pdfBuffer, fileName) {
    const uploadsDir = path.join(__dirname, '../uploads/loe');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    return `/uploads/loe/${fileName}`;
  }

  /**
   * Upload PDF to Cloudinary
   */
  async uploadToCloudinary(pdfBuffer, fileName, options = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'loe-pdfs',
          public_id: fileName.replace('.pdf', ''),
          format: 'pdf',
          ...options
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      );

      // Convert buffer to stream
      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(pdfBuffer);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Get PDF URL (prefer Cloudinary, fallback to local)
   */
  async getPDFUrl(fileName, cloudUrl = null) {
    if (cloudUrl && this.isConfigured) {
      return cloudUrl; // Use Cloudinary URL if available
    }

    // Fallback to local URL
    const localUrl = `/uploads/loe/${fileName}`;
    const localPath = path.join(__dirname, '../uploads/loe', fileName);
    
    if (fs.existsSync(localPath)) {
      return localUrl;
    }

    throw new Error('PDF file not found in local storage');
  }

  /**
   * Delete PDF from both local and Cloudinary
   */
  async deletePDF(fileName, cloudUrl = null) {
    const result = {
      localDeleted: false,
      cloudDeleted: false,
      error: null
    };

    try {
      // Delete from local storage
      const localPath = path.join(__dirname, '../uploads/loe', fileName);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        result.localDeleted = true;
        logger.info('✅ PDF deleted from local storage', { fileName });
      }

      // Delete from Cloudinary if configured
      if (this.isConfigured && cloudUrl) {
        try {
          const publicId = cloudUrl.split('/').pop().replace('.pdf', '');
          await cloudinary.uploader.destroy(`loe-pdfs/${publicId}`, {
            resource_type: 'raw'
          });
          result.cloudDeleted = true;
          logger.info('✅ PDF deleted from Cloudinary', { fileName });
        } catch (cloudError) {
          logger.error('❌ Failed to delete from Cloudinary', {
            fileName,
            error: cloudError.message
          });
          result.error = `Cloudinary deletion failed: ${cloudError.message}`;
        }
      }

    } catch (error) {
      logger.error('❌ PDF deletion failed', {
        fileName,
        error: error.message
      });
      result.error = error.message;
    }

    return result;
  }

  /**
   * Check if Cloudinary is available
   */
  isCloudinaryAvailable() {
    return this.isConfigured;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    const stats = {
      cloudinaryConfigured: this.isConfigured,
      localFilesCount: 0,
      cloudinaryFilesCount: 0
    };

    try {
      // Count local files
      const localDir = path.join(__dirname, '../uploads/loe');
      if (fs.existsSync(localDir)) {
        const files = fs.readdirSync(localDir);
        stats.localFilesCount = files.filter(file => file.endsWith('.pdf')).length;
      }

      // Count Cloudinary files if configured
      if (this.isConfigured) {
        try {
          const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'loe-pdfs/',
            resource_type: 'raw',
            max_results: 1
          });
          stats.cloudinaryFilesCount = result.total_count || 0;
        } catch (error) {
          logger.error('Failed to get Cloudinary stats', { error: error.message });
        }
      }
    } catch (error) {
      logger.error('Failed to get storage stats', { error: error.message });
    }

    return stats;
  }
}

// Create singleton instance
const cloudinaryService = new CloudinaryService();

module.exports = cloudinaryService;
