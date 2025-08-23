import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, User, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Format time and date for professional display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getMarketStatus = () => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const day = currentTime.getDay();
    const currentTimeInMinutes = hour * 60 + minute;
    
    // Weekend (Saturday = 6, Sunday = 0)
    if (day === 0 || day === 6) {
      return { status: 'CLOSED', color: 'text-red-500' };
    }
    
    // Convert IST times to minutes for easier comparison
    // Pre-Market: 9:00 AM to 9:15 AM
    const preMarketStart = 9 * 60;      // 9:00 AM
    const preMarketEnd = 9 * 60 + 15;   // 9:15 AM
    
    // Regular Trading: 9:15 AM to 3:30 PM
    const marketStart = 9 * 60 + 15;    // 9:15 AM
    const marketEnd = 15 * 60 + 30;     // 3:30 PM
    
    // Post-Market: 3:40 PM to 8:57 AM (next trading day)
    const postMarketStart = 15 * 60 + 40; // 3:40 PM
    const postMarketEnd = 8 * 60 + 57;    // 8:57 AM
    
    // Check if it's pre-market session
    if (currentTimeInMinutes >= preMarketStart && currentTimeInMinutes < preMarketEnd) {
      return { status: 'PRE-MARKET', color: 'text-amber-500' };
    }
    
    // Check if it's regular trading session
    if (currentTimeInMinutes >= marketStart && currentTimeInMinutes < marketEnd) {
      return { status: 'OPEN', color: 'text-green-500' };
    }
    
    // Check if it's post-market session (after 3:40 PM on same day)
    if (currentTimeInMinutes >= postMarketStart) {
      return { status: 'POST-MARKET', color: 'text-blue-500' };
    }
    
    // Check if it's post-market session (before 8:57 AM on same day)
    if (currentTimeInMinutes < postMarketEnd) {
      return { status: 'POST-MARKET', color: 'text-blue-500' };
    }
    
    // Default to closed
    return { status: 'CLOSED', color: 'text-red-500' };
  };

  const marketStatus = getMarketStatus();

  return (
    <header className="fixed top-0 z-40 w-full bg-white border-b border-gray-200 pl-64">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Welcome Message */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Welcome back, {user?.firstName || 'Advisor'}!
          </h2>
        </div>

        {/* Enhanced Date/Time Widget with Stock Market Vibes */}
        <div className="hidden lg:flex items-center space-x-4">
          {/* Market Status */}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-3 py-2 border border-blue-200 group relative">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <div className="text-center">
              <div className="text-xs font-medium text-blue-700">BSE/NSE</div>
              <div className={`text-xs font-bold ${marketStatus.color}`}>
                {marketStatus.status}
              </div>
            </div>
            
            {/* Market Status Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              <div className="text-center">
                <div className="font-semibold mb-1">Indian Market Hours</div>
                <div>Pre-Market: 9:00 AM - 9:15 AM</div>
                <div>Trading: 9:15 AM - 3:30 PM</div>
                <div>Post-Market: 3:40 PM - 8:57 AM</div>
                <div className="text-yellow-300 mt-1">Weekends: Closed</div>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>

          {/* Time Widget */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="text-center">
                <div className="text-sm font-mono font-bold text-gray-900 tracking-wider">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {formatDayName(currentTime)}
                </div>
              </div>
            </div>
          </div>

          {/* Date & Week Widget */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg px-3 py-2 border border-emerald-200">
            <div className="text-center">
              <div className="text-xs font-medium text-emerald-700">WEEK {getWeekNumber(currentTime)}</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Button */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.sebiRegNumber ? 'SEBI Registered' : 'CFP, SEBI Registered'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
              <Link
                to="/profile"
                onClick={() => setShowDropdown(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                My Profile
              </Link>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;