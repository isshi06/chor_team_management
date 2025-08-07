'use client';

import React from 'react';
import { Practice, ChoirTeam, Venue, Song, Performance } from '@/types';

interface PracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  practice: Practice | null;
  performance: Performance | null;
  choirTeam: ChoirTeam | null;
  venue: Venue | null;
  songs: Song[];
}

const PracticeModal: React.FC<PracticeModalProps> = ({
  isOpen,
  onClose,
  practice,
  performance,
  choirTeam,
  venue,
  songs
}) => {
  if (!isOpen || (!practice && !performance) || !choirTeam || !venue) {
    return null;
  }

  const currentEvent = practice || performance;
  const isPerformance = !!performance;

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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            {isPerformance ? '本番詳細' : '練習詳細'}
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
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">日時</h4>
              <p className="text-gray-600">
                {formatDate(currentEvent.date)}
              </p>
              <p className="text-gray-600">
                {currentEvent.startTime} - {currentEvent.endTime}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">合唱団</h4>
              <div 
                className="inline-block px-3 py-1 rounded text-white text-sm font-medium"
                style={{ backgroundColor: choirTeam.color }}
              >
                {choirTeam.name}
              </div>
            </div>
            
            {isPerformance && performance?.title && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">タイトル</h4>
                <p className="text-gray-600">{performance.title}</p>
              </div>
            )}
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">{isPerformance ? '会場' : '練習場所'}</h4>
              <p className="text-gray-600">{venue.name}</p>
              {venue.address && (
                <p className="text-gray-500 text-sm">{venue.address}</p>
              )}
            </div>
            
            {songs.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">{isPerformance ? '演奏曲' : '練習曲'}</h4>
                <div className="space-y-2">
                  {songs.map(song => (
                    <div key={song.id} className="bg-gray-50 p-3 rounded">
                      <p className="font-medium text-gray-800">{song.title}</p>
                      {song.composer && (
                        <p className="text-gray-600 text-sm">作曲: {song.composer}</p>
                      )}
                      {song.lyricist && (
                        <p className="text-gray-600 text-sm">作詞: {song.lyricist}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {currentEvent.notes && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">備考</h4>
                <p className="text-gray-600">{currentEvent.notes}</p>
              </div>
            )}
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

export default PracticeModal;