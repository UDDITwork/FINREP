/**
 * FILE LOCATION: frontend/src/components/layout/Sidebar.jsx
 * 
 * Navigation sidebar component that provides the main navigation menu for the dashboard.
 * Includes links to all major sections like Dashboard, Clients, Meetings, A/B Testing,
 * Portfolio Management, and Chat with RichieAI. Also contains account management links.
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Video, BarChart3, PieChart, User, Settings, LogOut, TrendingUp, MessageCircle, Shield, TrendingDown, FileText, Menu, X, Palette, Lock, ChevronDown, ChevronRight, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    account: true
  });

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: Home,
    },
    {
      name: 'Clients',
      path: '/clients',
      icon: Users,
    },
    {
      name: 'Meetings',
      path: '/meetings',
      icon: Video,
    },
    {
      name: 'A/B Testing',
      path: '/ab-testing',
      icon: BarChart3,
    },
    {
      name: 'A/B Testing Suite 2',
      path: '/ab-testing-suite-2',
      icon: TrendingUp,
    },
    {
      name: 'Portfolio Management',
      path: '/portfolio-management',
      icon: PieChart,
    },
    {
      name: 'Chat with RichieAI',
      path: '/chat-richieai',
      icon: MessageCircle,
    },
    {
      name: 'KYC Verification',
      path: '/kyc-verification',
      icon: Shield,
    },
    {
      name: 'Mutual Fund Exit',
      path: '/mutual-fund-exit',
      icon: TrendingDown,
    },
    {
      name: 'LOE Automation',
      path: '/loe-automation',
      icon: FileText,
    },
    {
      name: 'Transcriptions',
      path: '/transcriptions', 
      icon: FileText,
    },
    {
      name: 'Transcription Manager',
      path: '/transcription-manager', 
      icon: FileText,
    },
    {
      name: 'Consolidated Account Statement',
      path: '/cas-management', 
      icon: FileText,
    },
    {
      name: 'Vault',
      path: '/vault', 
      icon: Lock,
    },
    {
      name: 'Client Reports',
      path: '/final-report', 
      icon: FileText,
    },
    {
      name: 'Billing & Subscription',
      path: '/billing', 
      icon: CreditCard,
    }
  ];

  const accountItems = [
    {
      name: 'Profile',
      path: '/profile',
      icon: User,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-2 bg-[#1e3a5f] text-white rounded-md shadow-lg hover:bg-[#1e3a5f]/90 transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#F7F8FA] transition-transform duration-300 transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center px-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Richie AI</h1>
                <p className="text-xs text-gray-500">Financial Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
            {/* Main Section */}
            <div className="space-y-3">
              <button
                onClick={() => toggleSection('main')}
                className="flex items-center justify-between w-full text-left px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                <span>Main Navigation</span>
                {expandedSections.main ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {expandedSections.main && (
                <div className="space-y-1 ml-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={`
                          group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all duration-200
                          ${active 
                            ? 'bg-[#E0E7FF] text-gray-900' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon 
                          className={`mr-3 h-5 w-5 flex-shrink-0 ${
                            active ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'
                          }`} 
                        />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Account Section - Bottom */}
          <div className="border-t border-gray-200 px-4 py-4">
            <div className="space-y-3">
              <button
                onClick={() => toggleSection('account')}
                className="flex items-center justify-between w-full text-left px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                <span>Account</span>
                {expandedSections.account ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {expandedSections.account && (
                <div className="space-y-1 ml-2">
                  {accountItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={`
                          group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all duration-200
                          ${active 
                            ? 'bg-[#E0E7FF] text-gray-900' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon 
                          className={`mr-3 h-5 w-5 flex-shrink-0 ${
                            active ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'
                          }`} 
                        />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                  
                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleLogout();
                    }}
                    className="group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all duration-200 text-gray-700 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut 
                      className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-red-600" 
                    />
                    <span className="truncate">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 text-center">
              Richie v1.0 • SEBI 2025
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;