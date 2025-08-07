# 合唱団練習日管理システム 開発ログ

## 概要
Next.jsを使用した合唱団の練習日管理システムの開発ログです。複数の合唱団の練習予定を一つのカレンダーで管理できるWebアプリケーションを作成しました。

## プロジェクト構成

```
chor_team_management/
├── src/
│   ├── app/
│   │   ├── page.tsx          # メインページ
│   │   ├── layout.tsx        # レイアウト
│   │   └── globals.css       # グローバルCSS
│   ├── components/
│   │   ├── Calendar.tsx      # カレンダーコンポーネント
│   │   ├── PracticeModal.tsx # 練習詳細モーダル
│   │   └── MultiPracticeModal.tsx # 複数練習表示モーダル
│   ├── types/
│   │   └── index.ts          # TypeScript型定義
│   └── data/
│       └── sampleData.ts     # サンプルデータ
└── doc/                      # ドキュメント
```

## 開発ステップ

### 1. プロジェクト初期設定

#### 実施内容
- Next.js 15.4.6でプロジェクト作成
- TypeScript、Tailwind CSS、ESLintを設定

#### 実行コマンド
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

#### 作成されたファイル
- `package.json`: プロジェクト依存関係
- `tsconfig.json`: TypeScript設定
- `tailwind.config.ts`: Tailwind CSS設定
- `next.config.ts`: Next.js設定

### 2. プロジェクト構造の作成

#### 実施内容
- 基本的なフォルダ構造を作成

#### 実行コマンド
```bash
mkdir -p src/components src/types src/data src/lib
```

#### 作成されたディレクトリ
- `src/components/`: Reactコンポーネント
- `src/types/`: TypeScript型定義
- `src/data/`: サンプルデータ
- `src/lib/`: ユーティリティ関数（未使用）

### 3. データ型定義の作成

#### ファイル: `src/types/index.ts`

#### 実施内容
システムで使用する全てのデータ型を定義

```typescript
// 主要な型定義
export interface ChoirTeam {
  id: string;
  name: string;
  abbreviation: string; // 全角4文字以内での略称
  color: string; // カレンダー表示用の色
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
```

#### 設計のポイント
- 略称フィールドで表示領域を考慮
- 色情報を含めて視覚的識別を実現
- 関連データはIDで参照する正規化設計

### 4. カレンダーコンポーネントの実装

#### ファイル: `src/components/Calendar.tsx`

#### 実施内容
月間カレンダー表示とイベント表示機能を実装

#### 主要機能
1. **月間カレンダー表示**
   ```typescript
   const getCurrentMonthDays = () => {
     const year = currentDate.getFullYear();
     const month = currentDate.getMonth();
     // カレンダーの日付配列を生成
   };
   ```

2. **練習予定の表示**
   - 1件の場合: 時間・場所・合唱団名を表示
   - 複数件の場合: "練習X件"として集約表示

3. **月送り機能**
   ```typescript
   const navigateMonth = (direction: 'prev' | 'next') => {
     setCurrentDate(prev => {
       const newDate = new Date(prev);
       newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
       return newDate;
     });
   };
   ```

#### 設計のポイント
- レスポンシブ対応でグリッドレイアウト使用
- 日付計算で月の境界を正確に処理
- クリックイベントで詳細表示に連携

### 5. 練習詳細モーダルの実装

#### ファイル: `src/components/PracticeModal.tsx`

#### 実施内容
練習の詳細情報を表示するモーダルコンポーネント

#### 表示内容
- 日時（フォーマット済み）
- 合唱団名（カラーラベル付き）
- 練習場所
- 練習曲リスト
- 備考

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

### 6. 複数練習表示モーダルの実装

#### ファイル: `src/components/MultiPracticeModal.tsx`

#### 実施内容
同日に複数の練習がある場合の一覧表示機能

#### 機能
- 練習一覧をカード形式で表示
- 各練習をクリックで詳細モーダルに遷移
- 合唱団の色による視覚的識別

#### インタラクション設計
```typescript
<div
  onClick={() => {
    onPracticeSelect(practice, choirTeam, venue);
    onClose();
  }}
  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
>
```

### 7. サンプルデータの作成

#### ファイル: `src/data/sampleData.ts`

#### 実施内容
動作確認用の実データを作成

#### データ内容
- **合唱団**: 3団体（東京混声、大阪女声、横浜男声）
- **練習場所**: 4箇所（各種ホール・会館）
- **楽曲**: 6曲（クラシック・ポップス・民謡）
- **練習予定**: 8件（重複日を含む）

#### 重複データの設計
```typescript
// 8月8日に複数練習を設定
{
  id: '2',
  date: '2025-08-08',
  choirTeamId: '2', // 大阪女声
},
{
  id: '3', 
  date: '2025-08-08',
  choirTeamId: '3', // 横浜男声
}
```

### 8. メインページの統合

#### ファイル: `src/app/page.tsx`

#### 実施内容
全コンポーネントを統合したメインアプリケーション

#### 状態管理
```typescript
const [modalOpen, setModalOpen] = useState(false);
const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
const [selectedChoirTeam, setSelectedChoirTeam] = useState<ChoirTeam | null>(null);
// その他のモーダル制御状態
```

#### イベントハンドリング
1. **単一練習クリック**: 詳細モーダル表示
2. **複数練習クリック**: 一覧モーダル表示
3. **一覧からの選択**: 詳細モーダルに遷移

### 9. 合唱団フィルター機能の実装

#### 実施内容
画面下部にチェックボックス付きフィルター機能を追加

#### 新しい状態管理
```typescript
const [selectedChoirTeamIds, setSelectedChoirTeamIds] = useState<string[]>(
  sampleChoirTeams.map(team => team.id) // 初期状態で全選択
);
```

#### フィルタリング処理
```typescript
const filteredPractices = samplePractices.filter(practice => 
  selectedChoirTeamIds.includes(practice.choirTeamId)
);
```

#### UI実装
- グリッドレイアウトでチェックボックス配置
- 合唱団カラーの視覚的表示
- ホバーエフェクトによる使いやすさ向上

## 技術的な工夫点

### 1. TypeScript型安全性
- 全てのデータに厳密な型定義
- コンポーネント間のpropsも型チェック
- 実行時エラーの防止

### 2. 状態管理の設計
- 各モーダルの開閉状態を独立管理
- 選択されたデータの一元管理
- フィルター状態の永続化

### 3. ユーザビリティ
- レスポンシブデザイン対応
- 視覚的フィードバック（ホバー効果等）
- 直感的な操作フロー

### 4. パフォーマンス
- 必要な時のみコンポーネント再描画
- フィルタリングの効率的な実装
- 軽量なライブラリ選択

## 動作確認

### 開発サーバー起動
```bash
npm run dev
```

### 確認項目
- [x] カレンダー表示
- [x] 練習予定表示（単一・複数）
- [x] モーダル表示・操作
- [x] 月送り機能
- [x] 合唱団フィルター
- [x] レスポンシブ対応

## 今後の拡張可能性

1. **データ永続化**: ローカルストレージやDB連携
2. **練習追加・編集**: CRUD操作の実装
3. **通知機能**: 練習前のリマインダー
4. **エクスポート**: PDF・iCal形式での出力
5. **ユーザー管理**: 合唱団メンバーごとのアクセス制御

## まとめ

Next.js + TypeScript + Tailwind CSSの組み合わせで、使いやすい合唱団練習日管理システムを構築しました。コンポーネント分割による保守性と、型安全性による品質を両立し、実用的なWebアプリケーションとして完成させることができました。