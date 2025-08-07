'use client';

import { useState } from 'react';
import Calendar from '@/components/Calendar';
import PracticeModal from '@/components/PracticeModal';
import MultiPracticeModal from '@/components/MultiPracticeModal';
import { Practice, ChoirTeam, Venue, Song, Performance } from '@/types';
import { sampleChoirTeams, sampleVenues, sampleSongs, samplePractices, samplePerformances } from '@/data/sampleData';

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [multiPracticeModalOpen, setMultiPracticeModalOpen] = useState(false);
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const [selectedChoirTeam, setSelectedChoirTeam] = useState<ChoirTeam | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDatePractices, setSelectedDatePractices] = useState<Practice[]>([]);
  const [selectedChoirTeamIds, setSelectedChoirTeamIds] = useState<string[]>(
    sampleChoirTeams.map(team => team.id)
  );
  const [includePerformancesInFilter, setIncludePerformancesInFilter] = useState(false);
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null);

  const handlePracticeClick = (practice: Practice, choirTeam: ChoirTeam, venue: Venue) => {
    const songs = sampleSongs.filter(song => practice.songIds.includes(song.id));
    
    setSelectedPractice(practice);
    setSelectedChoirTeam(choirTeam);
    setSelectedVenue(venue);
    setSelectedSongs(songs);
    setModalOpen(true);
  };

  const handleMultiplePracticesClick = (date: string, practices: Practice[]) => {
    setSelectedDate(date);
    setSelectedDatePractices(practices);
    setMultiPracticeModalOpen(true);
  };

  const handlePracticeSelectFromMultiple = (practice: Practice, choirTeam: ChoirTeam, venue: Venue) => {
    const songs = sampleSongs.filter(song => practice.songIds.includes(song.id));
    
    setSelectedPractice(practice);
    setSelectedChoirTeam(choirTeam);
    setSelectedVenue(venue);
    setSelectedSongs(songs);
    setMultiPracticeModalOpen(false);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPractice(null);
    setSelectedPerformance(null);
    setSelectedChoirTeam(null);
    setSelectedVenue(null);
    setSelectedSongs([]);
  };

  const handleCloseMultiPracticeModal = () => {
    setMultiPracticeModalOpen(false);
    setSelectedDate('');
    setSelectedDatePractices([]);
  };

  const handlePerformanceClick = (performance: Performance, choirTeam: ChoirTeam, venue: Venue) => {
    const songs = sampleSongs.filter(song => performance.songIds.includes(song.id));
    
    setSelectedPerformance(performance);
    setSelectedChoirTeam(choirTeam);
    setSelectedVenue(venue);
    setSelectedSongs(songs);
    setModalOpen(true);
  };

  const handleChoirTeamToggle = (teamId: string) => {
    setSelectedChoirTeamIds(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const filteredPractices = samplePractices.filter(practice => 
    selectedChoirTeamIds.includes(practice.choirTeamId)
  );

  const filteredPerformances = includePerformancesInFilter 
    ? samplePerformances.filter(performance => selectedChoirTeamIds.includes(performance.choirTeamId))
    : samplePerformances;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">合唱団練習日管理</h1>
          <p className="text-gray-600">複数の合唱団の練習スケジュールを一括管理</p>
        </header>

        <Calendar
          practices={filteredPractices}
          performances={filteredPerformances}
          choirTeams={sampleChoirTeams}
          venues={sampleVenues}
          includePerformancesInFilter={includePerformancesInFilter}
          onPracticeClick={handlePracticeClick}
          onPerformanceClick={handlePerformanceClick}
          onMultiplePracticesClick={handleMultiplePracticesClick}
        />

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">表示する合唱団を選択</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleChoirTeams.map(team => (
              <label
                key={team.id}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedChoirTeamIds.includes(team.id)}
                  onChange={() => handleChoirTeamToggle(team.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: team.color }}
                ></div>
                <span className="text-gray-700 font-medium">{team.name}</span>
              </label>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={includePerformancesInFilter}
                onChange={(e) => setIncludePerformancesInFilter(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">本番予定も含めて表示切替を行う</span>
            </label>
          </div>
        </div>

        <PracticeModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          practice={selectedPractice}
          performance={selectedPerformance}
          choirTeam={selectedChoirTeam}
          venue={selectedVenue}
          songs={selectedSongs}
        />

        <MultiPracticeModal
          isOpen={multiPracticeModalOpen}
          onClose={handleCloseMultiPracticeModal}
          date={selectedDate}
          practices={selectedDatePractices.filter(practice => 
            selectedChoirTeamIds.includes(practice.choirTeamId)
          )}
          choirTeams={sampleChoirTeams}
          venues={sampleVenues}
          songs={sampleSongs}
          onPracticeSelect={handlePracticeSelectFromMultiple}
        />
      </div>
    </div>
  );
}
