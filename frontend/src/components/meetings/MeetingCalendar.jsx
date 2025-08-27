// Location: frontend/src/components/meetings/MeetingCalendar.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Video, User } from 'lucide-react';
import { meetingAPI } from '../../services/api';

const MeetingCalendar = ({ onDateSelect, selectedDate = null }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);

  // Load meetings data
  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await meetingAPI.getAdvisorMeetings({ limit: 100 });
      setMeetings(response.meetings || []);
    } catch (error) {
      console.error('Failed to load meetings for calendar:', error);
      setError('Failed to load meeting data');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [currentMonth]);

  // Get meetings for a specific date
  const getMeetingsForDate = (date) => {
    if (!meetings.length) return [];
    
    const dateStr = date.toDateString();
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduledAt || meeting.createdAt);
      return meetingDate.toDateString() === dateStr;
    });
  };

  // Check if date has meetings
  const hasMeetings = (date) => {
    return getMeetingsForDate(date).length > 0;
  };

  // Check if meeting is past, today, or future
  const getMeetingStatus = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < today) return 'past';
    if (checkDate.getTime() === today.getTime()) return 'today';
    return 'future';
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Handle date selection
  const handleDateClick = (date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Get meeting indicator colors
  const getMeetingIndicatorColor = (date) => {
    const status = getMeetingStatus(date);
    const dateMeetings = getMeetingsForDate(date);
    
    if (dateMeetings.length === 0) return null;
    
    switch (status) {
      case 'past':
        return 'bg-green-300'; // Soft green for past meetings
      case 'today':
        return 'bg-green-500'; // Green for today's meetings
      case 'future':
        return 'bg-blue-600'; // Navy blue for future meetings
      default:
        return 'bg-green-300';
    }
  };

  // Get meeting count for tooltip
  const getMeetingCount = (date) => {
    const dateMeetings = getMeetingsForDate(date);
    return dateMeetings.length;
  };

  // Get meeting details for tooltip
  const getMeetingDetails = (date) => {
    const dateMeetings = getMeetingsForDate(date);
    return dateMeetings.map(meeting => ({
      title: meeting.meetingType === 'onboarding' ? 'Onboarding Meeting' : 'Consultation',
      time: new Date(meeting.scheduledAt || meeting.createdAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      client: meeting.client?.firstName ? `${meeting.client.firstName} ${meeting.client.lastName}` : 'Client',
      status: meeting.status
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-blue-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-7 gap-1">
            {[...Array(42)].map((_, i) => (
              <div key={i} className="h-12 bg-blue-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
        <div className="text-center text-blue-500">
          <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-blue-300" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-all duration-300">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <CalendarIcon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900">Meeting Calendar</h3>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-sm font-medium text-blue-700 min-w-[120px] text-center">
            {formatDate(currentMonth)}
          </span>
          
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1">
                     {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
             <div key={day} className="text-center">
               <div className="text-xs font-medium text-blue-600 py-2">
                 {day}
               </div>
             </div>
           ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const hasMeetingsOnDate = hasMeetings(date);
            const meetingColor = getMeetingIndicatorColor(date);
            const meetingCount = getMeetingCount(date);
            const meetingDetails = getMeetingDetails(date);
            
            return (
              <div
                key={index}
                className={`relative group cursor-pointer transition-all duration-200 ${
                  isCurrentMonth ? 'hover:bg-blue-50' : 'opacity-40'
                } ${isToday ? 'bg-green-50' : ''} ${isSelected ? 'bg-blue-100' : ''}`}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                {/* Date Number */}
                <div className={`
                  p-1 sm:p-2 text-center text-xs sm:text-sm font-medium rounded-lg transition-colors
                  ${isCurrentMonth ? 'text-blue-900' : 'text-blue-300'}
                  ${isToday ? 'text-green-700' : ''}
                  ${isSelected ? 'text-blue-700' : ''}
                  ${hoveredDate === date ? 'bg-blue-50' : ''}
                `}>
                  {date.getDate()}
                </div>

                {/* Meeting Indicators */}
                {hasMeetingsOnDate && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {meetingCount === 1 ? (
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${meetingColor} shadow-sm`}></div>
                    ) : (
                      <div className="flex gap-1">
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${meetingColor} shadow-sm`}></div>
                        {meetingCount > 2 && (
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${meetingColor} shadow-sm`}></div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tooltip for Meeting Details - Hidden on mobile */}
                {hoveredDate === date && hasMeetingsOnDate && (
                  <div className="hidden sm:block absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white rounded-lg p-3 shadow-xl">
                    <div className="text-sm font-medium mb-2">
                      {meetingCount} Meeting{meetingCount > 1 ? 's' : ''} on {date.toLocaleDateString()}
                    </div>
                    <div className="space-y-2">
                      {meetingDetails.slice(0, 3).map((meeting, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="font-medium">{meeting.title}</span>
                          <span className="text-gray-300">•</span>
                          <span>{meeting.time}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-300">{meeting.client}</span>
                        </div>
                      ))}
                      {meetingCount > 3 && (
                        <div className="text-xs text-gray-400 pt-1 border-t border-gray-700">
                          +{meetingCount - 3} more meeting{meetingCount - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
              <div className="mt-6 pt-4 border-t border-blue-100">
        <div className="flex flex-wrap items-center gap-4 text-xs text-blue-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-300 rounded-full"></div>
            <span>Past Meetings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Today's Meetings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>Upcoming Meetings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingCalendar;
