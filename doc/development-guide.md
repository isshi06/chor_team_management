# 合唱団練習日管理システム 開発ガイド

Next.js初心者向けに、機能追加・修正時に考慮すべきポイントとファイル構成を説明します。

## 1. システム全体の理解

### ファイル構成と役割
```
src/
├── types/index.ts              # 型定義（全体の基盤）
├── data/
│   ├── sampleData.ts          # サンプルデータ
│   └── actualData.ts          # 本番データ（.gitignore対象）
├── components/                # UI部品
│   ├── Calendar.tsx           # カレンダー表示（メイン画面）
│   ├── PracticeModal.tsx      # 詳細表示モーダル
│   └── MultiPracticeModal.tsx # 複数練習一覧モーダル
└── app/page.tsx              # ルートページ（状態管理）
```

### データフロー
```
型定義 → データ → 状態管理 → UI表示 → ユーザー操作
```

## 2. 機能追加時の実装手順

### 2-1. 新しいデータ型を追加する場合

#### 手順
1. **`src/types/index.ts`** - 型定義を追加
2. **`src/data/sampleData.ts`** - サンプルデータを追加
3. **使用する各コンポーネント** - import文とpropsを更新

#### 例：「指導者」情報を追加
```typescript
// 1. types/index.ts
export interface Instructor {
  id: string;
  name: string;
  speciality: string; // 専門分野
}

export interface Practice {
  // 既存のフィールド...
  instructorId: string; // 追加
}

// 2. data/sampleData.ts
export const sampleInstructors: Instructor[] = [
  {
    id: '1',
    name: '田中先生',
    speciality: 'ピアノ伴奏'
  }
];

// 3. 各コンポーネントで必要に応じてimportとpropsを追加
```

### 2-2. 新しいコンポーネントを追加する場合

#### 考慮すべきファイル
1. **`src/components/`** - 新コンポーネント作成
2. **`src/app/page.tsx`** - import + 状態管理 + JSX追加
3. **`src/types/index.ts`** - 必要に応じて型追加

#### 例：「楽譜管理」コンポーネントを追加
```typescript
// 1. components/SheetMusicModal.tsx 作成
interface SheetMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
}

// 2. app/page.tsx に追加
import SheetMusicModal from '@/components/SheetMusicModal';

export default function Home() {
  const [sheetMusicModalOpen, setSheetMusicModalOpen] = useState(false);
  // ... 状態管理ロジック

  return (
    <div>
      {/* 既存のJSX */}
      <SheetMusicModal 
        isOpen={sheetMusicModalOpen}
        onClose={() => setSheetMusicModalOpen(false)}
        songs={sampleSongs}
      />
    </div>
  );
}
```

### 2-3. カレンダー表示内容を変更する場合

#### 修正対象ファイル
1. **`src/components/Calendar.tsx`** - 表示ロジック
2. **`src/types/index.ts`** - 必要に応じて型追加
3. **`src/data/sampleData.ts`** - テスト用データ追加

#### 例：「参加人数」を表示に追加
```typescript
// 1. types/index.ts - Practice型に追加
export interface Practice {
  // 既存フィールド...
  participantCount?: number; // 参加人数
}

// 2. components/Calendar.tsx - 表示ロジックに追加
<div className="text-white text-xs">
  {choirTeam.abbreviation}
  {practice.participantCount && (
    <span className="ml-1">({practice.participantCount}人)</span>
  )}
</div>

// 3. data/sampleData.ts - サンプルデータに追加
{
  id: '1',
  // 既存フィールド...
  participantCount: 25
}
```

## 3. デバッグ方法

### 3-1. 画面に何も表示されない場合

#### チェック手順
```typescript
// 1. データが存在するかコンソールで確認
console.log('practices:', practices);
console.log('choirTeams:', choirTeams);

// 2. フィルタリング結果を確認
console.log('filteredPractices:', filteredPractices);

// 3. 日付フォーマットを確認
console.log('dateString:', dateString); // YYYY-MM-DD形式か？
```

#### よくある原因と解決方法
```typescript
// 原因1: データの参照関係が間違っている
const practice = {
  choirTeamId: 'team-1',  // choirTeamsに存在するか？
  venueId: 'venue-1'      // venuesに存在するか？
};

// 原因2: 日付フォーマットが間違っている
const wrongDate = '08/07/2025';  // ❌
const correctDate = '2025-08-07'; // ✅

// 原因3: 空の配列
const emptyPractices = []; // データが空
```

### 3-2. TypeScriptエラーが出る場合

#### よくあるエラーパターン
```typescript
// エラー1: Property does not exist
// 原因: 型定義に存在しないプロパティにアクセス
practice.newProperty // ❌ types/index.tsに定義されていない

// 解決: 型定義を更新
interface Practice {
  // 既存プロパティ...
  newProperty?: string; // 追加
}

// エラー2: Type 'string' is not assignable to type 'number'
// 原因: 型が一致しない
const count: number = practice.participantCount; // participantCountがstring型の場合

// 解決: 型変換または型定義修正
const count: number = parseInt(practice.participantCount);
// または型定義を修正
participantCount: number;
```

### 3-3. モーダルが表示されない場合

#### チェックポイント
```typescript
// 1. 状態確認
console.log('modalOpen:', modalOpen);

// 2. 必須データ確認
console.log('selectedPractice:', selectedPractice);
console.log('selectedChoirTeam:', selectedChoirTeam);

// 3. イベントハンドラー確認
const handlePracticeClick = (practice, choirTeam, venue) => {
  console.log('クリックされました:', practice);
  // 状態更新処理...
};
```

### 3-4. スタイルが適用されない場合

#### Tailwind CSS関連
```typescript
// 動的な色の適用
style={{ backgroundColor: choirTeam.color }} // ✅

// Tailwindクラスでの動的色（動作しない場合が多い）
className={`bg-[${choirTeam.color}]`} // ❌ 推奨しない
```

## 4. 実装時のベストプラクティス

### 4-1. ファイル修正順序

```
1. types/index.ts     (型定義)
    ↓
2. data/sampleData.ts (テストデータ)
    ↓
3. components/        (UI実装)
    ↓
4. app/page.tsx       (統合)
    ↓
5. テスト・デバッグ
```

### 4-2. 状態管理の考え方

```typescript
// app/page.tsx で一元管理
const [modalOpen, setModalOpen] = useState(false);
const [selectedData, setSelectedData] = useState(null);

// 子コンポーネントにはpropsで渡す
<Modal 
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  data={selectedData}
/>
```

### 4-3. エラー防止のためのチェック

```typescript
// null/undefined チェック
if (!choirTeam || !venue) return null;

// 配列の存在チェック
if (practices.length === 0) return <div>練習データがありません</div>;

// オプショナルチェーニング
{practice.notes && <p>{practice.notes}</p>}
{performance?.title && <h3>{performance.title}</h3>}
```

## 5. よくある実装パターン

### 5-1. 新しいフィルター機能追加

```typescript
// 1. 状態追加
const [newFilter, setNewFilter] = useState('all');

// 2. フィルタリングロジック
const filteredData = data.filter(item => {
  if (newFilter === 'all') return true;
  return item.category === newFilter;
});

// 3. UI追加
<select onChange={(e) => setNewFilter(e.target.value)}>
  <option value="all">すべて</option>
  <option value="morning">朝練習</option>
</select>
```

### 5-2. 新しいモーダル追加

```typescript
// 1. 状態管理
const [newModalOpen, setNewModalOpen] = useState(false);
const [newModalData, setNewModalData] = useState(null);

// 2. ハンドラー
const handleOpenNewModal = (data) => {
  setNewModalData(data);
  setNewModalOpen(true);
};

// 3. コンポーネント
<NewModal 
  isOpen={newModalOpen}
  onClose={() => setNewModalOpen(false)}
  data={newModalData}
/>
```

## 6. トラブルシューティングチェックリスト

### 機能が動かない時の確認項目

- [ ] TypeScriptエラーがないか確認
- [ ] コンソールエラーがないか確認
- [ ] データが正しく取得できているか確認（console.log）
- [ ] 型定義が最新か確認
- [ ] importパスが正しいか確認
- [ ] 状態が正しく更新されているか確認
- [ ] イベントハンドラーが正しく設定されているか確認

この手順に従って実装することで、エラーを最小限に抑えて新機能を追加できます。