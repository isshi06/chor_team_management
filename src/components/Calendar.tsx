'use client';

import React, { useState } from 'react';
import { Practice, ChoirTeam, Venue, Performance } from '@/types';

interface CalendarProps {
  practices: Practice[];
  performances: Performance[];
  choirTeams: ChoirTeam[];
  venues: Venue[];
  includePerformancesInFilter: boolean;
  onPracticeClick: (practice: Practice, choirTeam: ChoirTeam, venue: Venue) => void;
  onPerformanceClick: (performance: Performance, choirTeam: ChoirTeam, venue: Venue) => void;
  onMultiplePracticesClick: (date: string, practices: Practice[]) => void;
}

const Calendar: React.FC<CalendarProps> = ({ practices, performances, choirTeams, venues, includePerformancesInFilter, onPracticeClick, onPerformanceClick, onMultiplePracticesClick }) => {
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

  // 指定した日付の練習一覧を取得する関数
  const getPracticesForDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD形式に変換
    
    return practices.filter(practice => practice.date === dateString);
  };

  // 指定した日付の本番一覧を取得する関数
  const getPerformancesForDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD形式に変換
    
    return performances.filter(performance => performance.date === dateString);
  };

  // 練習開始時間から時間帯を判定する関数
  // 朝昼夜の時間帯別表示のために使用
  const getTimeSlot = (startTime: string) => {
    const hour = parseInt(startTime.split(':')[0]);
    if (hour >= 6 && hour < 13) return 'morning'; // 朝: 6:00-12:59
    if (hour >= 13 && hour < 17) return 'afternoon'; // 昼: 13:00-16:59  
    if (hour >= 17 && hour < 24) return 'evening'; // 夜: 17:00-23:59
    return 'other'; // その他の時間帯
  };

  // 時間帯コードを日本語ラベルに変換する関数
  const getTimeSlotLabel = (timeSlot: string) => {
    switch (timeSlot) {
      case 'morning': return '朝';
      case 'afternoon': return '昼';
      case 'evening': return '夜';
      default: return '';
    }
  };

  // 練習を時間帯別にグループ分けする関数
  // 朝・昼・夜で重複がない場合の表示に使用
  const groupPracticesByTimeSlot = (practices: Practice[]) => {
    const grouped: { [key: string]: Practice[] } = {
      morning: [],
      afternoon: [],
      evening: [],
      other: []
    };
    
    practices.forEach(practice => {
      const timeSlot = getTimeSlot(practice.startTime);
      grouped[timeSlot].push(practice);
    });
    
    return grouped;
  };

  // 同じ時間帯に複数の練習があるかチェックする関数
  // true: 「練習X件」表示, false: 時間帯別表示
  const hasTimeSlotOverlap = (practices: Practice[]) => {
    const grouped = groupPracticesByTimeSlot(practices);
    return Object.values(grouped).some(slot => slot.length > 1);
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
                    // その日の練習と本番を取得
                    const dayPractices = getPracticesForDate(day);
                    const dayPerformances = getPerformancesForDate(day);
                    const totalEvents = dayPractices.length + dayPerformances.length;
                    
                    // イベントがない場合は何も表示しない
                    if (totalEvents === 0) return null;
                    
                    // パターン1: 練習のみ1件の場合
                    // 通常の練習表示（時間・会場・合唱団名）
                    if (dayPractices.length === 1 && dayPerformances.length === 0) {
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
                    }
                    
                    // パターン2: 本番のみ1件の場合
                    // 金色の果線で本番であることを強調
                    if (dayPerformances.length === 1 && dayPractices.length === 0) {
                      const performance = dayPerformances[0];
                      const choirTeam = choirTeams.find(team => team.id === performance.choirTeamId);
                      const venue = venues.find(v => v.id === performance.venueId);
                      
                      if (!choirTeam || !venue) return null;

                      return (
                        <div
                          key={performance.id}
                          onClick={() => onPerformanceClick(performance, choirTeam, venue)}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity border-2 relative"
                          style={{ backgroundColor: choirTeam.color, borderColor: '#FFD700' }}
                        >
                          <div className="text-white font-medium">
                            本番 {performance.startTime}
                          </div>
                          <div className="text-white text-xs">
                            {venue.abbreviation}
                          </div>
                          <div className="text-white text-xs">
                            {choirTeam.abbreviation}
                          </div>
                        </div>
                      );
                    }
                    
                    // パターン3: 本番1件+練習がある場合
                    // 本番情報と練習件数を別々に表示し、クリックできるようにする
                    if (dayPerformances.length === 1 && dayPractices.length > 0) {
                      const performance = dayPerformances[0];
                      const choirTeam = choirTeams.find(team => team.id === performance.choirTeamId);
                      const venue = venues.find(v => v.id === performance.venueId);
                      
                      if (!choirTeam || !venue) return null;
                      
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth();
                      const date = new Date(year, month, day);
                      const dateString = date.toISOString().split('T')[0];

                      return (
                        <div className="space-y-1">
                          <div
                            key={performance.id}
                            onClick={() => onPerformanceClick(performance, choirTeam, venue)}
                            className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity border-2"
                            style={{ backgroundColor: choirTeam.color, borderColor: '#FFD700' }}
                          >
                            <div className="text-white font-medium">
                              本番 {performance.startTime}
                            </div>
                            <div className="text-white text-xs">
                              {venue.abbreviation}
                            </div>
                            <div className="text-white text-xs">
                              {choirTeam.abbreviation}
                            </div>
                          </div>
                          <div
                            onClick={() => onMultiplePracticesClick(dateString, dayPractices)}
                            className="text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-gray-600"
                          >
                            <div className="text-white font-medium text-center">
                              練習{dayPractices.length}件
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // パターン4: 練習のみ複数の場合
                    // 時間帯重複の有無で表示を切り替え
                    if (dayPractices.length > 1 && dayPerformances.length === 0) {
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth();
                      const date = new Date(year, month, day);
                      const dateString = date.toISOString().split('T')[0];
                      
                      // 時間帯の重複があるかチェック
                      // 例: 朝10:00と朝11:00の練習 = 重複あり
                      if (hasTimeSlotOverlap(dayPractices)) {
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
                      } else {
                        // 時間帯別に表示（朝：合唱団A、昼：合唱団Bなど）
                        const grouped = groupPracticesByTimeSlot(dayPractices);
                        const timeSlots = ['morning', 'afternoon', 'evening', 'other'];
                        
                        return (
                          <div className="space-y-1">
                            {timeSlots.map(timeSlot => {
                              const slotPractices = grouped[timeSlot];
                              if (slotPractices.length === 0) return null;
                              
                              const practice = slotPractices[0];
                              const choirTeam = choirTeams.find(team => team.id === practice.choirTeamId);
                              const venue = venues.find(v => v.id === practice.venueId);
                              
                              if (!choirTeam || !venue) return null;
                              
                              return (
                                <div
                                  key={`${timeSlot}-${practice.id}`}
                                  onClick={() => onPracticeClick(practice, choirTeam, venue)}
                                  className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  style={{ backgroundColor: choirTeam.color }}
                                >
                                  <div className="text-white font-medium">
                                    {getTimeSlotLabel(timeSlot)}：{choirTeam.abbreviation}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }
                    }
                    
                    // 本番複数、または本番と練習複数の混在の場合
                    if (totalEvents > 1 && (dayPerformances.length > 1 || (dayPerformances.length >= 1 && dayPractices.length > 1))) {
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth();
                      const date = new Date(year, month, day);
                      const dateString = date.toISOString().split('T')[0];
                      
                      const practiceLabel = dayPractices.length > 0 ? `練習${dayPractices.length}件` : '';
                      const performanceLabel = dayPerformances.length > 0 ? `本番${dayPerformances.length}件` : '';
                      const label = [practiceLabel, performanceLabel].filter(Boolean).join(' ');
                      
                      return (
                        <div
                          onClick={() => onMultiplePracticesClick(dateString, dayPractices)}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-gray-600"
                        >
                          <div className="text-white font-medium text-center">
                            {label}
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