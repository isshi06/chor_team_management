import { ChoirTeam, Venue, Song, Practice, Performance } from '@/types';

export const sampleChoirTeams: ChoirTeam[] = [
  {
    id: '1',
    name: '合唱団001',
    abbreviation: '団001',
    color: '#3B82F6' // blue
  },
  {
    id: '2',
    name: '合唱団002',
    abbreviation: '団002',
    color: '#EF4444' // red
  },
  {
    id: '3',
    name: '合唱団003',
    abbreviation: '団003',
    color: '#10B981' // green
  }
];

export const sampleVenues: Venue[] = [
  {
    id: '1',
    name: 'サンプル会館A',
    abbreviation: '会館A',
    address: 'サンプル市サンプル区1-1-1'
  },
  {
    id: '2',
    name: 'サンプル文化センターB',
    abbreviation: '文化B',
    address: 'サンプル市サンプル区2-2-2'
  },
  {
    id: '3',
    name: 'サンプル体育館C',
    abbreviation: '体育C',
    address: 'サンプル市サンプル区3-3-3'
  },
  {
    id: '4',
    name: 'サンプルホールD',
    abbreviation: 'ホールD',
    address: 'サンプル市サンプル区4-4-4'
  }
];

export const sampleSongs: Song[] = [
  {
    id: '1',
    title: 'サンプル楽曲A',
    composer: '作曲者A',
    lyricist: '作詞者A'
  },
  {
    id: '2',
    title: 'サンプル楽曲B',
    composer: '作曲者B'
  },
  {
    id: '3',
    title: 'サンプル楽曲C',
    composer: '作曲者C',
    lyricist: '作詞者C'
  },
  {
    id: '4',
    title: 'サンプル楽曲D',
    composer: '作曲者D'
  },
  {
    id: '5',
    title: 'サンプル楽曲E',
    composer: '作曲者E',
    lyricist: '作詞者E'
  },
  {
    id: '6',
    title: 'サンプル楽曲F',
    composer: '作曲者F'
  }
];

export const samplePractices: Practice[] = [
  {
    id: '1',
    date: '2025-08-07',
    startTime: '19:00',
    endTime: '21:00',
    choirTeamId: '1',
    venueId: '1',
    songIds: ['1', '2'],
    notes: 'サンプル練習メモ1'
  },
  {
    id: '2',
    date: '2025-08-08',
    startTime: '18:30',
    endTime: '20:30',
    choirTeamId: '2',
    venueId: '2',
    songIds: ['3', '4'],
    notes: 'サンプル練習メモ2'
  },
  {
    id: '3',
    date: '2025-08-08',
    startTime: '19:00',
    endTime: '21:00',
    choirTeamId: '3',
    venueId: '4',
    songIds: ['5', '6'],
    notes: 'サンプル練習メモ3'
  },
  {
    id: '4',
    date: '2025-08-10',
    startTime: '14:00',
    endTime: '17:00',
    choirTeamId: '1',
    venueId: '3',
    songIds: ['1', '2', '4'],
    notes: 'サンプル練習メモ4'
  },
  {
    id: '5',
    date: '2025-08-15',
    startTime: '18:00',
    endTime: '20:00',
    choirTeamId: '2',
    venueId: '1',
    songIds: ['3'],
    notes: 'サンプル練習メモ5'
  },
  {
    id: '6',
    date: '2025-08-20',
    startTime: '10:00',
    endTime: '12:00',
    choirTeamId: '1',
    venueId: '2',
    songIds: ['1', '6'],
    notes: 'サンプル練習メモ6（朝の練習）'
  },
  {
    id: '7',
    date: '2025-08-20',
    startTime: '18:00',
    endTime: '20:00',
    choirTeamId: '3',
    venueId: '4',
    songIds: ['5'],
    notes: 'サンプル練習メモ7'
  },
  {
    id: '8',
    date: '2025-08-25',
    startTime: '15:00',
    endTime: '18:00',
    choirTeamId: '2',
    venueId: '3',
    songIds: ['3', '4'],
    notes: 'サンプル練習メモ8'
  },
  {
    id: '9',
    date: '2025-08-12',
    startTime: '10:00',
    endTime: '12:00',
    choirTeamId: '1',
    venueId: '1',
    songIds: ['1', '2'],
    notes: '朝の練習'
  },
  {
    id: '10',
    date: '2025-08-12',
    startTime: '14:00',
    endTime: '16:00',
    choirTeamId: '2',
    venueId: '2',
    songIds: ['3', '4'],
    notes: '昼の練習'
  },
  {
    id: '11',
    date: '2025-08-12',
    startTime: '18:00',
    endTime: '20:00',
    choirTeamId: '3',
    venueId: '3',
    songIds: ['5', '6'],
    notes: '夜の練習'
  },
  {
    id: '12',
    date: '2025-08-15',
    startTime: '10:00',
    endTime: '12:00',
    choirTeamId: '1',
    venueId: '1',
    songIds: ['1'],
    notes: '朝の練習（重複テスト）'
  },
  {
    id: '13',
    date: '2025-08-15',
    startTime: '11:00',
    endTime: '13:00',
    choirTeamId: '2',
    venueId: '2',
    songIds: ['3'],
    notes: '朝の練習（重複テスト）'
  }
];

export const samplePerformances: Performance[] = [
  {
    id: '1',
    date: '2025-08-08',
    startTime: '15:00',
    endTime: '17:00',
    choirTeamId: '1',
    venueId: '3',
    songIds: ['1', '2'],
    title: 'サンプル演奏会',
    notes: '練習と同日開催の本番'
  },
  {
    id: '2',
    date: '2025-08-16',
    startTime: '14:00',
    endTime: '16:00',
    choirTeamId: '1',
    venueId: '1',
    songIds: ['1', '2', '4'],
    title: 'サンプルコンサートA',
    notes: '第1回サンプルコンサート'
  },
  {
    id: '3',
    date: '2025-08-23',
    startTime: '18:00',
    endTime: '20:30',
    choirTeamId: '2',
    venueId: '2',
    songIds: ['3', '4', '6'],
    title: 'サンプル発表会B',
    notes: '年次発表会'
  },
  {
    id: '4',
    date: '2025-08-30',
    startTime: '15:00',
    endTime: '17:00',
    choirTeamId: '3',
    venueId: '4',
    songIds: ['5', '6'],
    title: 'サンプル演奏会C',
    notes: '合同演奏会'
  }
];