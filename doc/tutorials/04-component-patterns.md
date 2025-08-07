# コンポーネント設計パターン：バックエンドエンジニア向け解説

## コンポーネントパターンとは

コンポーネントパターンは、UIの再利用性・保守性・テスタビリティを向上させる設計パターンです。バックエンドでのデザインパターン（Strategy、Observer、Factory など）と同じ概念です。

## 1. Container/Presentational パターン

### サーバーサイドでの分離
```java
// Controller（ビジネスロジック + データ取得）
@RestController
public class PracticeController {
    @Autowired
    private PracticeService practiceService;
    
    @GetMapping("/practices")
    public ResponseEntity<List<Practice>> getPractices() {
        List<Practice> practices = practiceService.getAllPractices();
        return ResponseEntity.ok(practices);
    }
}

// View（表示のみ）
// practice-list.html - 純粋な表示ロジック
```

### React での分離
```typescript
// Container Component（データ取得 + ロジック）
function PracticeContainer() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadPractices();
  }, []);
  
  const loadPractices = async () => {
    setLoading(true);
    const data = await fetchPractices();
    setPractices(data);
    setLoading(false);
  };
  
  return (
    <PracticeList 
      practices={practices} 
      loading={loading} 
    />
  );
}

// Presentational Component（表示のみ）
function PracticeList({ practices, loading }: PracticeListProps) {
  if (loading) return <div>読み込み中...</div>;
  
  return (
    <ul>
      {practices.map(practice => (
        <li key={practice.id}>{practice.title}</li>
      ))}
    </ul>
  );
}
```

### 本プロジェクトでの適用例
```typescript
// src/app/page.tsx（Container）
export default function Home() {
  // 状態管理とビジネスロジック
  const [selectedChoirTeamIds, setSelectedChoirTeamIds] = useState<string[]>([]);
  const filteredPractices = samplePractices.filter(practice => 
    selectedChoirTeamIds.includes(practice.choirTeamId)
  );
  
  const handlePracticeClick = (practice: Practice) => {
    // ビジネスロジック
  };
  
  return (
    <Calendar 
      practices={filteredPractices}
      onPracticeClick={handlePracticeClick}
    />
  );
}

// src/components/Calendar.tsx（Presentational）
function Calendar({ practices, onPracticeClick }: CalendarProps) {
  // 表示ロジックのみ
  return (
    <div className="calendar">
      {/* カレンダー表示 */}
    </div>
  );
}
```

## 2. Compound Components パターン

### 概念：APIのように関連コンポーネントをグループ化

#### サーバーサイドでのAPI設計
```java
// REST APIの関連エンドポイントをグループ化
@RestController
@RequestMapping("/api/practices")
public class PracticeController {
    @GetMapping
    public List<Practice> list() { ... }
    
    @GetMapping("/{id}")
    public Practice detail(@PathVariable String id) { ... }
    
    @PostMapping
    public Practice create(@RequestBody Practice practice) { ... }
}
```

#### React での Compound Components
```typescript
// Modal API（本プロジェクトのモーダル設計の改善案）
function Modal({ children, isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// Sub-components
Modal.Header = function ModalHeader({ children, onClose }: HeaderProps) {
  return (
    <div className="modal-header">
      <h3>{children}</h3>
      <button onClick={onClose}>×</button>
    </div>
  );
};

Modal.Body = function ModalBody({ children }: BodyProps) {
  return <div className="modal-body">{children}</div>;
};

Modal.Footer = function ModalFooter({ children }: FooterProps) {
  return <div className="modal-footer">{children}</div>;
};

// 使用例
function PracticeDetailModal() {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header onClose={onClose}>
        練習詳細
      </Modal.Header>
      <Modal.Body>
        <div>練習情報...</div>
      </Modal.Body>
      <Modal.Footer>
        <button onClick={onClose}>閉じる</button>
      </Modal.Footer>
    </Modal>
  );
}
```

## 3. Render Props パターン

### データロジックの再利用

#### サーバーサイドでのTemplate Method Pattern
```ruby
# 抽象クラス（共通ロジック）
class DataLoader
  def load_data
    set_loading(true)
    begin
      data = fetch_data # 子クラスで実装
      process_data(data)
    ensure
      set_loading(false)
    end
  end
  
  def fetch_data
    raise NotImplementedError, "子クラスで実装してください"
  end
  
  def process_data(data)
    data
  end
end

# 具体実装
class PracticeLoader < DataLoader
  def fetch_data
    Practice.all
  end
end
```

#### React での Render Props
```typescript
// 汎用データローダー
interface DataLoaderProps<T> {
  loadData: () => Promise<T>;
  children: (data: {
    data: T | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
  }) => React.ReactNode;
}

function DataLoader<T>({ loadData, children }: DataLoaderProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadData]);
  
  useEffect(() => {
    load();
  }, [load]);
  
  return children({ data, loading, error, reload: load });
}

// 使用例
function PracticeList() {
  return (
    <DataLoader loadData={() => fetchPractices()}>
      {({ data: practices, loading, error, reload }) => {
        if (loading) return <div>読み込み中...</div>;
        if (error) return <div>エラー: {error} <button onClick={reload}>再試行</button></div>;
        
        return (
          <ul>
            {practices?.map(practice => (
              <li key={practice.id}>{practice.title}</li>
            ))}
          </ul>
        );
      }}
    </DataLoader>
  );
}
```

## 4. Higher-Order Components (HOC) パターン

### デコレーターパターンの実装

#### サーバーサイドでのデコレーター
```ruby
# Rubyのモジュール（横断的関心事）
module Loggable
  def self.included(base)
    base.extend(ClassMethods)
  end
  
  module ClassMethods
    def loggable(method_name)
      original_method = instance_method(method_name)
      
      define_method(method_name) do |*args, &block|
        start_time = Time.current
        result = original_method.bind(self).call(*args, &block)
        end_time = Time.current
        puts "実行時間: #{(end_time - start_time) * 1000}ms"
        result
      end
    end
  end
end

class PracticeService
  include Loggable
  
  def get_all_practices
    # ビジネスロジック
  end
  
  loggable :get_all_practices
end
```

#### React での HOC
```typescript
// ログ出力機能を追加するHOC
function withLogging<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function LoggedComponent(props: P) {
    useEffect(() => {
      console.log(`${componentName} がマウントされました`);
      return () => {
        console.log(`${componentName} がアンマウントされました`);
      };
    }, []);
    
    return <WrappedComponent {...props} />;
  };
}

// エラーバウンダリ機能を追加するHOC
function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ErrorBoundaryComponent(props: P) {
    const [hasError, setHasError] = useState(false);
    
    if (hasError) {
      return <div>エラーが発生しました</div>;
    }
    
    try {
      return <WrappedComponent {...props} />;
    } catch (error) {
      setHasError(true);
      return <div>エラーが発生しました</div>;
    }
  };
}

// 使用例
const EnhancedCalendar = withErrorBoundary(
  withLogging(Calendar, 'Calendar')
);
```

## 5. Custom Hooks パターン

### ビジネスロジックの再利用

#### サーバーサイドでのService層
```ruby
class PracticeFilterService
  def self.filter_by_choir_teams(practices, team_ids)
    practices.select do |practice|
      team_ids.include?(practice.choir_team_id)
    end
  end
end

class PracticeModalService
  def self.get_practice_detail(practice_id)
    practice = Practice.find(practice_id)
    team = ChoirTeam.find(practice.choir_team_id)
    venue = Venue.find(practice.venue_id)
    
    PracticeDetail.new(practice, team, venue)
  end
end
```

#### React での Custom Hooks
```typescript
// 練習フィルターロジック
function usePracticeFilter(practices: Practice[]) {
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  
  const filteredPractices = useMemo(() => {
    if (selectedTeamIds.length === 0) return practices;
    return practices.filter(practice => 
      selectedTeamIds.includes(practice.choirTeamId)
    );
  }, [practices, selectedTeamIds]);
  
  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };
  
  return {
    filteredPractices,
    selectedTeamIds,
    toggleTeam,
    clearFilter: () => setSelectedTeamIds([]),
    selectAll: (teamIds: string[]) => setSelectedTeamIds(teamIds)
  };
}

// モーダル制御ロジック
function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  };
}

// 練習詳細データロジック
function usePracticeDetail(practice: Practice | null) {
  const [choirTeam, setChoirTeam] = useState<ChoirTeam | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  
  useEffect(() => {
    if (!practice) {
      setChoirTeam(null);
      setVenue(null);
      setSongs([]);
      return;
    }
    
    // 関連データを取得
    const team = sampleChoirTeams.find(t => t.id === practice.choirTeamId);
    const v = sampleVenues.find(v => v.id === practice.venueId);
    const s = sampleSongs.filter(song => practice.songIds.includes(song.id));
    
    setChoirTeam(team || null);
    setVenue(v || null);
    setSongs(s);
  }, [practice]);
  
  return { choirTeam, venue, songs };
}

// 使用例（本プロジェクトの改善案）
function App() {
  const practiceFilter = usePracticeFilter(samplePractices);
  const practiceModal = useModal();
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const practiceDetail = usePracticeDetail(selectedPractice);
  
  const handlePracticeClick = (practice: Practice) => {
    setSelectedPractice(practice);
    practiceModal.open();
  };
  
  return (
    <div>
      <Calendar 
        practices={practiceFilter.filteredPractices}
        onPracticeClick={handlePracticeClick}
      />
      <PracticeModal
        isOpen={practiceModal.isOpen}
        onClose={practiceModal.close}
        practice={selectedPractice}
        choirTeam={practiceDetail.choirTeam}
        venue={practiceDetail.venue}
        songs={practiceDetail.songs}
      />
    </div>
  );
}
```

## 6. Error Boundary パターン

### 例外処理の一元管理

#### サーバーサイドでの例外処理
```ruby
class ApplicationController < ActionController::Base
  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
  rescue_from StandardError, with: :handle_generic_error
  
  private
  
  def handle_not_found(exception)
    error_response = {
      error: "PRACTICE_NOT_FOUND",
      message: exception.message
    }
    render json: error_response, status: :not_found
  end
  
  def handle_generic_error(exception)
    error_response = {
      error: "INTERNAL_ERROR",
      message: "システムエラーが発生しました"
    }
    Rails.logger.error exception.backtrace.join("\n")
    render json: error_response, status: :internal_server_error
  end
end
```

#### React での Error Boundary
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    // エラーログ送信などの処理
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>エラーが発生しました</h2>
          <details>
            <summary>詳細</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            リトライ
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// 使用例
function App() {
  return (
    <ErrorBoundary fallback={<div>カレンダーでエラーが発生しました</div>}>
      <Calendar practices={practices} />
    </ErrorBoundary>
  );
}
```

## 7. Dependency Injection パターン

### サービス層の注入

#### サーバーサイド
```ruby
class PracticeService
  # 実装
end

class PracticesController < ApplicationController
  def initialize
    @practice_service = PracticeService.new
  end
end
```

#### React での Dependency Injection（Context API）
```typescript
// サービス定義
interface PracticeService {
  getAllPractices(): Promise<Practice[]>;
  getPracticeById(id: string): Promise<Practice>;
  createPractice(practice: CreatePracticeRequest): Promise<Practice>;
}

class ApiPracticeService implements PracticeService {
  async getAllPractices(): Promise<Practice[]> {
    const response = await fetch('/api/practices');
    return response.json();
  }
  
  async getPracticeById(id: string): Promise<Practice> {
    const response = await fetch(`/api/practices/${id}`);
    return response.json();
  }
  
  async createPractice(practice: CreatePracticeRequest): Promise<Practice> {
    const response = await fetch('/api/practices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(practice)
    });
    return response.json();
  }
}

class MockPracticeService implements PracticeService {
  async getAllPractices(): Promise<Practice[]> {
    return samplePractices;
  }
  
  async getPracticeById(id: string): Promise<Practice> {
    const practice = samplePractices.find(p => p.id === id);
    if (!practice) throw new Error('Practice not found');
    return practice;
  }
  
  async createPractice(practice: CreatePracticeRequest): Promise<Practice> {
    const newPractice: Practice = {
      id: Date.now().toString(),
      ...practice
    };
    return newPractice;
  }
}

// Context での注入
const ServiceContext = createContext<{
  practiceService: PracticeService;
} | null>(null);

function ServiceProvider({ children }: { children: React.ReactNode }) {
  const practiceService = process.env.NODE_ENV === 'development' 
    ? new MockPracticeService()
    : new ApiPracticeService();
  
  return (
    <ServiceContext.Provider value={{ practiceService }}>
      {children}
    </ServiceContext.Provider>
  );
}

// Hook での利用
function usePracticeService() {
  const context = useContext(ServiceContext);
  if (!context) throw new Error('ServiceProvider が必要です');
  return context.practiceService;
}

// 使用例
function PracticeList() {
  const practiceService = usePracticeService();
  const [practices, setPractices] = useState<Practice[]>([]);
  
  useEffect(() => {
    practiceService.getAllPractices().then(setPractices);
  }, [practiceService]);
  
  return <ul>{/* 練習一覧 */}</ul>;
}
```

## 本プロジェクトでのパターン活用例

### 現在の実装
```typescript
// 単一のコンポーネントに複数の責務
function App() {
  // UI状態管理
  const [modalOpen, setModalOpen] = useState(false);
  
  // データ管理
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  
  // ビジネスロジック
  const filteredPractices = samplePractices.filter(practice => 
    selectedChoirTeamIds.includes(practice.choirTeamId)
  );
  
  // イベントハンドリング
  const handlePracticeClick = (practice: Practice, choirTeam: ChoirTeam, venue: Venue) => {
    // 複雑な処理
  };
}
```

### パターン適用後の改善案
```typescript
// Custom Hooks で責務分離
function usePracticeManagement() {
  const filter = usePracticeFilter(samplePractices);
  const modal = useModal();
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const detail = usePracticeDetail(selectedPractice);
  
  const selectPractice = (practice: Practice) => {
    setSelectedPractice(practice);
    modal.open();
  };
  
  return {
    ...filter,
    ...modal,
    selectedPractice,
    selectPractice,
    ...detail
  };
}

// Container Component（ロジック）
function PracticeContainer() {
  const practiceManagement = usePracticeManagement();
  
  return (
    <PracticeView 
      {...practiceManagement}
    />
  );
}

// Presentational Component（表示）
function PracticeView({
  filteredPractices,
  isOpen,
  close,
  selectedPractice,
  choirTeam,
  venue,
  songs,
  selectPractice
}: PracticeViewProps) {
  return (
    <ErrorBoundary>
      <Calendar 
        practices={filteredPractices}
        onPracticeClick={selectPractice}
      />
      <PracticeModal
        isOpen={isOpen}
        onClose={close}
        practice={selectedPractice}
        choirTeam={choirTeam}
        venue={venue}
        songs={songs}
      />
    </ErrorBoundary>
  );
}
```

## まとめ

React コンポーネントパターンは、バックエンドでの設計パターンと同じ目的を持ちます：

| バックエンドパターン | React パターン | 目的 |
|---|---|---|
| Controller/Service分離 | Container/Presentational | 責務分離 |
| Template Method | Render Props/HOC | ロジック再利用 |
| Decorator | HOC | 機能拡張 |
| Dependency Injection | Context API | 依存性管理 |
| Exception Handler | Error Boundary | 例外処理 |
| Service Layer | Custom Hooks | ビジネスロジック |

適切なパターンを選択することで、保守性・拡張性・テスタビリティの高いReactアプリケーションを構築できます。

次は [05-testing-strategies.md](./05-testing-strategies.md) でテスト戦略について学びましょう。