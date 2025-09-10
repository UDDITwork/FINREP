@echo off
REM Mutual Fund Exit Suite Test Runner for Windows
REM This script provides an easy way to run the comprehensive tests

echo 🚀 Mutual Fund Exit Suite Test Runner
echo ======================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Install dependencies if package.json exists
if exist package.json (
    echo 📦 Installing dependencies...
    npm install
)

REM Check if backend server is running
echo 🔍 Checking backend server...
curl -s http://localhost:5000/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend server is running
) else (
    echo ⚠️ Backend server not responding on localhost:5000
    echo Please start the backend server first:
    echo   cd backend ^&^& npm start
    echo.
    set /p continue="Continue anyway? (y/N): "
    if /i not "%continue%"=="y" exit /b 1
)

REM Run tests based on argument
if "%1"=="quick" goto :quick
if "%1"=="full" goto :full
if "%1"=="auth" goto :auth
if "%1"=="endpoints" goto :endpoints
if "%1"=="database" goto :database
if "%1"=="help" goto :help
if "%1"=="-h" goto :help
if "%1"=="--help" goto :help
if "%1"=="" goto :quick

echo ❌ Unknown option: %1
echo Use 'run_tests.bat help' for usage information
pause
exit /b 1

:quick
echo 🧪 Running Quick Tests...
node run_mf_exit_tests.js
goto :end

:full
echo 🧪 Running Comprehensive Tests...
node test_mutual_fund_exit_suite.js
goto :end

:auth
echo 🔐 Testing Authentication...
node -e "const tester = require('./test_mutual_fund_exit_suite.js'); const t = new tester(); t.testAuthentication().then(() => console.log('Auth test completed'));"
goto :end

:endpoints
echo 🔌 Testing API Endpoints...
node -e "const tester = require('./test_mutual_fund_exit_suite.js'); const t = new tester(); t.testBackendEndpoints().then(() => console.log('Endpoints test completed'));"
goto :end

:database
echo 💾 Testing Database Operations...
node -e "const tester = require('./test_mutual_fund_exit_suite.js'); const t = new tester(); t.testDatabaseOperations().then(() => console.log('Database test completed'));"
goto :end

:help
echo Usage: %0 [option]
echo.
echo Options:
echo   quick     - Run quick tests (default)
echo   full      - Run comprehensive tests
echo   auth      - Test authentication only
echo   endpoints - Test API endpoints only
echo   database  - Test database operations only
echo   help      - Show this help message
echo.
echo Examples:
echo   %0              # Run quick tests
echo   %0 full         # Run comprehensive tests
echo   %0 auth         # Test authentication only
goto :end

:end
echo.
echo 🏁 Test execution completed!
echo Check the output above for results.
pause
