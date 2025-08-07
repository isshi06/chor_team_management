export interface ChoirTeam {
  id: string;
  name: string;
  abbreviation: string; // 全角4文字以内での略称
  color: string; // カレンダー表示用の色
}

export interface Venue {
  id: string;
  name: string;
  abbreviation: string; // 全角4文字以内での略称
  address?: string;
}

export interface Song {
  id: string;
  title: string;
  composer?: string;
  lyricist?: string;
}

export interface Practice {
  id: string;
  date: string; // YYYY-MM-DD形式
  startTime: string; // HH:MM形式
  endTime: string; // HH:MM形式
  choirTeamId: string;
  venueId: string;
  songIds: string[];
  notes?: string;
}

export interface Performance {
  id: string;
  date: string; // YYYY-MM-DD形式
  startTime: string; // HH:MM形式
  endTime: string; // HH:MM形式
  choirTeamId: string;
  venueId: string;
  songIds: string[];
  title: string; // 本番のタイトル（コンサート名等）
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  practices: Practice[];
  choirTeams: ChoirTeam[];
  venues: Venue[];
}

export interface PopupData {
  practice: Practice;
  choirTeam: ChoirTeam;
  venue: Venue;
  songs: Song[];
}