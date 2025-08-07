# 状態管理の詳細：バックエンドエンジニア向け解説

## 状態管理とは

状態管理は、アプリケーション内のデータの変更を追跡・制御することです。バックエンドでいうと：

- **セッション管理** + **キャッシュ管理** + **データベース更新**
- すべてをブラウザのメモリ内で行う

## 本プロジェクトでの状態管理

### 状態の種類と用途

#### 1. UI表示制御の状態
```typescript
// モーダルの表示/非表示
const [modalOpen, setModalOpen] = useState(false);
const [multiPracticeModalOpen, setMultiPracticeModalOpen] = useState(false);
```
**バックエンドでの相当**: レスポンステンプレートの切り替え

#### 2. 選択されたデータの状態
```typescript
// 現在選択されているアイテム（セッションのようなもの）
const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
const [selectedChoirTeam, setSelectedChoirTeam] = useState<ChoirTeam | null>(null);
const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
```
**バックエンドでの相当**: HttpSessionやRedisキャッシュ

#### 3. フィルター条件の状態
```typescript
// ユーザーが選択したフィルター条件
const [selectedChoirTeamIds, setSelectedChoirTeamIds] = useState<string[]>(
  sampleChoirTeams.map(team => team.id)
);
```
**バックエンドでの相当**: クエリパラメーター + WHERE句の条件

## 状態管理パターンの比較

### 1. ローカル状態（useState）

#### Rails での例
```ruby
class CalendarsController < ApplicationController
  def index
    # リクエストスコープの変数
    selected_date = params[:date]
    @practices = practice_service.get_practices_by_date(selected_date)
    
    render 'calendar'
  end
end
```

#### React での例
```typescript
function Calendar() {
  // コンポーネントスコープの状態
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [practices, setPractices] = useState<Practice[]>([]);
  
  useEffect(() => {
    const newPractices = getPracticesByDate(selectedDate);
    setPractices(newPractices);
  }, [selectedDate]);
  
  return <div>{/* カレンダー表示 */}</div>;
}
```

### 2. Props Drilling（プロップスの伝播）

#### マイクロサービス間の通信に似た概念
```typescript
// App.tsx（API Gateway的役割）
function App() {
  const [globalData, setGlobalData] = useState(initialData);
  
  return (
    <div>
      <ServiceA data={globalData} />
      <ServiceB data={globalData} onUpdate={setGlobalData} />
    </div>
  );
}

// ServiceA.tsx
function ServiceA({ data }: { data: GlobalData }) {
  return <ComponentA data={data} />; // さらに下に伝播
}
```

#### 本プロジェクトでの例
```typescript
// App → Calendar → 個々の日付セル へのデータ伝播
function App() {
  return (
    <Calendar 
      practices={filteredPractices}
      choirTeams={sampleChoirTeams}
      venues={sampleVenues}
      onPracticeClick={handlePracticeClick}
    />
  );
}
```

## 状態の更新パターン

### 1. 単純な値の更新

#### サーバーサイド
```ruby
class PracticesController < ApplicationController
  def select
    session[:selected_practice_id] = params[:practice_id]
    render json: { status: 'success' }
  end
end
```

#### React
```typescript
const handlePracticeSelect = (practiceId: string) => {
  setSelectedPracticeId(practiceId); // 状態更新
};
```

### 2. 複雑なオブジェクトの更新

#### 不変性を保った更新
```typescript
// ❌ 悪い例：既存オブジェクトを変更
selectedPractice.notes = "新しいメモ";
setSelectedPractice(selectedPractice);

// ✅ 良い例：新しいオブジェクトを作成
setSelectedPractice({
  ...selectedPractice,
  notes: "新しいメモ"
});
```

#### 配列の更新
```typescript
// 要素追加
setSelectedChoirTeamIds([...selectedChoirTeamIds, newTeamId]);

// 要素削除
setSelectedChoirTeamIds(selectedChoirTeamIds.filter(id => id !== teamIdToRemove));

// 条件付き追加/削除（本プロジェクトで使用）
setSelectedChoirTeamIds(prev => 
  prev.includes(teamId) 
    ? prev.filter(id => id !== teamId)  // チェック外す
    : [...prev, teamId]                 // チェック付ける
);
```

## 派生状態（Derived State）

### サーバーサイドでの例
```ruby
class CalendarsController < ApplicationController
  def index
    selected_team_ids = params[:selected_team_ids] || []
    
    # データベースクエリで絞り込み
    all_practices = Practice.all
    @filtered_practices = all_practices.select do |practice|
      selected_team_ids.include?(practice.choir_team_id)
    end
    
    render 'calendar'
  end
end
```

### React での例
```typescript
function App() {
  const [selectedChoirTeamIds, setSelectedChoirTeamIds] = useState<string[]>([]);
  
  // 派生状態：元データ + フィルター条件 → 結果
  const filteredPractices = samplePractices.filter(practice => 
    selectedChoirTeamIds.includes(practice.choirTeamId)
  );
  
  return <Calendar practices={filteredPractices} />;
}
```

### パフォーマンス最適化（useMemo）
```typescript
function App() {
  const [selectedChoirTeamIds, setSelectedChoirTeamIds] = useState<string[]>([]);
  
  // 計算コストが高い場合は useMemo でキャッシュ
  const filteredPractices = useMemo(() => {
    return samplePractices.filter(practice => 
      selectedChoirTeamIds.includes(practice.choirTeamId)
    );
  }, [selectedChoirTeamIds]); // selectedChoirTeamIds が変更時のみ再計算
  
  return <Calendar practices={filteredPractices} />;
}
```

## 状態の同期とタイミング

### 非同期更新の理解
```typescript
function Counter() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    console.log("クリック前:", count);        // 0
    setCount(count + 1);
    console.log("setCount後:", count);        // まだ 0 (非同期更新)
  };
  
  // 状態が更新されたら実行される
  useEffect(() => {
    console.log("count更新:", count);         // 1
  }, [count]);
  
  return <button onClick={handleClick}>{count}</button>;
}
```

### 複数の状態更新の一括処理
```typescript
// React 18以降では自動的にバッチ処理される
const handlePracticeClick = (practice: Practice, choirTeam: ChoirTeam, venue: Venue) => {
  // これらの状態更新は一回の再レンダリングでまとめて処理される
  setSelectedPractice(practice);
  setSelectedChoirTeam(choirTeam);
  setSelectedVenue(venue);
  setModalOpen(true);
};
```

## エラーハンドリングと状態管理

### Loading状態の管理
```typescript
function PracticeLoader() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadPractices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchPractices(); // API呼び出し
      setPractices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;
  return <Calendar practices={practices} />;
}
```

### サーバーサイドでの例
```java
@GetMapping("/practices")
public ResponseEntity<?> getPractices() {
    try {
        List<Practice> practices = practiceService.getAllPractices();
        return ResponseEntity.ok(practices);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", e.getMessage()));
    }
}
```

## 状態管理のスケーリング

### 1. Custom Hooks（再利用可能なロジック）

#### サーバーサイドでのService層
```java
@Service
public class PracticeFilterService {
    public List<Practice> filterByTeams(List<Practice> practices, List<String> teamIds) {
        return practices.stream()
            .filter(p -> teamIds.contains(p.getChoirTeamId()))
            .collect(Collectors.toList());
    }
}
```

#### React でのCustom Hook
```typescript
// usePracticeFilter.ts
function usePracticeFilter(practices: Practice[]) {
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  
  const filteredPractices = useMemo(() => {
    return practices.filter(practice => 
      selectedTeamIds.includes(practice.choirTeamId)
    );
  }, [practices, selectedTeamIds]);
  
  return {
    filteredPractices,
    selectedTeamIds,
    setSelectedTeamIds
  };
}

// 使用側
function App() {
  const { filteredPractices, selectedTeamIds, setSelectedTeamIds } = usePracticeFilter(samplePractices);
  
  return <Calendar practices={filteredPractices} />;
}
```

### 2. Context API（グローバル状態）

#### アプリケーション全体での状態共有
```typescript
// PracticeContext.tsx
const PracticeContext = createContext<{
  practices: Practice[];
  selectedPractice: Practice | null;
  selectPractice: (practice: Practice) => void;
} | null>(null);

function PracticeProvider({ children }: { children: React.ReactNode }) {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  
  const selectPractice = (practice: Practice) => {
    setSelectedPractice(practice);
  };
  
  return (
    <PracticeContext.Provider value={{ practices, selectedPractice, selectPractice }}>
      {children}
    </PracticeContext.Provider>
  );
}
```

これは、Spring の ApplicationContext や Singleton Service に似た概念です。

## 本プロジェクトの状態管理の分析

### 現在の構造
```typescript
function App() {
  // UI制御状態
  const [modalOpen, setModalOpen] = useState(false);
  const [multiPracticeModalOpen, setMultiPracticeModalOpen] = useState(false);
  
  // 選択データ状態  
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const [selectedChoirTeam, setSelectedChoirTeam] = useState<ChoirTeam | null>(null);
  // ...
  
  // フィルター状態
  const [selectedChoirTeamIds, setSelectedChoirTeamIds] = useState<string[]>([]);
  
  // 派生状態
  const filteredPractices = samplePractices.filter(practice => 
    selectedChoirTeamIds.includes(practice.choirTeamId)
  );
}
```

### 改善案（将来的な拡張として）

#### 1. 状態の分類整理
```typescript
// ui-state.ts
interface UIState {
  modals: {
    practice: boolean;
    multiPractice: boolean;
  };
}

// selection-state.ts  
interface SelectionState {
  practice: Practice | null;
  choirTeam: ChoirTeam | null;
  venue: Venue | null;
  songs: Song[];
}

// filter-state.ts
interface FilterState {
  choirTeamIds: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
}
```

#### 2. Reducer パターン（複雑な状態更新）
```typescript
type PracticeAction = 
  | { type: 'SELECT_PRACTICE'; practice: Practice; choirTeam: ChoirTeam; venue: Venue }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_MODAL'; modal: 'practice' | 'multiPractice' };

function practiceReducer(state: AppState, action: PracticeAction): AppState {
  switch (action.type) {
    case 'SELECT_PRACTICE':
      return {
        ...state,
        selectedPractice: action.practice,
        selectedChoirTeam: action.choirTeam,
        selectedVenue: action.venue,
        modals: { ...state.modals, practice: true }
      };
    default:
      return state;
  }
}
```

これは、Command Pattern や Event Sourcing の考え方に似ています。

## デバッグとトラブルシューティング

### 1. 状態の可視化
```typescript
function App() {
  const [selectedChoirTeamIds, setSelectedChoirTeamIds] = useState<string[]>([]);
  
  // 開発環境での状態監視
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Selected teams changed:', selectedChoirTeamIds);
    }
  }, [selectedChoirTeamIds]);
  
  return <div>...</div>;
}
```

### 2. React Developer Tools
ブラウザの拡張機能でコンポーネントの状態をリアルタイム監視

### 3. 状態の履歴追跡
```typescript
function useStateHistory<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const [history, setHistory] = useState<T[]>([initialValue]);
  
  const setValueWithHistory = (newValue: T) => {
    setValue(newValue);
    setHistory(prev => [...prev, newValue]);
  };
  
  return [value, setValueWithHistory, history] as const;
}
```

## まとめ

React の状態管理は、バックエンドでの以下の概念を組み合わせたものです：

| バックエンド概念 | React状態管理 |
|---|---|
| HttpSession | useState (選択データ) |
| RequestParameter | useState (フィルター条件) |
| Cache/Redis | useMemo (派生状態) |
| Database Query | filter/map (データ変換) |
| Service Layer | Custom Hooks |
| ApplicationContext | Context API |
| Event Listener | useEffect |

次は [04-component-patterns.md](./04-component-patterns.md) でコンポーネント設計パターンを学びましょう。