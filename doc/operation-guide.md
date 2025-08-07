# 合唱団練習日管理システム 実装手順ガイド

Next.js初心者向けに、実際のデータを入力して運用を開始するまでの手順を説明します。

## 1. 概要理解

### システムの構成
```
src/
├── types/index.ts          # データ型の定義
├── data/
│   ├── sampleData.ts      # サンプルデータ（開発・テスト用）
│   └── actualData.ts      # 実際のデータ（本番用、gitignoreされる）
├── components/            # 画面部品
│   ├── Calendar.tsx       # カレンダー表示
│   ├── PracticeModal.tsx  # 練習・本番詳細モーダル
│   └── MultiPracticeModal.tsx # 複数練習一覧モーダル
└── app/page.tsx          # メインページ
```

### データの流れ
1. **データ定義** → 2. **データ入力** → 3. **画面表示** → 4. **ユーザー操作**

## 2. 実装の考え方と手順

### Step 1: データ構造の理解

まず、どのようなデータが必要かを理解しましょう。

#### 基本的なデータ型（src/types/index.ts）
```typescript
// 合唱団情報
ChoirTeam: {
  id: string,           // 一意識別子
  name: string,         // 正式名称
  abbreviation: string, // 4文字以内の略称
  color: string         // カレンダー表示色
}

// 会場情報
Venue: {
  id: string,           // 一意識別子
  name: string,         // 会場名
  abbreviation: string, // 4文字以内の略称
  address?: string      // 住所（任意）
}

// 楽曲情報
Song: {
  id: string,      // 一意識別子
  title: string,   // 楽曲名
  composer?: string, // 作曲者（任意）
  lyricist?: string  // 作詞者（任意）
}

// 練習情報
Practice: {
  id: string,         // 一意識別子
  date: string,       // 日付（YYYY-MM-DD）
  startTime: string,  // 開始時間（HH:MM）
  endTime: string,    // 終了時間（HH:MM）
  choirTeamId: string, // 合唱団ID
  venueId: string,    // 会場ID
  songIds: string[],  // 楽曲IDの配列
  notes?: string      // 備考（任意）
}

// 本番情報（練習とほぼ同じ + title）
Performance: {
  // 練習と同じフィールド + 
  title: string       // 本番タイトル
}
```

### Step 2: 実際のデータ入力

#### 2-1. 基礎データの準備
実装時は以下の順序でデータを入力します：

1. **合唱団データ** - 最も重要な基礎データ
2. **会場データ** - 練習・本番の場所
3. **楽曲データ** - 練習・本番で使用する楽曲
4. **練習データ** - 日々の練習スケジュール
5. **本番データ** - コンサートや発表会

#### 2-2. データ入力の考慮点

**IDの管理**
```typescript
// 悪い例：重複しやすい
{ id: '1', name: '東京合唱団' }
{ id: '1', name: '大阪合唱団' } // 重複！

// 良い例：意味のある一意なID
{ id: 'tokyo-choir', name: '東京合唱団' }
{ id: 'osaka-choir', name: '大阪合唱団' }
```

**略称の考え方**
```typescript
// カレンダーの小さな枠に表示されるため、4文字以内で分かりやすく
{ name: '東京混声合唱団', abbreviation: '東京混声' } // ✓
{ name: '大阪女声合唱団', abbreviation: '大阪女声' } // ✓
{ name: '横浜男声合唱団', abbreviation: '横浜男' }   // ✓
```

**色の選び方**
```typescript
// 見分けやすい色を選ぶ
{ name: '合唱団A', color: '#3B82F6' }, // 青
{ name: '合唱団B', color: '#EF4444' }, // 赤
{ name: '合唱団C', color: '#10B981' }, // 緑
{ name: '合唱団D', color: '#F59E0B' }, // 黄
{ name: '合唱団E', color: '#8B5CF6' }, // 紫
```

### Step 3: データファイルの作成と管理

#### 3-1. actualData.tsファイルの編集

```bash
# ファイルを開く
code src/data/actualData.ts
```

#### 3-2. 段階的なデータ入力

```typescript
// まず1つの合唱団から始める
export const actualChoirTeams: ChoirTeam[] = [
  {
    id: 'main-choir',
    name: 'メイン合唱団',
    abbreviation: 'メイン',
    color: '#3B82F6'
  }
];

// 主要な会場を1-2箇所
export const actualVenues: Venue[] = [
  {
    id: 'main-hall',
    name: 'メインホール',
    abbreviation: 'メイン',
    address: '東京都渋谷区...'
  }
];

// よく歌う楽曲を数曲
export const actualSongs: Song[] = [
  {
    id: 'song-1',
    title: 'よく歌う楽曲1',
    composer: '作曲者名'
  }
];
```

### Step 4: アプリケーションでの利用

#### 4-1. データの切り替え

開発・テスト時：
```typescript
// src/app/page.tsx
import { sampleChoirTeams, sampleVenues, sampleSongs, samplePractices, samplePerformances } from '@/data/sampleData';
```

本番運用時：
```typescript
// src/app/page.tsx
import { actualChoirTeams, actualVenues, actualSongs, actualPractices, actualPerformances } from '@/data/actualData';

// 変数名を変更
const choirTeams = actualChoirTeams;
const venues = actualVenues;
const songs = actualSongs;
const practices = actualPractices;  
const performances = actualPerformances;
```

#### 4-2. データの一貫性チェック

実装時に確認すべき点：

```typescript
// 1. 参照整合性の確認
const practice = {
  choirTeamId: 'main-choir', // actualChoirTeamsに存在するか？
  venueId: 'main-hall',      // actualVenuesに存在するか？
  songIds: ['song-1']        // actualSongsに存在するか？
};

// 2. 日付フォーマットの確認
const validDate = '2025-08-07';    // ✓ YYYY-MM-DD
const invalidDate = '08/07/2025';  // ✗ 

// 3. 時間フォーマットの確認
const validTime = '19:00';   // ✓ HH:MM
const invalidTime = '7:00';  // ✗ 0埋めなし
```

## 3. 実装時のトラブルシューティング

### よくあるエラーと解決方法

#### エラー1: "Cannot find module"
```bash
Error: Cannot find module '@/data/actualData'
```

**原因**: ファイルが存在しないか、パスが間違っている

**解決方法**:
```bash
# ファイルの存在確認
ls src/data/actualData.ts

# ファイルが存在しない場合は作成
touch src/data/actualData.ts
```

#### エラー2: 画面に何も表示されない
**原因**: データが空の配列

**解決方法**:
```typescript
// 最低限のデータを入力
export const actualChoirTeams: ChoirTeam[] = [
  // 少なくとも1つは入力する
  { id: '1', name: 'テスト', abbreviation: 'テスト', color: '#3B82F6' }
];
```

#### エラー3: TypeScriptエラー
```bash
Type 'string' is not assignable to type 'ChoirTeam'
```

**原因**: データ型が間違っている

**解決方法**:
```typescript
// 悪い例
const practice = {
  choirTeamId: choirTeams[0] // オブジェクトを直接代入
};

// 良い例  
const practice = {
  choirTeamId: choirTeams[0].id // IDのみを代入
};
```

## 4. 段階的な運用開始

### Phase 1: 基本データの入力
- [ ] 主要な合唱団1-2団体
- [ ] 主要な会場1-2箇所
- [ ] よく歌う楽曲5-10曲

### Phase 2: 過去データの入力
- [ ] 直近1ヶ月の練習データ
- [ ] 確定している本番データ

### Phase 3: 継続的な更新
- [ ] 週次での練習データ追加
- [ ] 月次での本番データ追加
- [ ] 新しい楽曲・会場の追加

## 5. 保守・運用のポイント

### データバックアップ
```bash
# 定期的にactualData.tsをバックアップ
cp src/data/actualData.ts backups/actualData_$(date +%Y%m%d).ts
```

### データの整理
- 古い練習データは定期的にアーカイブ
- 使わなくなった楽曲データの整理
- IDの命名規則の統一

### チーム開発時の注意
- actualData.tsは.gitignoreされているため、チーム間でのデータ共有方法を決める
- 開発時はsampleDataを使用し、本番時にactualDataに切り替える

この手順に従って実装することで、安全かつ効率的に合唱団練習日管理システムを運用開始できます。