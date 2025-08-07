# React基礎概念：バックエンドエンジニア向け解説

## Reactとは何か？

ReactはUIを構築するためのJavaScriptライブラリです。バックエンド開発者向けに例えると：

- **MVCのViewレイヤー**を担当
- **コンポーネント**という単位でUIを分割（マイクロサービス的な考え方）
- **状態（State）**の変更に応じて自動でUI更新

## コンポーネント：UIのマイクロサービス

### サーバーサイドでの分割
```ruby
# user_service.rb
class UserService
  def self.get_user(id)
    # ビジネスロジック
  end
end

# order_service.rb
class OrderService
  def self.get_orders(user_id)
    # ビジネスロジック
  end
end
```

### React での分割
```typescript
// UserProfile.tsx
function UserProfile({ userId }: { userId: string }) {
  const user = getUser(userId);
  return <div>{user.name}</div>;
}

// OrderList.tsx
function OrderList({ userId }: { userId: string }) {
  const orders = getOrders(userId);
  return <ul>{orders.map(order => <li>{order.title}</li>)}</ul>;
}
```

### 合成（Composition）
```typescript
// App.tsx（マイクロサービスのオーケストレーター的役割）
function App() {
  return (
    <div>
      <UserProfile userId="123" />
      <OrderList userId="123" />
    </div>
  );
}
```

## JSX：テンプレートエンジンの進化版

### 従来のテンプレートエンジン（ERB）
```erb
<!-- calendar.html.erb -->
<% @practices.each do |practice| %>
  <div>
    <span><%= practice.time %></span>
    <span><%= practice.venue %></span>
  </div>
<% end %>
```

### JSX
```typescript
// Calendar.tsx
function Calendar({ practices }: { practices: Practice[] }) {
  return (
    <div>
      {practices.map(practice => (
        <div key={practice.id}>
          <span>{practice.time}</span>
          <span>{practice.venue}</span>
        </div>
      ))}
    </div>
  );
}
```

### JSXの重要な特徴
1. **JavaScript式を埋め込める**: `{practice.time}`
2. **条件分岐**: `{isVisible && <div>表示</div>}`
3. **ループ**: `{items.map(item => <div>{item}</div>)}`

## Props：依存注入（Dependency Injection）

### Rails での依存注入
```ruby
class CalendarService
  # ビジネスロジック
end

class CalendarController < ApplicationController
  def initialize
    @calendar_service = CalendarService.new # ← 依存注入
  end
  
  def calendar
    @practices = @calendar_service.get_practices
    render 'calendar'
  end
end
```

### React での Props
```typescript
// 親コンポーネント（Controller相当）
function App() {
  const practices = getPractices(); // Service呼び出し
  return <Calendar practices={practices} />; // ← Props で依存注入
}

// 子コンポーネント（View相当）
function Calendar({ practices }: { practices: Practice[] }) {
  return <div>{/* practices を使用 */}</div>;
}
```

### Props の型定義（Interface）
```ruby
# Ruby のモジュール（Interface的役割）
module CalendarServiceInterface
  def get_practices
    raise NotImplementedError
  end
end
```

```typescript
// TypeScript のInterface
interface CalendarProps {
  practices: Practice[];
  onPracticeClick: (practice: Practice) => void;
}
```

## State：メモリ内データストア

### サーバーサイドでの状態管理
```ruby
class SessionManager
  def initialize
    @session_data = {}
  end
  
  def set_selected_practice(practice)
    @session_data[:selected_practice] = practice
  end
end
```

### React での状態管理
```typescript
function App() {
  // useState = インメモリのデータストア
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  
  const handlePracticeClick = (practice: Practice) => {
    setSelectedPractice(practice); // 状態更新
  };
  
  return (
    <div>
      <Calendar onPracticeClick={handlePracticeClick} />
      <Modal practice={selectedPractice} />
    </div>
  );
}
```

### 状態の種類

#### 1. ローカル状態（useState）
```typescript
function Counter() {
  const [count, setCount] = useState(0); // この component内でのみ使用
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

#### 2. 共有状態（Props Drilling）
```typescript
function App() {
  const [globalData, setGlobalData] = useState(initialData);
  
  return (
    <div>
      <ComponentA data={globalData} />
      <ComponentB data={globalData} onUpdate={setGlobalData} />
    </div>
  );
}
```

## イベント処理：コントローラーのアクション

### サーバーサイド（Rails）
```ruby
class PracticesController < ApplicationController
  def select
    session_manager.set_selected_practice(practice_params)
    render json: { status: 'success' }
  end
  
  private
  
  def practice_params
    params.require(:practice).permit(:id, :title, :date)
  end
end
```

### React
```typescript
function Calendar({ onPracticeClick }: CalendarProps) {
  return (
    <div>
      {practices.map(practice => (
        <div 
          key={practice.id}
          onClick={() => onPracticeClick(practice)} // ← イベント発火
        >
          {practice.title}
        </div>
      ))}
    </div>
  );
}
```

### 本プロジェクトでのイベントフロー
```typescript
// src/app/page.tsx
const handlePracticeClick = (practice: Practice, choirTeam: ChoirTeam, venue: Venue) => {
  // 1. 関連データを取得（JOIN相当）
  const songs = sampleSongs.filter(song => practice.songIds.includes(song.id));
  
  // 2. 状態を更新（Session更新相当）
  setSelectedPractice(practice);
  setSelectedChoirTeam(choirTeam);
  setSelectedVenue(venue);
  setSelectedSongs(songs);
  
  // 3. モーダル表示（レスポンス送信相当）
  setModalOpen(true);
};
```

## useEffect：ライフサイクルフック

### サーバーサイドでの初期化
```ruby
class ApplicationService
  def initialize
    Rails.logger.info("Service initialized")
    load_initial_data
  end
  
  def finalize
    Rails.logger.info("Service shutting down") 
    cleanup_resources
  end
end
```

### React での useEffect
```typescript
function Calendar() {
  useEffect(() => {
    console.log("Component mounted"); // @PostConstruct相当
    loadInitialData();
    
    return () => {
      console.log("Component unmounting"); // @PreDestroy相当
      cleanupResources();
    };
  }, []); // 空配列 = 初回マウント時のみ
  
  return <div>Calendar</div>;
}
```

### 依存関係での実行制御
```typescript
function FilteredCalendar() {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [filteredPractices, setFilteredPractices] = useState<Practice[]>([]);
  
  useEffect(() => {
    // selectedTeams が変更されたら実行（データベースのトリガー的な動作）
    const filtered = allPractices.filter(practice => 
      selectedTeams.includes(practice.choirTeamId)
    );
    setFilteredPractices(filtered);
  }, [selectedTeams]); // selectedTeams を監視
  
  return <Calendar practices={filteredPractices} />;
}
```

## 本プロジェクトの具体例で理解する

### 1. コンポーネント階層
```
App
├── header (ヘッダー情報)
├── Calendar (props: practices, choirTeams, venues)
│   └── 各日付セル (props: day, practices for that day)
├── PracticeModal (props: practice, choirTeam, venue, songs)
└── MultiPracticeModal (props: practices, date)
```

### 2. データフロー
```typescript
// 1. データ取得（Repository相当）  
import { samplePractices, sampleChoirTeams } from '@/data/sampleData';

// 2. 状態管理（Service相当）
const [selectedChoirTeamIds, setSelectedChoirTeamIds] = useState<string[]>(
  sampleChoirTeams.map(team => team.id)
);

// 3. データ変換（DTO変換相当）
const filteredPractices = samplePractices.filter(practice => 
  selectedChoirTeamIds.includes(practice.choirTeamId)
);

// 4. View渡し（Controller → View相当）
<Calendar practices={filteredPractices} />
```

### 3. イベント処理の流れ
```
ユーザークリック
    ↓
Calendar コンポーネント
    ↓ 
onPracticeClick コールバック実行
    ↓
App コンポーネントの handlePracticeClick
    ↓
状態更新（setSelectedPractice）
    ↓
React の再レンダリング
    ↓
Modal表示
```

## 理解のポイント

### 1. 宣言的プログラミング
**命令的（Imperative）**:
```javascript
// DOM操作（jQuery的）
document.getElementById('counter').innerHTML = count.toString();
```

**宣言的（Declarative）**:
```typescript
// React
return <div>{count}</div>; // 「countの値を表示する」と宣言
```

### 2. 不変性（Immutability）
```typescript
// ❌ 悪い例：既存の配列を変更
practices.push(newPractice);

// ✅ 良い例：新しい配列を作成
setPractices([...practices, newPractice]);
```

これは、関数型プログラミングの考え方に基づいています。

### 3. 単一責任原則
```typescript
// Calendar コンポーネント：カレンダー表示のみに集中
function Calendar({ practices }: CalendarProps) {
  // カレンダーの表示ロジックのみ
}

// Modal コンポーネント：モーダル表示のみに集中  
function PracticeModal({ practice }: ModalProps) {
  // モーダルの表示ロジックのみ
}
```

## デバッグとトラブルシューティング

### 1. React Developer Tools
ブラウザの開発者ツールでコンポーネント階層と状態を確認

### 2. console.log でのデバッグ
```typescript
function Calendar({ practices }: CalendarProps) {
  console.log('Calendar rendered with practices:', practices);
  
  useEffect(() => {
    console.log('Calendar mounted');
  }, []);
  
  return <div>...</div>;
}
```

### 3. 一般的なエラーと対処法

#### Key prop missing
```typescript
// ❌ エラーが出る
{practices.map(practice => <div>{practice.title}</div>)}

// ✅ 正しい
{practices.map(practice => <div key={practice.id}>{practice.title}</div>)}
```

#### State 更新のタイミング
```typescript
const [count, setCount] = useState(0);

const handleClick = () => {
  setCount(count + 1);
  console.log(count); // ← まだ古い値（非同期更新のため）
};
```

## まとめ

React は、従来のサーバーサイド開発の概念をクライアントサイドに適用したライブラリです：

| サーバーサイド | React |
|---|---|
| Service クラス | Custom Hook/Utility |
| Controller メソッド | Event Handler |
| Template | JSX |
| Session/Request Scope | useState |
| Dependency Injection | Props |
| @PostConstruct | useEffect(() => {}, []) |

次は [03-state-management.md](./03-state-management.md) で、より複雑な状態管理について学びましょう。