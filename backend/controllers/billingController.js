/**
 * FILE LOCATION: backend/controllers/billingController.js
 * 
 * Billing controller for handling subscription and payment operations.
 * Manages SMEPay integration, subscription status, and payment processing.
 * Includes 30-day free trial period support.
 */

const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const smepayService = require('../services/smepayService');
const { logger } = require('../utils/logger');

class BillingController {
  /**
   * Get subscription status for an advisor
   */
  async getSubscriptionStatus(req, res) {
    try {
      const advisorId = req.advisor.id;
      
      logger.info('📊 [Billing] Getting subscription status for advisor:', advisorId);

      // Find active subscription
      let subscription = await Subscription.findActiveByAdvisor(advisorId);
      
      if (!subscription) {
        // Create default subscription with trial period if none exists
        subscription = new Subscription({
          advisorId,
          plan: 'Monthly Professional',
          amount: 1,
          isActive: true,
          isTrialActive: true,
          status: 'trial',
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days
          hasPaid: false
        });
        await subscription.save();
      }

      // Calculate days remaining
      const daysRemaining = subscription.daysRemaining;
      const isActive = subscription.isActive && !subscription.isExpired;
      const isTrialActive = subscription.isTrialActive && !subscription.isTrialExpired;

      const response = {
        isActive: isActive || isTrialActive,
        isTrialActive,
        hasPaid: subscription.hasPaid,
        expiryDate: subscription.isTrialActive ? subscription.trialEndDate : subscription.endDate,
        daysRemaining,
        amount: subscription.amount,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.isTrialActive ? subscription.trialStartDate : subscription.startDate,
        lastPaymentDate: subscription.lastPaymentDate,
        nextPaymentDate: subscription.nextPaymentDate,
        trialStartDate: subscription.trialStartDate,
        trialEndDate: subscription.trialEndDate
      };

      logger.info('✅ [Billing] Subscription status retrieved:', {
        advisorId,
        isActive: response.isActive,
        isTrialActive: response.isTrialActive,
        daysRemaining,
        plan: subscription.plan
      });

      res.json(response);
    } catch (error) {
      logger.error('❌ [Billing] Error getting subscription status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get subscription status' 
      });
    }
  }

  /**
   * Create a new payment order (only after trial expires)
   */
  async createPayment(req, res) {
    try {
      const advisorId = req.advisor.id;
      const { amount, plan, customerDetails } = req.body;

      logger.info('💰 [Billing] Creating payment for advisor:', {
        advisorId,
        amount,
        plan
      });

      // Validate input
      if (!amount || !plan) {
        return res.status(400).json({
          success: false,
          message: 'Amount and plan are required'
        });
      }

      // Find subscription
      let subscription = await Subscription.findActiveByAdvisor(advisorId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No subscription found'
        });
      }

      // Check if trial is still active
      if (subscription.isTrialActive && !subscription.isTrialExpired) {
        return res.status(400).json({
          success: false,
          message: 'Trial period is still active. Payment will be required after trial expires.',
          trialDaysRemaining: subscription.daysRemaining
        });
      }

      // Generate unique order ID
      const orderId = `RICHIE_${advisorId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create payment record
      const payment = new Payment({
        advisorId,
        subscriptionId: subscription._id,
        amount,
        plan,
        smepayOrderId: orderId,
        customerDetails: {
          name: customerDetails?.name || 'Advisor',
          email: customerDetails?.email || 'advisor@richie.ai',
          mobile: customerDetails?.mobile || ''
        }
      });

      // Create SMEPay order
      const smepayOrderData = {
        amount,
        orderId,
        callbackUrl: `${process.env.BACKEND_URL}/api/billing/webhook`,
        customerDetails: payment.customerDetails
      };

      const smepayResult = await smepayService.createOrder(smepayOrderData);
      
      if (!smepayResult.success) {
        throw new Error('Failed to create SMEPay order');
      }

      // Update payment with SMEPay details
      payment.smepayOrderSlug = smepayResult.orderSlug;
      await payment.save();

      logger.info('✅ [Billing] Payment created successfully:', {
        advisorId,
        orderId,
        orderSlug: smepayResult.orderSlug
      });

      res.json({
        success: true,
        orderSlug: smepayResult.orderSlug,
        orderId,
        amount,
        plan,
        message: 'Payment order created successfully'
      });
    } catch (error) {
      logger.error('❌ [Billing] Error creating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment order'
      });
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(req, res) {
    try {
      const { orderSlug } = req.params;
      const advisorId = req.advisor.id;

      logger.info('🔍 [Billing] Checking payment status:', {
        orderSlug,
        advisorId
      });

      // Find payment record
      const payment = await Payment.findByOrderSlug(orderSlug);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Verify ownership
      if (payment.advisorId.toString() !== advisorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check status with SMEPay
      const validationResult = await smepayService.validateOrder(orderSlug, payment.amount);
      
      if (validationResult.success && validationResult.isPaid) {
        // Mark payment as successful
        await payment.markSuccess();
        
        // Activate subscription (convert from trial to paid)
        const subscription = await Subscription.findById(payment.subscriptionId);
        if (subscription) {
          await subscription.activate();
        }

        logger.info('✅ [Billing] Payment successful:', {
          orderSlug,
          advisorId,
          amount: payment.amount
        });

        res.json({
          success: true,
          status: 'paid',
          message: 'Payment successful'
        });
      } else {
        res.json({
          success: true,
          status: 'pending',
          message: 'Payment pending'
        });
      }
    } catch (error) {
      logger.error('❌ [Billing] Error checking payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check payment status'
      });
    }
  }

  /**
   * Get payment history for an advisor
   */
  async getPaymentHistory(req, res) {
    try {
      const advisorId = req.advisor.id;
      const limit = parseInt(req.query.limit) || 10;

      logger.info('📋 [Billing] Getting payment history for advisor:', advisorId);

      const payments = await Payment.findByAdvisor(advisorId, limit);

      const paymentHistory = payments.map(payment => ({
        id: payment._id,
        amount: payment.amount,
        plan: payment.plan,
        status: payment.status,
        date: payment.createdAt,
        transactionId: payment.transactionId,
        paymentMethod: payment.paymentMethod
      }));

      logger.info('✅ [Billing] Payment history retrieved:', {
        advisorId,
        count: paymentHistory.length
      });

      res.json(paymentHistory);
    } catch (error) {
      logger.error('❌ [Billing] Error getting payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment history'
      });
    }
  }

  /**
   * SMEPay webhook handler
   */
  async webhookHandler(req, res) {
    try {
      const { order_id, status, amount, slug } = req.body;

      logger.info('🔔 [Billing] Webhook received:', {
        orderId: order_id,
        status,
        amount,
        slug
      });

      // Find payment by order slug
      const payment = await Payment.findByOrderSlug(slug);
      
      if (!payment) {
        logger.warn('⚠️ [Billing] Payment not found for webhook:', { slug });
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      // Update webhook data
      await payment.updateWebhookData(req.body);

      if (status === 'paid') {
        // Mark payment as successful
        await payment.markSuccess();
        
        // Activate subscription (convert from trial to paid)
        const subscription = await Subscription.findById(payment.subscriptionId);
        if (subscription) {
          await subscription.activate();
        }

        logger.info('✅ [Billing] Payment confirmed via webhook:', {
          orderId: order_id,
          slug,
          amount
        });
      } else if (status === 'failed') {
        await payment.markFailed('Payment failed via webhook');
        
        logger.warn('❌ [Billing] Payment failed via webhook:', {
          orderId: order_id,
          slug
        });
      }

      res.json({ success: true, message: 'Webhook processed successfully' });
    } catch (error) {
      logger.error('❌ [Billing] Error processing webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process webhook'
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req, res) {
    try {
      const advisorId = req.advisor.id;

      logger.info('🚫 [Billing] Cancelling subscription for advisor:', advisorId);

      const subscription = await Subscription.findActiveByAdvisor(advisorId);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found'
        });
      }

      await subscription.cancel();

      logger.info('✅ [Billing] Subscription cancelled:', {
        advisorId,
        subscriptionId: subscription._id
      });

      res.json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {
      logger.error('❌ [Billing] Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription'
      });
    }
  }

  /**
   * Get billing statistics
   */
  async getBillingStats(req, res) {
    try {
      const advisorId = req.advisor.id;

      logger.info('📊 [Billing] Getting billing stats for advisor:', advisorId);

      const [paymentStats, subscription] = await Promise.all([
        Payment.getStats(advisorId),
        Subscription.findActiveByAdvisor(advisorId)
      ]);

      const stats = {
        totalPayments: paymentStats.reduce((sum, stat) => sum + stat.count, 0),
        successfulPayments: paymentStats.find(s => s._id === 'success')?.count || 0,
        totalAmount: paymentStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
        subscription: subscription ? {
          isActive: subscription.isActive,
          isTrialActive: subscription.isTrialActive,
          hasPaid: subscription.hasPaid,
          plan: subscription.plan,
          daysRemaining: subscription.daysRemaining,
          nextPaymentDate: subscription.nextPaymentDate,
          trialEndDate: subscription.trialEndDate
        } : null
      };

      logger.info('✅ [Billing] Billing stats retrieved:', {
        advisorId,
        totalPayments: stats.totalPayments,
        successfulPayments: stats.successfulPayments
      });

      res.json(stats);
    } catch (error) {
      logger.error('❌ [Billing] Error getting billing stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get billing statistics'
      });
    }
  }
}

module.exports = new BillingController();
