'use client';

import React, { useState } from 'react';
import { Practice, ChoirTeam, Venue } from '@/types';

interface CalendarProps {
  practices: Practice[];
  choirTeams: ChoirTeam[];
  venues: Venue[];
  onPracticeClick: (practice: Practice, choirTeam: ChoirTeam, venue: Venue) => void;
  onMultiplePracticesClick: (date: string, practices: Practice[]) => void;
}

const Calendar: React.FC<CalendarProps> = ({ practices, choirTeams, venues, onPracticeClick, onMultiplePracticesClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getCurrentMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month's days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getPracticesForDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0];
    
    return practices.filter(practice => practice.date === dateString);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const formatMonth = () => {
    return currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  };

  const days = getCurrentMonthDays();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigateMonth('prev')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ‹
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{formatMonth()}</h2>
        <button 
          onClick={() => navigateMonth('next')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
        
        {days.map((day, index) => (
          <div
            key={index}
            className="min-h-24 border border-gray-200 p-1"
          >
            {day && (
              <>
                <div className="text-sm font-medium mb-1">{day}</div>
                <div className="space-y-1">
                  {(() => {
                    const dayPractices = getPracticesForDate(day);
                    
                    if (dayPractices.length === 1) {
                      const practice = dayPractices[0];
                      const choirTeam = choirTeams.find(team => team.id === practice.choirTeamId);
                      const venue = venues.find(v => v.id === practice.venueId);
                      
                      if (!choirTeam || !venue) return null;

                      return (
                        <div
                          key={practice.id}
                          onClick={() => onPracticeClick(practice, choirTeam, venue)}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: choirTeam.color }}
                        >
                          <div className="text-white font-medium">
                            {practice.startTime}
                          </div>
                          <div className="text-white text-xs">
                            {venue.abbreviation}
                          </div>
                          <div className="text-white text-xs">
                            {choirTeam.abbreviation}
                          </div>
                        </div>
                      );
                    } else if (dayPractices.length > 1) {
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth();
                      const date = new Date(year, month, day);
                      const dateString = date.toISOString().split('T')[0];
                      
                      return (
                        <div
                          onClick={() => onMultiplePracticesClick(dateString, dayPractices)}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-gray-600"
                        >
                          <div className="text-white font-medium text-center">
                            練習{dayPractices.length}件
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;