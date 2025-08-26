# Claude AI Service Troubleshooting Guide

## 🚨 Critical Issues & Quick Fixes

### 1. Missing API Key (Most Common Issue)
**Symptoms:**
- Service fails to start
- "Claude API key not found in environment variables" error
- All requests return configuration errors

**Root Cause:**
The `CLAUDE_API_KEY` environment variable is not set or is empty.

**Solution:**
```bash
# Add to your .env file
CLAUDE_API_KEY=sk-ant-api03-your-actual-api-key-here

# Or set as environment variable
export CLAUDE_API_KEY=sk-ant-api03-your-actual-api-key-here
```

**Verification:**
```bash
# Run the diagnostic script
node debug-claude-service.js

# Check environment variable
echo $CLAUDE_API_KEY
```

### 2. Invalid API Key Format
**Symptoms:**
- "API key format appears invalid" warning
- 401 Unauthorized errors from Claude API

**Root Cause:**
API key doesn't start with `sk-ant-` or is incomplete.

**Solution:**
- Get a valid API key from [Anthropic Console](https://console.anthropic.com/)
- Ensure the key starts with `sk-ant-` and is complete
- Don't truncate or modify the key

### 3. Network Connectivity Issues
**Symptoms:**
- "Network connectivity test failed" errors
- ECONNREFUSED, ENOTFOUND, or timeout errors
- Service appears healthy but requests fail

**Root Cause:**
- Firewall blocking outbound connections
- DNS resolution issues
- Network proxy configuration

**Solution:**
```bash
# Test basic connectivity
curl -I https://api.anthropic.com/v1/messages

# Test DNS resolution
nslookup api.anthropic.com

# Check firewall rules
sudo ufw status  # Ubuntu/Debian
sudo firewall-cmd --list-all  # CentOS/RHEL
```

## 🔍 Diagnostic Tools

### 1. Run the Diagnostic Script
```bash
cd backend
node debug-claude-service.js
```

This script will:
- ✅ Validate configuration
- 🌐 Test network connectivity  
- 🏥 Check service health
- 🧪 Test API requests
- 📋 Verify environment variables
- 💡 Provide specific recommendations

### 2. Health Check Endpoints
```bash
# Comprehensive health check
curl http://localhost:5000/claude/health

# Simple health check (for load balancers)
curl http://localhost:5000/claude/health/simple

# Configuration validation
curl http://localhost:5000/claude/health/config

# Network connectivity test
curl http://localhost:5000/claude/health/network

# Test API request
curl -X POST http://localhost:5000/claude/health/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'

# Prometheus metrics
curl http://localhost:5000/claude/health/metrics
```

### 3. Log Analysis
```bash
# Check application logs
tail -f backend/logs/app.log

# Check for Claude-specific errors
grep -i "claude" backend/logs/app.log

# Check for configuration errors
grep -i "configuration\|api.*key" backend/logs/app.log
```

## 📊 Error Categories & Solutions

### Network Errors
| Error Code | Meaning | Solution |
|------------|---------|----------|
| `ECONNREFUSED` | Connection refused | Check if Claude API is accessible, verify firewall rules |
| `ENOTFOUND` | DNS resolution failed | Check DNS settings, verify `api.anthropic.com` resolves |
| `ECONNABORTED` | Request timeout | Increase timeout, check network stability |
| `ENETUNREACH` | Network unreachable | Check routing, firewall, and network configuration |

### API Errors
| HTTP Status | Meaning | Solution |
|-------------|---------|----------|
| `401` | Unauthorized | Check API key validity and permissions |
| `429` | Rate limited | Implement rate limiting, retry with backoff |
| `500+` | Server error | Retry later, issue may be on Claude side |
| `400` | Bad request | Check request payload and parameters |

### Configuration Errors
| Error | Meaning | Solution |
|-------|---------|----------|
| Missing API key | Environment variable not set | Set `CLAUDE_API_KEY` in `.env` file |
| Invalid API key format | Key doesn't start with `sk-ant-` | Get valid key from Anthropic Console |
| Missing API URL | Endpoint not configured | Verify `CLAUDE_API_URL` is set correctly |
| Invalid model | Model name incorrect | Check `CLAUDE_MODEL` value |

## 🛠️ Production Deployment Checklist

### Environment Variables
```bash
# Required
CLAUDE_API_KEY=sk-ant-api03-your-key-here
NODE_ENV=production

# Optional (with defaults)
CLAUDE_API_URL=https://api.anthropic.com/v1/messages
CLAUDE_MODEL=claude-3-5-sonnet-20241022
LOG_LEVEL=info
```

### Health Monitoring
```bash
# Add to your monitoring system
curl -f http://localhost:5000/claude/health/simple || exit 1

# Set up alerts for:
# - Service status != healthy
# - Error count > threshold
# - Response time > threshold
```

### Logging Configuration
```javascript
// Ensure proper logging in production
LOG_LEVEL=info  // or warn for less verbose logs
```

## 🔧 Advanced Troubleshooting

### 1. Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug
NODE_ENV=development

# Run with additional debugging
DEBUG=* node debug-claude-service.js
```

### 2. Network Diagnostics
```bash
# Test with different DNS servers
nslookup api.anthropic.com 8.8.8.8
nslookup api.anthropic.com 1.1.1.1

# Test with curl (simulate the service)
curl -X POST https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'
```

### 3. Service Restart
```bash
# Restart the service
pm2 restart your-app-name

# Or if using systemd
sudo systemctl restart your-service

# Check service status
pm2 status
sudo systemctl status your-service
```

## 📞 Support & Escalation

### 1. Self-Service Resolution
1. ✅ Run diagnostic script
2. 🔍 Check health endpoints
3. 📋 Review error logs
4. 🛠️ Apply recommended fixes

### 2. When to Escalate
- Configuration issues persist after fixes
- Network connectivity cannot be resolved
- API errors from Claude side (500+ status codes)
- Service consistently unhealthy

### 3. Information to Provide
```bash
# Run diagnostics and capture output
node debug-claude-service.js > claude-debug.log 2>&1

# Check health status
curl -s http://localhost:5000/claude/health | jq .

# Check recent logs
tail -100 backend/logs/app.log > recent-logs.log

# Provide these files along with:
# - Error description
# - Steps to reproduce
# - Environment details
# - Recent changes made
```

## 🎯 Common Production Scenarios

### Scenario 1: Service Won't Start
```bash
# Check configuration
node -e "require('./services/claudeAiService')"

# Look for specific error messages
# Usually indicates missing or invalid API key
```

### Scenario 2: Service Starts but Requests Fail
```bash
# Check network connectivity
curl -I https://api.anthropic.com/v1/messages

# Verify API key is being read
node -e "console.log('API Key:', process.env.CLAUDE_API_KEY ? 'SET' : 'MISSING')"
```

### Scenario 3: Intermittent Failures
```bash
# Check error patterns
grep -i "error\|failed" backend/logs/app.log | tail -50

# Monitor health endpoint
watch -n 5 'curl -s http://localhost:5000/claude/health/simple'
```

### Scenario 4: Performance Issues
```bash
# Check response times
curl -s http://localhost:5000/claude/health | jq '.statistics'

# Monitor memory usage
curl -s http://localhost:5000/claude/health | jq '.environment.memoryUsage'
```

## 🔒 Security Considerations

### API Key Security
- ✅ Store API key in environment variables
- ✅ Never commit API keys to version control
- ✅ Use different keys for different environments
- ✅ Rotate keys regularly

### Network Security
- ✅ Ensure HTTPS for all API communications
- ✅ Configure firewall rules appropriately
- ✅ Monitor for unauthorized access attempts
- ✅ Log all API requests and responses

## 📈 Performance Optimization

### Request Optimization
- Use appropriate `max_tokens` values
- Implement request caching where possible
- Batch requests when feasible
- Monitor and optimize prompt lengths

### Error Handling
- Implement exponential backoff for retries
- Set appropriate timeout values
- Handle rate limiting gracefully
- Log errors with sufficient context

---

**Remember:** The diagnostic script (`debug-claude-service.js`) is your first line of defense. Run it whenever you encounter issues to get immediate insights into what's wrong and how to fix it.
