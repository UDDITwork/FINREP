/**
 * FILE LOCATION: KYC_IMPLEMENTATION_README.md (root directory)
 * 
 * PURPOSE: Comprehensive documentation for KYC verification system implementation
 * 
 * FUNCTIONALITY:
 * - Provides complete setup and configuration instructions
 * - Documents API endpoints and data flow architecture
 * - Explains Digio integration and workflow process
 * - Includes troubleshooting guides and error resolution
 * - Serves as reference for developers and system administrators
 * 
 * DOCUMENTATION COVERAGE:
 * - System architecture and component relationships
 * - Backend and frontend setup instructions
 * - API endpoint documentation and usage examples
 * - Digio API integration and SDK configuration
 * - Webhook setup and event processing
 * - Testing procedures and validation steps
 * 
 * TARGET AUDIENCE:
 * - Developers implementing KYC features
 * - System administrators deploying the system
 * - Support teams troubleshooting issues
 * - Business stakeholders understanding the workflow
 * 
 * TECHNICAL DETAILS:
 * - File structure and organization
 * - Database schema and relationships
 * - API authentication and security
 * - Error handling and logging
 * - Performance optimization guidelines
 * 
 * INTEGRATION GUIDES:
 * - Digio API configuration and credentials
 * - Webhook endpoint setup and testing
 * - Frontend SDK integration and customization
 * - Database setup and migration procedures
 * 
 * OPERATIONAL GUIDES:
 * - Production deployment checklist
 * - Monitoring and logging setup
 * - Backup and recovery procedures
 * - Security best practices
 * 
 * MAINTENANCE:
 * - Regular updates for API changes
 * - Troubleshooting section updates
 * - Performance monitoring guidelines
 * - Security patch recommendations
 */

# KYC Verification Implementation Guide

**Last Updated**: December 2024  
**Compatibility**: Digio API v2, React 18+, Node.js 16+

## Overview

This implementation provides a complete KYC (Know Your Customer) verification system using Digio's API and Web SDK. The system allows financial advisors to verify their clients' Aadhar and PAN cards through a workflow-based approach.

## Features

- ✅ **Workflow-based KYC**: Uses Digio's template-driven workflow ("SURENDRA")
- ✅ **Real-time Status Updates**: Webhook integration for live status updates
- ✅ **Multi-tenant Architecture**: Ensures data isolation between advisors
- ✅ **Digio Web SDK Integration**: Seamless frontend integration
- ✅ **Comprehensive Error Handling**: Robust error management
- ✅ **Status Tracking**: Detailed tracking of Aadhar and PAN verification status

## Architecture

### Backend Components
- **KYC Model**: MongoDB schema for storing verification data
- **Digio Service**: API integration with Digio's services
- **KYC Controller**: Business logic for KYC operations
- **Webhook Handler**: Real-time status updates from Digio

### Frontend Components
- **KYC Verification**: Main component for the verification flow
- **Client List**: Displays advisor's clients for selection
- **KYC Workflow**: Integrates with Digio Web SDK
- **KYC Status**: Shows detailed verification status

## Setup Instructions

### 1. Environment Configuration

Ensure your `backend/.env` file contains:

```env
# Digio API Credentials
DIGIO_CLIENT_ID=your_digio_client_id
DIGIO_CLIENT_SECRET=your_digio_client_secret

# Other required variables...
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Database Setup

The KYC verification model will be automatically created when the first verification is initiated.

### 5. Webhook Configuration

Configure webhook URL in Digio dashboard:
```
https://your-domain.com/api/kyc/webhook
```

## API Endpoints

### KYC Management
- `GET /api/kyc/clients` - Get advisor's clients for KYC
- `GET /api/kyc/status/:clientId` - Get KYC status for a client
- `POST /api/kyc/workflow/:clientId` - Start KYC workflow
- `POST /api/kyc/reset/:clientId` - Reset KYC verification

### Webhook
- `POST /api/kyc/webhook` - Receive Digio webhook notifications

## Workflow Process

### 1. Create Request
```javascript
POST https://api.digio.in/client/kyc/v2/request/with_template
{
  "customer_identifier": "client@email.com",
  "customer_name": "Client Name",
  "template_name": "SURENDRA",
  "notify_customer": true,
  "generate_access_token": true
}
```

### 2. Invoke SDK
```javascript
const digio = new Digio({
  environment: 'production',
  callback: handleCallback
});

digio.submit(digioRequestId, clientIdentifier, accessToken);
```

### 3. Listen to Webhook
Real-time status updates via webhook events:
- `KYC_REQUEST_CREATED`
- `KYC_REQUEST_COMPLETED`
- `KYC_REQUEST_APPROVED`
- `KYC_REQUEST_REJECTED`
- `KYC_ACTION_COMPLETED`

## Testing

### Run Integration Tests

```bash
node test-kyc-integration.js
```

### Manual Testing Steps

1. **Start Backend Server**
   ```bash
   cd backend && npm start
   ```

2. **Start Frontend Server**
   ```bash
   cd frontend && npm run dev
   ```

3. **Access KYC Verification**
   - Navigate to `http://localhost:5173/kyc-verification`
   - Login as an advisor
   - Select a client from the list
   - Click "Start KYC Verification"

4. **Monitor Webhook Events**
   - Check backend logs for webhook events
   - Verify status updates in the frontend

## File Structure

```
├── backend/
│   ├── models/
│   │   └── KYCVerification.js          # KYC data model
│   ├── services/
│   │   └── digioService.js             # Digio API integration
│   ├── controllers/
│   │   └── kycController.js            # KYC business logic
│   └── routes/
│       └── kyc.js                      # KYC API routes
├── frontend/
│   └── src/
│       ├── components/
│       │   └── kyc/
│       │       ├── KYCVerification.jsx # Main KYC component
│       │       ├── ClientList.jsx      # Client selection
│       │       ├── KYCWorkflow.jsx     # Digio SDK integration
│       │       └── KYCStatus.jsx       # Status display
│       └── services/
│           └── kycService.js           # Frontend API calls
└── test-kyc-integration.js             # Integration tests
```

## Digio API Endpoints Used

1. **Create KYC Workflow Request**
   ```
   POST https://api.digio.in/client/kyc/v2/request/with_template
   ```
   - Creates a new KYC workflow using the 'SURENDRA' template
   - Returns Digio request ID and access token for SDK

2. **Get Verification Status**
   ```
   POST https://api.digio.in/client/kyc/v2/{id}/response
   ```
   - Retrieves current status of KYC workflow
   - Parses Aadhar and PAN status from actions array

## Digio Environment URLs (Production)
- **Backend API Base URL**: `https://api.digio.in` (for API calls)
- **Frontend SDK URL**: `https://app.digio.in` (for SDK loading)
- **Template Name**: 'SURENDRA' (custom workflow)
- **SDK Version**: v11

### IP Whitelisting for Production
- **Webhook IPs**: `13.126.198.236`, `52.66.66.81`
- **API Base URL**: `https://api.digio.in` (to be whitelisted in network)

## Security Features

- **Multi-tenant Isolation**: Advisors can only access their own clients
- **JWT Authentication**: Secure API access
- **Input Validation**: Comprehensive validation for all inputs
- **Error Handling**: Graceful error handling and logging
- **Webhook Security**: Proper webhook signature verification (to be implemented)

## Status Codes

### KYC Status Values
- `not_started` - Verification not initiated
- `requested` - Verification request created
- `in_progress` - Verification in progress
- `verified` - Verification completed successfully
- `failed` - Verification failed
- `expired` - Verification request expired

### Digio Status Mapping
- `REQUESTED` → `requested`
- `APPROVED` → `verified`
- `REJECTED` → `failed`
- `EXPIRED` → `expired`

## Error Handling

### Common Errors and Solutions

#### 1. Authentication Errors
- **Error**: 401 Unauthorized
- **Solution**: Verify Digio credentials in `.env` file

#### 2. Template Not Found
- **Error**: Template 'SURENDRA' not found
- **Solution**: Verify template name in Digio dashboard

#### 3. Webhook Not Receiving
- **Error**: No webhook events received
- **Solution**: Check webhook URL configuration in Digio dashboard

#### 4. SDK Loading Issues
- **Error**: Digio SDK not loading
- **Solution**: Check internet connectivity and SDK URL

## Monitoring

### Logs to Monitor
- Backend server logs for API calls
- Webhook event logs
- Frontend console for SDK events
- Database queries for status updates

### Key Metrics
- KYC completion rate
- Average verification time
- Error rates by type
- Webhook delivery success rate

## Troubleshooting

### Common Issues

#### 1. Digio SDK Not Loading
- Check internet connectivity
- Verify SDK URL is accessible (https://app.digio.in/sdk/v11/digio.js)
- Check browser console for errors

#### 2. Workflow Creation Fails
- Verify Digio credentials are correct
- Check API endpoint accessibility (https://api.digio.in)
- Review request payload format
- Ensure template name 'SURENDRA' is correct

#### 3. Status Not Updating
- Check Digio callback implementation
- Verify database connection
- Review status parsing logic
- Ensure correct API endpoint for status check

#### 4. OTP Not Received
- Verify customer phone/email is correct
- Check Digio notification settings
- Review template configuration

#### 5. Webhook Not Working
- Verify webhook URL is publicly accessible
- Check webhook endpoint implementation
- Review webhook payload structure
- Ensure proper error handling

## Performance Optimization

### Backend Optimizations
- Implement caching for frequently accessed data
- Use database indexes for KYC queries
- Optimize webhook processing
- Implement rate limiting

### Frontend Optimizations
- Lazy load KYC components
- Implement proper loading states
- Optimize SDK initialization
- Use React.memo for performance

## Future Enhancements

### Planned Features
- [ ] Bulk KYC verification
- [ ] Advanced reporting and analytics
- [ ] Email/SMS notifications
- [ ] Document download functionality
- [ ] Audit trail implementation
- [ ] Mobile app integration

### Technical Improvements
- [ ] Webhook signature verification
- [ ] Rate limiting implementation
- [ ] Caching layer
- [ ] Performance monitoring
- [ ] Automated testing suite

## Support

For technical support or questions:
1. Check the troubleshooting section above
2. Review Digio API documentation
3. Check backend and frontend logs
4. Run integration tests to identify issues

## Changelog

### Version 1.0.0 (December 2024)
- Initial KYC implementation
- Digio API v2 integration
- Web SDK integration
- Webhook support
- Multi-tenant architecture
- Complete frontend components
