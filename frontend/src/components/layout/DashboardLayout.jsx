/**
 * FILE LOCATION: frontend/src/components/layout/DashboardLayout.jsx
 * 
 * Main layout wrapper component that provides the dashboard structure including
 * sidebar navigation, header, and main content area. This component wraps all
 * protected dashboard routes and provides consistent layout across the application.
 */

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Header */}
      <Header />
      
      {/* Main Content Area - Responsive Layout */}
      <main className="pl-0 lg:pl-64 pt-16 transition-all duration-300">
        <div className="p-3 sm:p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;