'use client';

import React from 'react';
import { Practice, ChoirTeam, Venue, Song } from '@/types';

interface MultiPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  practices: Practice[];
  choirTeams: ChoirTeam[];
  venues: Venue[];
  songs: Song[];
  onPracticeSelect: (practice: Practice, choirTeam: ChoirTeam, venue: Venue) => void;
}

const MultiPracticeModal: React.FC<MultiPracticeModalProps> = ({
  isOpen,
  onClose,
  date,
  practices,
  choirTeams,
  venues,
  songs,
  onPracticeSelect
}) => {
  if (!isOpen || practices.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            {formatDate(date)} の練習一覧
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {practices.map(practice => {
              const choirTeam = choirTeams.find(team => team.id === practice.choirTeamId);
              const venue = venues.find(v => v.id === practice.venueId);
              const practiceSongs = songs.filter(song => practice.songIds.includes(song.id));
              
              if (!choirTeam || !venue) return null;

              return (
                <div
                  key={practice.id}
                  onClick={() => {
                    onPracticeSelect(practice, choirTeam, venue);
                    onClose();
                  }}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: choirTeam.color }}
                      ></div>
                      <h4 className="font-semibold text-gray-800">
                        {choirTeam.name}
                      </h4>
                    </div>
                    <span className="text-sm text-gray-600">
                      {practice.startTime} - {practice.endTime}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">場所:</span> {venue.name}
                  </div>
                  
                  {practiceSongs.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">練習曲:</span> 
                      {practiceSongs.map(song => song.title).join(', ')}
                    </div>
                  )}
                  
                  {practice.notes && (
                    <div className="text-sm text-gray-500 mt-1 italic">
                      {practice.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiPracticeModal;