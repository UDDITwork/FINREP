#!/bin/bash

# Mutual Fund Exit Suite Test Runner
# This script provides an easy way to run the comprehensive tests

echo "🚀 Mutual Fund Exit Suite Test Runner"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if backend server is running
echo "🔍 Checking backend server..."
if curl -s http://localhost:5000/api/mutual-fund-exit-strategies/health > /dev/null; then
    echo "✅ Backend server is running"
else
    echo "⚠️ Backend server not responding on localhost:5000"
    echo "Please start the backend server first:"
    echo "  cd backend && npm start"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run tests based on argument
case "${1:-quick}" in
    "quick")
        echo "🧪 Running Quick Tests..."
        node run_mf_exit_tests.js
        ;;
    "full")
        echo "🧪 Running Comprehensive Tests..."
        node test_mutual_fund_exit_suite.js
        ;;
    "auth")
        echo "🔐 Testing Authentication..."
        node -e "const tester = require('./test_mutual_fund_exit_suite.js'); const t = new tester(); t.testAuthentication().then(() => console.log('Auth test completed'));"
        ;;
    "endpoints")
        echo "🔌 Testing API Endpoints..."
        node -e "const tester = require('./test_mutual_fund_exit_suite.js'); const t = new tester(); t.testBackendEndpoints().then(() => console.log('Endpoints test completed'));"
        ;;
    "database")
        echo "💾 Testing Database Operations..."
        node -e "const tester = require('./test_mutual_fund_exit_suite.js'); const t = new tester(); t.testDatabaseOperations().then(() => console.log('Database test completed'));"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  quick     - Run quick tests (default)"
        echo "  full      - Run comprehensive tests"
        echo "  auth      - Test authentication only"
        echo "  endpoints - Test API endpoints only"
        echo "  database  - Test database operations only"
        echo "  help      - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0              # Run quick tests"
        echo "  $0 full         # Run comprehensive tests"
        echo "  $0 auth         # Test authentication only"
        ;;
    *)
        echo "❌ Unknown option: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac

echo ""
echo "🏁 Test execution completed!"
echo "Check the output above for results."
