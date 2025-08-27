/**
 * FILE LOCATION: backend/services/smepayService.js
 * 
 * SMEPay payment integration service for handling UPI payments
 * through dynamic QR codes and payment validation.
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

class SMEPayService {
  constructor() {
    this.clientId = process.env.SMEPAY_ID;
    this.clientSecret = process.env.SMEPAY_SECRET;
    this.baseUrl = 'https://apps.typof.in/api/external';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get access token from SMEPay API
   */
  async getAccessToken() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      logger.info('🔐 [SMEPay] Getting new access token...');

      const response = await axios.post(`${this.baseUrl}/auth`, {
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        // Set token expiry to 1 hour from now (assuming 1 hour validity)
        this.tokenExpiry = Date.now() + (60 * 60 * 1000);
        
        logger.info('✅ [SMEPay] Access token obtained successfully');
        return this.accessToken;
      } else {
        throw new Error('Invalid response from SMEPay auth API');
      }
    } catch (error) {
      logger.error('❌ [SMEPay] Error getting access token:', error.message);
      throw new Error('Failed to authenticate with SMEPay');
    }
  }

  /**
   * Create a new payment order
   */
  async createOrder(orderData) {
    try {
      const accessToken = await this.getAccessToken();
      
      logger.info('💰 [SMEPay] Creating payment order...', {
        amount: orderData.amount,
        orderId: orderData.orderId
      });

      const response = await axios.post(`${this.baseUrl}/create-order`, {
        client_id: this.clientId,
        amount: orderData.amount.toString(),
        order_id: orderData.orderId,
        callback_url: orderData.callbackUrl,
        customer_details: {
          email: orderData.customerDetails.email,
          mobile: orderData.customerDetails.mobile,
          name: orderData.customerDetails.name
        }
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status && response.data.order_slug) {
        logger.info('✅ [SMEPay] Order created successfully', {
          orderSlug: response.data.order_slug
        });
        
        return {
          success: true,
          orderSlug: response.data.order_slug,
          message: response.data.message
        };
      } else {
        throw new Error('Invalid response from SMEPay create-order API');
      }
    } catch (error) {
      logger.error('❌ [SMEPay] Error creating order:', error.message);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Validate payment status
   */
  async validateOrder(orderSlug, amount) {
    try {
      const accessToken = await this.getAccessToken();
      
      logger.info('🔍 [SMEPay] Validating payment...', {
        orderSlug,
        amount
      });

      const response = await axios.post(`${this.baseUrl}/validate-order`, {
        client_id: this.clientId,
        amount: amount.toString(),
        slug: orderSlug
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status !== undefined) {
        const isPaid = response.data.status && response.data.payment_status === 'paid';
        
        logger.info('✅ [SMEPay] Payment validation completed', {
          orderSlug,
          isPaid,
          paymentStatus: response.data.payment_status
        });
        
        return {
          success: true,
          isPaid,
          paymentStatus: response.data.payment_status,
          orderId: response.data.order_id
        };
      } else {
        throw new Error('Invalid response from SMEPay validate-order API');
      }
    } catch (error) {
      logger.error('❌ [SMEPay] Error validating payment:', error.message);
      throw new Error('Failed to validate payment');
    }
  }

  /**
   * Generate QR code for payment
   */
  async generateQR(orderSlug) {
    try {
      const accessToken = await this.getAccessToken();
      
      logger.info('📱 [SMEPay] Generating QR code...', { orderSlug });

      const response = await axios.post(`${this.baseUrl}/generate-qr?slug=${orderSlug}`, {
        slug: orderSlug,
        client_id: this.clientId
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status && response.data.qrcode) {
        logger.info('✅ [SMEPay] QR code generated successfully');
        
        return {
          success: true,
          qrCode: response.data.qrcode,
          links: response.data.link,
          refId: response.data.ref_id,
          data: response.data.data
        };
      } else {
        throw new Error('Invalid response from SMEPay generate-qr API');
      }
    } catch (error) {
      logger.error('❌ [SMEPay] Error generating QR code:', error.message);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Check QR payment status
   */
  async checkQRStatus(orderSlug, refId) {
    try {
      const accessToken = await this.getAccessToken();
      
      logger.info('🔍 [SMEPay] Checking QR payment status...', {
        orderSlug,
        refId
      });

      const response = await axios.post(`${this.baseUrl}/check-qr-status`, {
        client_id: this.clientId,
        slug: orderSlug,
        ref_id: refId
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status !== undefined) {
        logger.info('✅ [SMEPay] QR status check completed', {
          orderSlug,
          paymentStatus: response.data.payment_status
        });
        
        return {
          success: true,
          paymentStatus: response.data.payment_status,
          orderId: response.data.order_id,
          callbackUrl: response.data.callback_url
        };
      } else {
        throw new Error('Invalid response from SMEPay check-qr-status API');
      }
    } catch (error) {
      logger.error('❌ [SMEPay] Error checking QR status:', error.message);
      throw new Error('Failed to check QR payment status');
    }
  }

  /**
   * Complete payment flow with QR generation
   */
  async createPaymentWithQR(orderData) {
    try {
      // Step 1: Create order
      const orderResult = await this.createOrder(orderData);
      
      if (!orderResult.success) {
        throw new Error('Failed to create order');
      }

      // Step 2: Generate QR code
      const qrResult = await this.generateQR(orderResult.orderSlug);
      
      if (!qrResult.success) {
        throw new Error('Failed to generate QR code');
      }

      logger.info('✅ [SMEPay] Payment flow created successfully', {
        orderSlug: orderResult.orderSlug,
        refId: qrResult.refId
      });

      return {
        success: true,
        orderSlug: orderResult.orderSlug,
        qrCode: qrResult.qrCode,
        links: qrResult.links,
        refId: qrResult.refId,
        amount: orderData.amount,
        orderId: orderData.orderId
      };
    } catch (error) {
      logger.error('❌ [SMEPay] Error in payment flow:', error.message);
      throw error;
    }
  }
}

module.exports = new SMEPayService();
