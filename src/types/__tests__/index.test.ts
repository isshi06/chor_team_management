import { ChoirTeam, Venue, Song, Practice, Performance } from '../index';

describe('Types', () => {
  describe('ChoirTeam', () => {
    it('正しい型構造を持つ', () => {
      const choirTeam: ChoirTeam = {
        id: '1',
        name: 'テスト合唱団',
        abbreviation: 'テスト',
        color: '#FF0000'
      };

      expect(choirTeam.id).toBe('1');
      expect(choirTeam.name).toBe('テスト合唱団');
      expect(choirTeam.abbreviation).toBe('テスト');
      expect(choirTeam.color).toBe('#FF0000');
    });
  });

  describe('Venue', () => {
    it('必須フィールドのみでも正しく動作する', () => {
      const venue: Venue = {
        id: '1',
        name: 'テスト会館',
        abbreviation: '会館'
      };

      expect(venue.address).toBeUndefined();
    });

    it('オプショナルフィールドを含めて正しく動作する', () => {
      const venue: Venue = {
        id: '1',
        name: 'テスト会館',
        abbreviation: '会館',
        address: 'テスト市テスト区1-1-1'
      };

      expect(venue.address).toBe('テスト市テスト区1-1-1');
    });
  });

  describe('Song', () => {
    it('オプショナルフィールドが正しく動作する', () => {
      const songMinimal: Song = {
        id: '1',
        title: 'テスト楽曲'
      };

      expect(songMinimal.composer).toBeUndefined();
      expect(songMinimal.lyricist).toBeUndefined();

      const songFull: Song = {
        id: '1',
        title: 'テスト楽曲',
        composer: 'テスト作曲者',
        lyricist: 'テスト作詞者'
      };

      expect(songFull.composer).toBe('テスト作曲者');
      expect(songFull.lyricist).toBe('テスト作詞者');
    });
  });

  describe('Practice', () => {
    it('正しい型構造を持つ', () => {
      const practice: Practice = {
        id: '1',
        date: '2025-08-07',
        startTime: '19:00',
        endTime: '21:00',
        choirTeamId: '1',
        venueId: '1',
        songIds: ['1', '2'],
        notes: 'テスト練習'
      };

      expect(practice.songIds).toEqual(['1', '2']);
      expect(Array.isArray(practice.songIds)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('Practiceと同様の構造にtitleフィールドを追加', () => {
      const performance: Performance = {
        id: '1',
        date: '2025-08-10',
        startTime: '14:00',
        endTime: '16:00',
        choirTeamId: '1',
        venueId: '1',
        songIds: ['1', '2'],
        title: 'テストコンサート',
        notes: 'テスト本番'
      };

      expect(performance.title).toBe('テストコンサート');
      // Practiceと共通のフィールドも確認
      expect(performance.date).toBe('2025-08-10');
      expect(performance.songIds).toEqual(['1', '2']);
    });
  });
});