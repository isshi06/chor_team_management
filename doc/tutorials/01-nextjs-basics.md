# Next.js基礎：バックエンドエンジニア向け解説

## Next.jsとは何か？

Next.jsは、Reactをベースとしたフルスタックのフレームワークです。バックエンド開発者にとって馴染みのある概念で説明すると：

- **Rails + React** のような位置づけ
- **サーバーサイドレンダリング（SSR）** をサポート
- **ファイルベースルーティング** でAPIエンドポイントも定義可能
- **ビルド時の最適化** が自動で行われる

## 従来のWebアプリケーションとの違い

### 従来のサーバーサイド開発
```
Browser → Rails/Sinatra → Database
         ← HTML + CSS + JS   ←
```

### Next.js開発
```
Browser → Next.js App → API Routes → Database
        ← React Components ←
```

## ディレクトリ構造の理解

### 本プロジェクトの構造
```
chor_team_management/
├── src/app/                 # ← ページとAPIルート（Express のルーター相当）
│   ├── page.tsx            # ← "/" ルート（index.html相当）
│   ├── layout.tsx          # ← 共通レイアウト（テンプレートエンジン相当）
│   └── globals.css         # ← 共通CSS
├── src/components/         # ← 再利用可能なUI部品
├── src/types/             # ← TypeScript型定義（DTOやEntityクラス相当）
└── src/data/              # ← サンプルデータ（データベースの代わり）
```

### ファイルベースルーティング
Next.jsでは、ファイル配置がそのままURLルートになります：

```
src/app/page.tsx              → /
src/app/about/page.tsx        → /about
src/app/api/users/route.ts    → /api/users (APIエンドポイント)
```

これは、Rails のルーティング（`routes.rb`）やSinatraの`get '/users'`と同じ概念です。

## TypeScriptファイルの種類

### `.tsx` ファイル（本プロジェクトのメインファイル）
- Reactコンポーネントを定義
- JSXという拡張構文を使用（HTMLに似た記法）
- MVCでいうViewに相当

```typescript
// src/app/page.tsx
export default function Home() {
  return <h1>Hello World</h1>;  // ← JSX記法
}
```

### `.ts` ファイル
- 純粋なTypeScript（型定義やユーティリティ）
- データモデルやビジネスロジック

```typescript
// src/types/index.ts
export interface Practice {
  id: string;
  date: string;
  // ...
}
```

## 状態管理とデータフロー

### サーバーサイドとの比較

#### 従来のサーバーサイド（例：Rails）
```ruby
class PracticesController < ApplicationController
  def index
    @practices = Practice.all
    render 'calendar' # ERBテンプレートを返す
  end
end
```

#### Next.js/React
```typescript
export default function Home() {
  const [practices, setPractices] = useState(samplePractices);
  
  return <Calendar practices={practices} />;
}
```

### 重要な違い
- **サーバーサイド**: リクエストごとに新しい状態
- **Next.js/React**: ブラウザ内で状態を保持・更新

## コンポーネント間の通信

### バックエンドでの概念との対比

#### サーバーサイド（Service層の呼び出し）
```ruby
class CalendarService
  def self.get_practices
    # ビジネスロジック
  end
end

class CalendarController < ApplicationController
  def calendar
    @practices = CalendarService.get_practices
    # ...
  end
end
```

#### React（props による依存注入）
```typescript
// 親コンポーネント（Controller相当）
function App() {
  const practices = getPractices(); // Service呼び出し相当
  return <Calendar practices={practices} />; // 依存注入
}

// 子コンポーネント（View相当）
function Calendar({ practices }: CalendarProps) {
  return <div>{/* 練習一覧を表示 */}</div>;
}
```

## イベント処理とコールバック

### サーバーサイドでのイベント処理
```ruby
class PracticesController < ApplicationController
  def select
    # 処理を実行
    practice = Practice.find(params[:id])
    session[:selected_practice_id] = practice.id
    render json: { status: 'success' }
  end
end
```

### React でのイベント処理
```typescript
// 親コンポーネントでイベントハンドラーを定義
function App() {
  const handlePracticeClick = (practice: Practice) => {
    // 処理を実行（状態更新など）
    setSelectedPractice(practice);
  };
  
  return <Calendar onPracticeClick={handlePracticeClick} />;
}

// 子コンポーネントでイベントを発火
function Calendar({ onPracticeClick }) {
  return (
    <div onClick={() => onPracticeClick(practice)}>
      {practice.title}
    </div>
  );
}
```

## データの流れ（Props Drilling）

### 概念図
```
App (practices, selectedPractice)
 ├─ Calendar (practices, onPracticeClick)
 └─ Modal (selectedPractice, onClose)
```

これは、DIコンテナでの依存注入と似ています：
- Appが「Service Container」の役割
- 各コンポーネントが必要なデータを受け取る

## ライフサイクルとuseEffect

### サーバーサイドでの初期化
```ruby
class ApplicationController < ActionController::Base
  before_action :load_data
  
  private
  
  def load_data
    # 初期化処理
  end
end
```

### React での初期化
```typescript
useEffect(() => {
  // 初期化処理（コンポーネントマウント時）
  loadData();
}, []); // 空配列 = 初回のみ実行
```

### データ更新の監視
```typescript
useEffect(() => {
  // selectedChoirTeamIds が変更されたら実行
  filterPractices();
}, [selectedChoirTeamIds]); // 依存配列
```

これは、Rails の`after_commit`コールバックやObserverパターンのような仕組みです。

## ビルドとデプロイメント

### 開発環境
```bash
npm run dev    # 開発サーバー起動（nodemon相当）
```

### 本番ビルド
```bash
npm run build  # プロダクションビルド（bundle相当）
npm start      # プロダクションサーバー起動
```

### 静的エクスポート（オプション）
```bash
npm run build && npm run export
```
これにより、静的ファイルが生成され、CDN（CloudFrontなど）で配信可能になります。

## AWSでのデプロイメント選択肢

### 1. AWS App Runner（最も簡単）
```dockerfile
# Dockerfile不要、package.jsonから自動ビルド
```

### 2. ECS Fargate
```dockerfile
FROM node:18-alpine
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### 3. Lambda + CloudFront（サーバーレス）
```typescript
// next.config.js
module.exports = {
  output: 'export', // 静的サイト生成
  images: {
    unoptimized: true
  }
}
```

### 4. Amplify（フルマネージド）
```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
```

## 本プロジェクトの実行

### 前提条件
- Node.js 18+ （Ruby 3.0+に相当）
- npm または yarn （Bundler に相当）

### 実行手順
```bash
# 依存関係インストール（bundle install に相当）
npm install

# 開発サーバー起動（rails server に相当）
npm run dev

# ブラウザでアクセス
open http://localhost:3000
```

### 本番環境想定
```bash
# ビルド（bundle相当）
npm run build

# 本番サーバー起動（bundle exec puma に相当）
npm start
```

## 次のステップ

1. [02-react-concepts.md](./02-react-concepts.md) - React基礎概念
2. [03-state-management.md](./03-state-management.md) - 状態管理の詳細  
3. [04-component-patterns.md](./04-component-patterns.md) - コンポーネント設計パターン

## まとめ

Next.jsは、従来のサーバーサイド開発の概念をクライアントサイドに持ち込んだフレームワークです：

| サーバーサイド概念 | Next.js/React概念 |
|---|---|
| Controller | Page Component |
| Service | Custom Hook / Utility |
| Entity/DTO | TypeScript Interface |  
| Template Engine | JSX |
| Session State | React State |
| Dependency Injection | Props |
| Event Handler | Event Handler |
| Build Tool | npm/webpack |

理解のポイントは、「サーバーサイドの概念をブラウザ内で実現している」ということです。