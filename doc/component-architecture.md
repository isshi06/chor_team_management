# コンポーネント設計ドキュメント

## アーキテクチャ概要

本システムは、React/Next.jsのコンポーネント指向アーキテクチャを採用し、各機能を独立したコンポーネントとして実装しています。

## コンポーネント構成図

```
App (page.tsx)
├── Calendar
│   ├── MonthNavigation
│   ├── CalendarGrid
│   └── PracticeEvents
├── PracticeModal
└── MultiPracticeModal
    └── PracticeList
```

## 各コンポーネント詳細

### 1. App (page.tsx)
**役割**: アプリケーションの最上位コンポーネント、状態管理の中心

#### 管理する状態
```typescript
// モーダル制御
const [modalOpen, setModalOpen] = useState(false);
const [multiPracticeModalOpen, setMultiPracticeModalOpen] = useState(false);

// 選択されたデータ
const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
const [selectedChoirTeam, setSelectedChoirTeam] = useState<ChoirTeam | null>(null);
const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);

// フィルター機能
const [selectedChoirTeamIds, setSelectedChoirTeamIds] = useState<string[]>(
  sampleChoirTeams.map(team => team.id)
);
```

#### イベントハンドラー
1. `handlePracticeClick`: 単一練習クリック時の処理
2. `handleMultiplePracticesClick`: 複数練習クリック時の処理
3. `handleChoirTeamToggle`: 合唱団フィルターの切り替え
4. モーダル開閉制御

### 2. Calendar コンポーネント
**役割**: 月間カレンダーの表示と練習予定の可視化

#### Props インターface
```typescript
interface CalendarProps {
  practices: Practice[];
  choirTeams: ChoirTeam[];
  venues: Venue[];
  onPracticeClick: (practice: Practice, choirTeam: ChoirTeam, venue: Venue) => void;
  onMultiplePracticesClick: (date: string, practices: Practice[]) => void;
}
```

#### 主要機能
1. **月間カレンダー生成**
   ```typescript
   const getCurrentMonthDays = () => {
     // 月の最初と最後の日を計算
     // 週の開始日調整
     // 日付配列の生成
   };
   ```

2. **練習予定の集約表示**
   ```typescript
   const getPracticesForDate = (day: number) => {
     const dateString = date.toISOString().split('T')[0];
     return practices.filter(practice => practice.date === dateString);
   };
   ```

3. **条件分岐表示ロジック**
   - 1件の練習: 詳細情報表示
   - 複数件の練習: 「練習X件」として集約
   - 練習なし: 空白

#### レスポンシブデザイン
```css
.grid.grid-cols-7 {
  /* 7列グリッドレイアウト */
  gap: 1px;
}

.min-h-24 {
  /* 各セルの最小高さ */
  min-height: 6rem;
}
```

### 3. PracticeModal コンポーネント
**役割**: 単一練習の詳細情報表示

#### Props インターface
```typescript
interface PracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  practice: Practice | null;
  choirTeam: ChoirTeam | null;
  venue: Venue | null;
  songs: Song[];
}
```

#### 表示内容の構成
1. **ヘッダー**: タイトルと閉じるボタン
2. **日時情報**: フォーマット済み日付・時間
3. **合唱団情報**: 名前とカラーラベル
4. **会場情報**: 名前と住所
5. **楽曲リスト**: 作曲者・作詞者情報付き
6. **備考**: 追加情報

#### 日付フォーマット処理
```typescript
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });
};
```

### 4. MultiPracticeModal コンポーネント
**役割**: 同日複数練習の一覧表示

#### Props インターface
```typescript
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
```

#### インタラクション設計
1. **練習カード**: クリック可能なカード形式
2. **選択フィードバック**: ホバー効果
3. **データ表示**: 重要情報を簡潔に表示
4. **遷移処理**: 選択時に詳細モーダルへ切り替え

### 5. ChoirFilter コンポーネント（page.tsx内に実装）
**役割**: 合唱団表示フィルター機能

#### 実装方式
```typescript
// フィルター状態管理
const [selectedChoirTeamIds, setSelectedChoirTeamIds] = useState<string[]>(
  sampleChoirTeams.map(team => team.id)
);

// フィルタリング処理
const filteredPractices = samplePractices.filter(practice => 
  selectedChoirTeamIds.includes(practice.choirTeamId)
);

// トグル処理
const handleChoirTeamToggle = (teamId: string) => {
  setSelectedChoirTeamIds(prev => 
    prev.includes(teamId) 
      ? prev.filter(id => id !== teamId)
      : [...prev, teamId]
  );
};
```

## データフロー設計

### 1. トップダウンのデータ配信
```
sampleData → App → Calendar → 表示
           → App → Modal → 表示
```

### 2. ボトムアップのイベント伝播
```
Calendar → onPracticeClick → App → 状態更新 → Modal表示
Filter → onChange → App → フィルター更新 → Calendar再描画
```

### 3. 状態管理パターン
- **単一データソース**: Appコンポーネントで一元管理
- **プロップドリリング**: 必要なコンポーネントにのみデータ配信
- **コールバック**: 子から親への通信

## 型安全性の担保

### 1. 厳密な型定義
```typescript
interface Practice {
  id: string;
  date: string; // YYYY-MM-DD形式を強制
  startTime: string; // HH:MM形式を強制
  endTime: string;
  choirTeamId: string; // 外部キー参照
  venueId: string;
  songIds: string[];
  notes?: string; // オプショナル
}
```

### 2. Props型チェック
```typescript
interface CalendarProps {
  practices: Practice[];
  choirTeams: ChoirTeam[];
  venues: Venue[];
  onPracticeClick: (practice: Practice, choirTeam: ChoirTeam, venue: Venue) => void;
  onMultiplePracticesClick: (date: string, practices: Practice[]) => void;
}
```

### 3. 型ガード実装
```typescript
if (!choirTeam || !venue) return null; // 型安全性の確保
```

## パフォーマンス最適化

### 1. 条件付きレンダリング
```typescript
{isOpen && (
  <div className="modal">
    {/* モーダル内容 */}
  </div>
)}
```

### 2. 効率的なフィルタリング
```typescript
// メモ化は未実装だが、将来的にuseMemoで最適化可能
const filteredPractices = samplePractices.filter(practice => 
  selectedChoirTeamIds.includes(practice.choirTeamId)
);
```

### 3. イベントハンドラーの最適化
- インラインアロー関数を最小限に抑制
- useCallbackによる最適化の余地あり

## 拡張性の考慮

### 1. コンポーネント分割
各機能を独立したコンポーネントとして実装し、変更の影響範囲を限定

### 2. Props設計
必要最小限のデータのみを受け渡し、コンポーネント間の結合度を低下

### 3. 型定義の分離
`src/types/index.ts`で型定義を集約し、変更時の一元管理を実現

### 4. データアクセス層の分離
`src/data/sampleData.ts`でデータを分離し、将来的なAPI連携に対応

## テスト戦略

### 1. 単体テスト対象
- 各コンポーネントの描画
- イベントハンドラーの動作
- データフィルタリング処理

### 2. 統合テスト対象  
- コンポーネント間の連携
- 状態管理の整合性
- ユーザーインタラクション

### 3. E2Eテスト対象
- 全体のワークフロー
- ブラウザ固有の動作
- レスポンシブ対応

## まとめ

本システムは、React/Next.jsのベストプラクティスに従い、保守性・拡張性・パフォーマンスを考慮した設計となっています。各コンポーネントの役割を明確に分離し、型安全性を担保することで、品質の高いWebアプリケーションを実現しました。