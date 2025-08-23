/**
 * FILE LOCATION: frontend/src/components/layout/Sidebar.jsx
 * 
 * Navigation sidebar component that provides the main navigation menu for the dashboard.
 * Includes links to all major sections like Dashboard, Clients, Meetings, A/B Testing,
 * Portfolio Management, and Chat with RichieAI. Also contains account management links.
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Video, BarChart3, PieChart, User, Settings, LogOut, TrendingUp, MessageCircle, Shield, TrendingDown, FileText, Menu, X, Palette, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      name: 'Final Report',
      path: '/final-report', 
      icon: FileText,
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
        fixed inset-y-0 left-0 z-50 w-64 bg-[#1e3a5f] transition-transform duration-300 transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-white/10">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Richie AI</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {/* Main Section */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Main
              </p>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                      ${active 
                        ? 'bg-orange-500 text-white' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon 
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                      }`} 
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Account Section - Bottom */}
          <div className="border-t border-white/10 p-2">
            <div className="space-y-1">
              {accountItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                      ${active 
                        ? 'bg-orange-500 text-white' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon 
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        active ? 'text-white' : 'text-gray-400 group-hover:text-white'
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
                className="group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-gray-300 hover:bg-red-600/20 hover:text-red-400"
              >
                <LogOut 
                  className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-red-400" 
                />
                <span className="truncate">Logout</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-4 py-2">
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