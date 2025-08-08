import { render, screen, fireEvent } from '@testing-library/react';
import Calendar from '../Calendar';
import { Practice, ChoirTeam, Venue, Performance } from '@/types';

// テスト用のモックデータ
const mockChoirTeams: ChoirTeam[] = [
  {
    id: '1',
    name: 'テスト合唱団A',
    abbreviation: '団A',
    color: '#3B82F6'
  },
  {
    id: '2',
    name: 'テスト合唱団B',
    abbreviation: '団B',
    color: '#EF4444'
  }
];

const mockVenues: Venue[] = [
  {
    id: '1',
    name: 'テスト会館A',
    abbreviation: '会館A'
  },
  {
    id: '2',
    name: 'テスト会館B',
    abbreviation: '会館B'
  }
];

const mockPractices: Practice[] = [
  {
    id: '1',
    date: '2025-08-07',
    startTime: '19:00',
    endTime: '21:00',
    choirTeamId: '1',
    venueId: '1',
    songIds: ['1'],
    notes: 'テスト練習1'
  },
  {
    id: '2',
    date: '2025-08-08',
    startTime: '18:30',
    endTime: '20:30',
    choirTeamId: '2',
    venueId: '2',
    songIds: ['2'],
    notes: 'テスト練習2'
  }
];

const mockPerformances: Performance[] = [
  {
    id: '1',
    date: '2025-08-10',
    startTime: '14:00',
    endTime: '16:00',
    choirTeamId: '1',
    venueId: '1',
    songIds: ['1'],
    title: 'テストコンサート',
    notes: 'テスト本番'
  }
];

// モック関数
const mockOnPracticeClick = jest.fn();
const mockOnPerformanceClick = jest.fn();
const mockOnMultiplePracticesClick = jest.fn();

// 各テストケース前にモック関数をリセット
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Calendar Component', () => {
  const defaultProps = {
    practices: mockPractices,
    performances: mockPerformances,
    choirTeams: mockChoirTeams,
    venues: mockVenues,
    includePerformancesInFilter: false,
    onPracticeClick: mockOnPracticeClick,
    onPerformanceClick: mockOnPerformanceClick,
    onMultiplePracticesClick: mockOnMultiplePracticesClick,
  };

  it('カレンダーが正しくレンダリングされる', () => {
    render(<Calendar {...defaultProps} />);
    
    // 月年表示があることを確認（例：2025年8月）
    expect(screen.getByText(/2025年8月/)).toBeInTheDocument();
    
    // 曜日ヘッダーが表示されることを確認
    expect(screen.getByText('日')).toBeInTheDocument();
    expect(screen.getByText('月')).toBeInTheDocument();
    expect(screen.getByText('火')).toBeInTheDocument();
    expect(screen.getByText('水')).toBeInTheDocument();
    expect(screen.getByText('木')).toBeInTheDocument();
    expect(screen.getByText('金')).toBeInTheDocument();
    expect(screen.getByText('土')).toBeInTheDocument();
  });

  it('練習が正しく表示される', () => {
    render(<Calendar {...defaultProps} />);
    
    // 練習時間が表示されることを確認
    expect(screen.getByText('19:00')).toBeInTheDocument();
    expect(screen.getByText('18:30')).toBeInTheDocument();
    
    // 会場略称が表示されることを確認
    expect(screen.getByText('会館A')).toBeInTheDocument();
    expect(screen.getByText('会館B')).toBeInTheDocument();
    
    // 合唱団略称が表示されることを確認
    expect(screen.getByText('団A')).toBeInTheDocument();
    expect(screen.getByText('団B')).toBeInTheDocument();
  });

  it('本番が正しく表示される', () => {
    render(<Calendar {...defaultProps} />);
    
    // 本番の表示を確認（「本番 時間」形式）
    expect(screen.getByText('本番 14:00')).toBeInTheDocument();
  });

  it('月移動ボタンが動作する', () => {
    render(<Calendar {...defaultProps} />);
    
    const nextButton = screen.getByText('›');
    const prevButton = screen.getByText('‹');
    
    // 次月ボタンをクリック
    fireEvent.click(nextButton);
    expect(screen.getByText(/2025年9月/)).toBeInTheDocument();
    
    // 前月ボタンをクリック
    fireEvent.click(prevButton);
    expect(screen.getByText(/2025年8月/)).toBeInTheDocument();
  });

  it('練習をクリックするとコールバックが呼ばれる', () => {
    render(<Calendar {...defaultProps} />);
    
    // 練習要素を探してクリック
    const practiceElement = screen.getByText('19:00').closest('div');
    expect(practiceElement).toBeTruthy();
    
    fireEvent.click(practiceElement!);
    
    // onPracticeClickが適切な引数で呼ばれることを確認
    expect(mockOnPracticeClick).toHaveBeenCalledWith(
      mockPractices[0],
      mockChoirTeams[0],
      mockVenues[0]
    );
  });

  it('本番をクリックするとコールバックが呼ばれる', () => {
    render(<Calendar {...defaultProps} />);
    
    // 本番要素を探してクリック
    const performanceElement = screen.getByText('本番 14:00').closest('div');
    expect(performanceElement).toBeTruthy();
    
    fireEvent.click(performanceElement!);
    
    // onPerformanceClickが適切な引数で呼ばれることを確認
    expect(mockOnPerformanceClick).toHaveBeenCalledWith(
      mockPerformances[0],
      mockChoirTeams[0],
      mockVenues[0]
    );
  });

  it('データが空の場合でもエラーなく表示される', () => {
    const emptyProps = {
      ...defaultProps,
      practices: [],
      performances: [],
    };
    
    render(<Calendar {...emptyProps} />);
    
    // カレンダー自体は表示される
    expect(screen.getByText(/2025年8月/)).toBeInTheDocument();
    
    // 練習や本番の要素は表示されない
    expect(screen.queryByText('19:00')).not.toBeInTheDocument();
    expect(screen.queryByText('本番 14:00')).not.toBeInTheDocument();
  });

  describe('時間帯別表示', () => {
    const morningPractice: Practice = {
      id: '3',
      date: '2025-08-15',
      startTime: '10:00',
      endTime: '12:00',
      choirTeamId: '1',
      venueId: '1',
      songIds: ['1'],
    };

    const eveningPractice: Practice = {
      id: '4',
      date: '2025-08-15',
      startTime: '18:00',
      endTime: '20:00',
      choirTeamId: '2',
      venueId: '2',
      songIds: ['2'],
    };

    it('時間帯の重複がない場合は時間帯別表示になる', () => {
      const props = {
        ...defaultProps,
        practices: [morningPractice, eveningPractice],
      };
      
      render(<Calendar {...props} />);
      
      // 時間帯別表示を確認
      expect(screen.getByText('朝：団A')).toBeInTheDocument();
      expect(screen.getByText('夜：団B')).toBeInTheDocument();
    });

    it('時間帯の重複がある場合は件数表示になる', () => {
      const morningPractice2: Practice = {
        ...morningPractice,
        id: '5',
        choirTeamId: '2',
        startTime: '11:00',
      };
      
      const props = {
        ...defaultProps,
        practices: [morningPractice, morningPractice2],
      };
      
      render(<Calendar {...props} />);
      
      // 件数表示を確認
      expect(screen.getByText('練習2件')).toBeInTheDocument();
    });
  });
});