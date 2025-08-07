# 機能実装詳細ドキュメント

## 実装した機能一覧

1. [カレンダー表示機能](#1-カレンダー表示機能)
2. [練習予定表示機能](#2-練習予定表示機能)  
3. [詳細ポップアップ機能](#3-詳細ポップアップ機能)
4. [複数練習対応機能](#4-複数練習対応機能)
5. [合唱団フィルター機能](#5-合唱団フィルター機能)

---

## 1. カレンダー表示機能

### 要件
- 月間カレンダーで練習日を表示
- 前月・次月への移動機能
- 日本語での月・曜日表示

### 実装方法

#### 月間カレンダー生成ロジック
```typescript
const getCurrentMonthDays = () => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  
  // 前月の空白日
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // 当月の日付
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
};
```

#### レスポンシブグリッドレイアウト
```typescript
<div className="grid grid-cols-7 gap-1">
  {weekDays.map(day => (
    <div key={day} className="text-center font-semibold text-gray-600 py-2">
      {day}
    </div>
  ))}
  
  {days.map((day, index) => (
    <div key={index} className="min-h-24 border border-gray-200 p-1">
      {day && (
        <>
          <div className="text-sm font-medium mb-1">{day}</div>
          {/* 練習予定表示エリア */}
        </>
      )}
    </div>
  ))}
</div>
```

#### 月送り機能
```typescript
const navigateMonth = (direction: 'prev' | 'next') => {
  setCurrentDate(prev => {
    const newDate = new Date(prev);
    newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
    return newDate;
  });
};
```

### 工夫点
- 月の境界日の計算を正確に処理
- 空白セルも含めた一貫したグリッド表示
- 直感的な矢印ボタンによる月移動

---

## 2. 練習予定表示機能

### 要件
- 時間・練習場所・合唱団名（全角4文字略称）を表示
- 合唱団ごとの色分け表示
- クリック可能なインターフェース

### 実装方法

#### 日付別練習取得
```typescript
const getPracticesForDate = (day: number) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const date = new Date(year, month, day);
  const dateString = date.toISOString().split('T')[0];
  
  return practices.filter(practice => practice.date === dateString);
};
```

#### 練習情報の表示
```typescript
const practice = dayPractices[0];
const choirTeam = choirTeams.find(team => team.id === practice.choirTeamId);
const venue = venues.find(v => v.id === practice.venueId);

return (
  <div
    onClick={() => onPracticeClick(practice, choirTeam, venue)}
    className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
    style={{ backgroundColor: choirTeam.color }}
  >
    <div className="text-white font-medium">
      {practice.startTime}
    </div>
    <div className="text-white text-xs">
      {venue.abbreviation}
    </div>
    <div className="text-white text-xs">
      {choirTeam.abbreviation}
    </div>
  </div>
);
```

#### データ関連の仕組み
```typescript
// サンプルデータでの関連設定
export const samplePractices: Practice[] = [
  {
    id: '1',
    choirTeamId: '1', // 東京混声合唱団
    venueId: '1',     // 渋谷区民会館
    songIds: ['1', '2']
  }
];

export const sampleVenues: Venue[] = [
  {
    id: '1',
    name: '渋谷区民会館',
    abbreviation: '渋谷会館' // 全角4文字
  }
];
```

### 工夫点
- 略称フィールドでコンパクトな表示を実現
- 合唱団カラーによる視覚的識別
- ホバー効果でインタラクティブ感を演出

---

## 3. 詳細ポップアップ機能

### 要件
- 練習をタップすると詳細情報をポップアップ表示
- 練習場所・練習曲・備考の詳細表示
- モーダル形式でのオーバーレイ表示

### 実装方法

#### モーダルの構造
```typescript
const PracticeModal: React.FC<PracticeModalProps> = ({
  isOpen,
  onClose,
  practice,
  choirTeam,
  venue,
  songs
}) => {
  if (!isOpen || !practice || !choirTeam || !venue) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* モーダル内容 */}
      </div>
    </div>
  );
};
```

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

#### 楽曲情報の表示
```typescript
{songs.length > 0 && (
  <div>
    <h4 className="font-semibold text-gray-700 mb-2">練習曲</h4>
    <div className="space-y-2">
      {songs.map(song => (
        <div key={song.id} className="bg-gray-50 p-3 rounded">
          <p className="font-medium text-gray-800">{song.title}</p>
          {song.composer && (
            <p className="text-gray-600 text-sm">作曲: {song.composer}</p>
          )}
          {song.lyricist && (
            <p className="text-gray-600 text-sm">作詞: {song.lyricist}</p>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

#### 状態連携の仕組み
```typescript
// App.tsx での状態管理
const handlePracticeClick = (practice: Practice, choirTeam: ChoirTeam, venue: Venue) => {
  const songs = sampleSongs.filter(song => practice.songIds.includes(song.id));
  
  setSelectedPractice(practice);
  setSelectedChoirTeam(choirTeam);
  setSelectedVenue(venue);
  setSelectedSongs(songs);
  setModalOpen(true);
};
```

### 工夫点
- z-indexでモーダルを最前面に配置
- 背景クリック・Xボタンでの閉じる機能
- 楽曲の作曲者・作詞者情報も表示
- レスポンシブ対応で各デバイスに最適化

---

## 4. 複数練習対応機能

### 要件  
- 同日に複数練習がある場合「練習X件」として表示
- クリックで複数練習の一覧表示
- 一覧から個別練習の詳細へアクセス可能

### 実装方法

#### カレンダーでの複数練習判定
```typescript
{(() => {
  const dayPractices = getPracticesForDate(day);
  
  if (dayPractices.length === 1) {
    // 単一練習の表示処理
  } else if (dayPractices.length > 1) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0];
    
    return (
      <div
        onClick={() => onMultiplePracticesClick(dateString, dayPractices)}
        className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-gray-600"
      >
        <div className="text-white font-medium text-center">
          練習{dayPractices.length}件
        </div>
      </div>
    );
  }
  return null;
})()}
```

#### 複数練習一覧モーダル
```typescript
const MultiPracticeModal: React.FC<MultiPracticeModalProps> = ({
  practices,
  choirTeams,
  venues,
  songs,
  onPracticeSelect
}) => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {practices.map(practice => {
          const choirTeam = choirTeams.find(team => team.id === practice.choirTeamId);
          const venue = venues.find(v => v.id === practice.venueId);
          const practiceSongs = songs.filter(song => practice.songIds.includes(song.id));
          
          return (
            <div
              key={practice.id}
              onClick={() => {
                onPracticeSelect(practice, choirTeam, venue);
                onClose();
              }}
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
            >
              {/* 練習情報カード */}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

#### サンプルデータでの重複設定
```typescript
export const samplePractices: Practice[] = [
  // 8月8日に複数の練習を設定
  {
    id: '2',
    date: '2025-08-08',
    startTime: '18:30',
    choirTeamId: '2', // 大阪女声
  },
  {
    id: '3',
    date: '2025-08-08', // 同じ日付
    startTime: '19:00', 
    choirTeamId: '3', // 横浜男声
  }
];
```

### 工夫点
- グレー背景で複数練習を視覚的に区別
- カード形式でスキャンしやすい一覧表示
- ワンクリックで詳細モーダルに遷移
- フィルター機能と連携して選択された合唱団のみ表示

---

## 5. 合唱団フィルター機能

### 要件
- 画面下部に合唱団名のチェックボックスを配置
- チェック状態に応じてカレンダー表示を動的に変更
- 初期状態で全合唱団を選択

### 実装方法

#### フィルター状態の管理
```typescript
const [selectedChoirTeamIds, setSelectedChoirTeamIds] = useState<string[]>(
  sampleChoirTeams.map(team => team.id) // 初期状態で全選択
);
```

#### チェックボックスのトグル処理
```typescript
const handleChoirTeamToggle = (teamId: string) => {
  setSelectedChoirTeamIds(prev => 
    prev.includes(teamId) 
      ? prev.filter(id => id !== teamId)      // チェック外す
      : [...prev, teamId]                     // チェック付ける
  );
};
```

#### 練習データのフィルタリング
```typescript
const filteredPractices = samplePractices.filter(practice => 
  selectedChoirTeamIds.includes(practice.choirTeamId)
);

// カレンダーコンポーネントに渡す
<Calendar
  practices={filteredPractices}
  // その他のprops
/>
```

#### フィルターUIの実装
```typescript
<div className="mt-8 bg-white rounded-lg shadow-lg p-6">
  <h3 className="text-lg font-semibold text-gray-800 mb-4">表示する合唱団を選択</h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {sampleChoirTeams.map(team => (
      <label
        key={team.id}
        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
      >
        <input
          type="checkbox"
          checked={selectedChoirTeamIds.includes(team.id)}
          onChange={() => handleChoirTeamToggle(team.id)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <div 
          className="w-4 h-4 rounded"
          style={{ backgroundColor: team.color }}
        ></div>
        <span className="text-gray-700 font-medium">{team.name}</span>
      </label>
    ))}
  </div>
</div>
```

#### 複数練習モーダルとの連携
```typescript
<MultiPracticeModal
  practices={selectedDatePractices.filter(practice => 
    selectedChoirTeamIds.includes(practice.choirTeamId)
  )}
  // その他のprops
/>
```

### 工夫点
- レスポンシブグリッドで画面サイズに応じてレイアウト調整
- 合唱団カラーを視覚的インジケーターとして表示
- ホバー効果でユーザビリティ向上
- 全モーダルでフィルター状態を適用

---

## 共通実装パターン

### 1. データ関連の設計
```typescript
// 正規化されたデータ構造
interface Practice {
  choirTeamId: string;  // 外部キー
  venueId: string;      // 外部キー  
  songIds: string[];    // 外部キー配列
}

// データの結合処理
const choirTeam = choirTeams.find(team => team.id === practice.choirTeamId);
const venue = venues.find(v => v.id === practice.venueId);
const songs = allSongs.filter(song => practice.songIds.includes(song.id));
```

### 2. 条件付きレンダリング
```typescript
// 安全な条件分岐
if (!choirTeam || !venue) return null;

// 三項演算子での条件表示
{songs.length > 0 && (
  <div>楽曲情報</div>
)}
```

### 3. イベントハンドリング  
```typescript
// コールバック関数での親子通信
<Calendar
  onPracticeClick={handlePracticeClick}
  onMultiplePracticesClick={handleMultiplePracticesClick}
/>

// イベント発火
onClick={() => onPracticeClick(practice, choirTeam, venue)}
```

### 4. スタイリング手法
```typescript
// Tailwind CSSでの動的スタイル
style={{ backgroundColor: choirTeam.color }}

// 条件付きクラス
className={`cursor-pointer hover:opacity-80 ${isSelected ? 'selected' : ''}`}
```

## 今後の改善点

1. **パフォーマンス最適化**
   - useMemo/useCallbackでの最適化
   - 仮想化による大量データ対応

2. **アクセシビリティ向上**
   - キーボードナビゲーション
   - スクリーンリーダー対応
   - ARIAラベルの追加

3. **エラーハンドリング**
   - データ取得失敗時の処理
   - 不正なデータへの対応
   - ローディング状態の表示

4. **テスト追加**
   - 単体テスト
   - 統合テスト  
   - E2Eテスト

これらの機能実装により、実用的で使いやすい合唱団練習日管理システムを構築しました。