# テスト戦略：バックエンドエンジニア向け解説

## React テストの概要

React アプリケーションのテストは、バックエンドのテストピラミッドと同様の概念で構成されます：

```
    E2E Tests (少数)
      ↑
  Integration Tests (中程度)  
      ↑
   Unit Tests (多数)
```

## 1. Unit Tests（単体テスト）

### サーバーサイドでの単体テスト
```ruby
# spec/services/practice_service_spec.rb
require 'rails_helper'

RSpec.describe PracticeService, type: :service do
  let(:practice_repository) { double('PracticeRepository') }
  let(:practice_service) { PracticeService.new(practice_repository) }
  
  describe '#get_all_practices' do
    it 'すべての練習を返すこと' do
      # Given
      expected_practices = [
        Practice.new(id: '1', title: '練習1'),
        Practice.new(id: '2', title: '練習2')
      ]
      allow(practice_repository).to receive(:find_all).and_return(expected_practices)
      
      # When
      result = practice_service.get_all_practices
      
      # Then
      expect(result.size).to eq(2)
      expect(result).to eq(expected_practices)
    end
  end
end
```

### React での単体テスト
```typescript
// Calendar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Calendar from '../Calendar';
import { Practice, ChoirTeam, Venue } from '@/types';

const mockPractices: Practice[] = [
  {
    id: '1',
    date: '2025-08-07',
    startTime: '19:00',
    endTime: '21:00',
    choirTeamId: '1',
    venueId: '1',
    songIds: ['1']
  }
];

const mockChoirTeams: ChoirTeam[] = [
  {
    id: '1',
    name: '合唱団001',
    abbreviation: '団001',
    color: '#3B82F6'
  }
];

const mockVenues: Venue[] = [
  {
    id: '1',
    name: 'サンプル会館A',
    abbreviation: '会館A'
  }
];

describe('Calendar Component', () => {
  const mockOnPracticeClick = jest.fn();
  const mockOnMultiplePracticesClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('練習情報が正しく表示される', () => {
    render(
      <Calendar
        practices={mockPractices}
        choirTeams={mockChoirTeams}
        venues={mockVenues}
        onPracticeClick={mockOnPracticeClick}
        onMultiplePracticesClick={mockOnMultiplePracticesClick}
      />
    );

    // 時間が表示されているか
    expect(screen.getByText('19:00')).toBeInTheDocument();
    
    // 会場略称が表示されているか
    expect(screen.getByText('会館A')).toBeInTheDocument();
    
    // 合唱団略称が表示されているか
    expect(screen.getByText('団001')).toBeInTheDocument();
  });

  test('練習をクリックするとコールバックが呼ばれる', () => {
    render(
      <Calendar
        practices={mockPractices}
        choirTeams={mockChoirTeams}
        venues={mockVenues}
        onPracticeClick={mockOnPracticeClick}
        onMultiplePracticesClick={mockOnMultiplePracticesClick}
      />
    );

    const practiceElement = screen.getByText('19:00').closest('div');
    fireEvent.click(practiceElement!);

    expect(mockOnPracticeClick).toHaveBeenCalledWith(
      mockPractices[0],
      mockChoirTeams[0],
      mockVenues[0]
    );
  });

  test('月移動ボタンが動作する', () => {
    render(
      <Calendar
        practices={[]}
        choirTeams={[]}
        venues={[]}
        onPracticeClick={mockOnPracticeClick}
        onMultiplePracticesClick={mockOnMultiplePracticesClick}
      />
    );

    const nextButton = screen.getByText('›');
    fireEvent.click(nextButton);

    // 月が変更されていることを確認（月名の変更をチェック）
    expect(screen.getByText(/2025年9月/)).toBeInTheDocument();
  });

  test('複数の練習がある日は「練習X件」と表示される', () => {
    const multiplePractices = [
      { ...mockPractices[0], id: '1' },
      { ...mockPractices[0], id: '2', choirTeamId: '2' }
    ];

    render(
      <Calendar
        practices={multiplePractices}
        choirTeams={mockChoirTeams}
        venues={mockVenues}
        onPracticeClick={mockOnPracticeClick}
        onMultiplePracticesClick={mockOnMultiplePracticesClick}
      />
    );

    expect(screen.getByText('練習2件')).toBeInTheDocument();
  });
});
```

### Custom Hooks のテスト
```typescript
// usePracticeFilter.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePracticeFilter } from '../hooks/usePracticeFilter';

const mockPractices: Practice[] = [
  { id: '1', choirTeamId: 'team1' },
  { id: '2', choirTeamId: 'team2' },
  { id: '3', choirTeamId: 'team1' }
];

describe('usePracticeFilter', () => {
  test('初期状態で全練習が返される', () => {
    const { result } = renderHook(() => usePracticeFilter(mockPractices));
    
    expect(result.current.filteredPractices).toEqual(mockPractices);
    expect(result.current.selectedTeamIds).toEqual([]);
  });

  test('チーム選択でフィルタリングされる', () => {
    const { result } = renderHook(() => usePracticeFilter(mockPractices));
    
    act(() => {
      result.current.toggleTeam('team1');
    });

    expect(result.current.filteredPractices).toHaveLength(2);
    expect(result.current.selectedTeamIds).toEqual(['team1']);
  });

  test('チーム選択解除でフィルターから除外される', () => {
    const { result } = renderHook(() => usePracticeFilter(mockPractices));
    
    act(() => {
      result.current.toggleTeam('team1');
      result.current.toggleTeam('team1'); // 解除
    });

    expect(result.current.filteredPractices).toEqual(mockPractices);
    expect(result.current.selectedTeamIds).toEqual([]);
  });
});
```

## 2. Integration Tests（統合テスト）

### サーバーサイドでの統合テスト
```ruby
# spec/requests/practices_spec.rb
require 'rails_helper'

RSpec.describe 'Practices API', type: :request do
  describe 'GET /api/practices' do
    before do
      Practice.create!(id: '1', title: '練習1')
      Practice.create!(id: '2', title: '練習2')
    end
    
    it '正しいフォーマットで練習一覧を返すこと' do
      get '/api/practices'
      
      expect(response).to have_http_status(:ok)
      
      json_response = JSON.parse(response.body)
      expect(json_response).not_to be_nil
      expect(json_response.size).to be > 0
      expect(json_response.first).to have_key('id')
      expect(json_response.first).to have_key('title')
    end
  end
end
```

### React での統合テスト
```typescript
// App.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// モーダルライブラリのモック
jest.mock('react-modal', () => {
  return function MockModal({ children, isOpen }: any) {
    return isOpen ? <div data-testid="modal">{children}</div> : null;
  };
});

describe('App Integration Tests', () => {
  test('カレンダーから練習を選択してモーダルが表示される', async () => {
    render(<App />);

    // カレンダーが表示されることを確認
    expect(screen.getByText('合唱団練習日管理')).toBeInTheDocument();
    
    // 練習をクリック
    const practiceElement = screen.getByText('19:00');
    fireEvent.click(practiceElement);

    // モーダルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    
    // 練習詳細が表示されることを確認
    expect(screen.getByText('練習詳細')).toBeInTheDocument();
  });

  test('合唱団フィルターでカレンダー表示が変更される', () => {
    render(<App />);

    // 初期状態で全ての練習が表示されている
    expect(screen.getAllByText(/19:00|18:30|14:00/).length).toBeGreaterThan(0);

    // 特定の合唱団のチェックを外す
    const checkbox = screen.getByLabelText('東京混声合唱団');
    fireEvent.click(checkbox);

    // 該当する練習が非表示になることを確認
    // (実際のテストでは具体的な要素の有無を確認)
  });

  test('複数練習がある日をクリックして一覧モーダルが表示される', async () => {
    render(<App />);

    // 「練習2件」をクリック
    const multiplePracticesElement = screen.getByText('練習2件');
    fireEvent.click(multiplePracticesElement);

    // 複数練習一覧モーダルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('の練習一覧')).toBeInTheDocument();
    });
  });
});
```

### React Query との統合テスト
```typescript
// APIとの統合テスト（実際のAPIを使用）
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { usePractices } from '../hooks/usePractices';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('API Integration Tests', () => {
  test('練習データが正しく取得される', async () => {
    const { result } = renderHook(() => usePractices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});
```

## 3. E2E Tests（End-to-End テスト）

### セットアップ
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E テスト実装
```typescript
// e2e/calendar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('合唱団練習日管理システム', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ページが正しく読み込まれる', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('合唱団練習日管理');
    await expect(page.locator('[data-testid=calendar]')).toBeVisible();
  });

  test('練習をクリックして詳細モーダルが表示される', async ({ page }) => {
    // 練習要素をクリック
    await page.click('[data-testid=practice-item]');
    
    // モーダルが表示されることを確認
    await expect(page.locator('[data-testid=practice-modal]')).toBeVisible();
    await expect(page.locator('[data-testid=modal-title]')).toContainText('練習詳細');
    
    // モーダルを閉じる
    await page.click('[data-testid=close-button]');
    await expect(page.locator('[data-testid=practice-modal]')).not.toBeVisible();
  });

  test('月移動機能が動作する', async ({ page }) => {
    // 現在の月を取得
    const currentMonth = await page.locator('[data-testid=current-month]').textContent();
    
    // 次月ボタンをクリック
    await page.click('[data-testid=next-month]');
    
    // 月が変更されていることを確認
    const newMonth = await page.locator('[data-testid=current-month]').textContent();
    expect(newMonth).not.toBe(currentMonth);
    
    // 前月ボタンで戻る
    await page.click('[data-testid=prev-month]');
    
    // 元の月に戻っていることを確認
    const restoredMonth = await page.locator('[data-testid=current-month]').textContent();
    expect(restoredMonth).toBe(currentMonth);
  });

  test('合唱団フィルターが動作する', async ({ page }) => {
    // 初期状態で練習が表示されていることを確認
    await expect(page.locator('[data-testid=practice-item]')).toHaveCount(8);
    
    // 合唱団のチェックボックスを外す
    await page.uncheck('[data-testid=choir-filter-1]');
    
    // 練習の表示件数が変更されることを確認
    const remainingPractices = await page.locator('[data-testid=practice-item]').count();
    expect(remainingPractices).toBeLessThan(8);
    
    // チェックボックスを再度チェック
    await page.check('[data-testid=choir-filter-1]');
    
    // 練習が再度表示されることを確認
    await expect(page.locator('[data-testid=practice-item]')).toHaveCount(8);
  });

  test('複数練習がある日の一覧表示', async ({ page }) => {
    // 複数練習がある日をクリック
    await page.click('[data-testid=multiple-practices]');
    
    // 一覧モーダルが表示されることを確認
    await expect(page.locator('[data-testid=multi-practice-modal]')).toBeVisible();
    
    // 複数の練習が表示されていることを確認
    const practiceCards = await page.locator('[data-testid=practice-card]').count();
    expect(practiceCards).toBeGreaterThan(1);
    
    // 一つの練習をクリック
    await page.click('[data-testid=practice-card]');
    
    // 詳細モーダルに切り替わることを確認
    await expect(page.locator('[data-testid=practice-modal]')).toBeVisible();
    await expect(page.locator('[data-testid=multi-practice-modal]')).not.toBeVisible();
  });

  test('レスポンシブ対応の確認', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-testid=desktop-layout]')).toBeVisible();
    
    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid=tablet-layout]')).toBeVisible();
    
    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid=mobile-layout]')).toBeVisible();
  });
});
```

## 4. Visual Regression Tests

### Storybook との連携
```typescript
// Calendar.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import Calendar from './Calendar';
import { samplePractices, sampleChoirTeams, sampleVenues } from '@/data/sampleData';

const meta: Meta<typeof Calendar> = {
  title: 'Components/Calendar',
  component: Calendar,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  args: {
    practices: samplePractices,
    choirTeams: sampleChoirTeams,
    venues: sampleVenues,
    onPracticeClick: () => {},
    onMultiplePracticesClick: () => {},
  },
};

export const EmptyCalendar: Story = {
  args: {
    practices: [],
    choirTeams: sampleChoirTeams,
    venues: sampleVenues,
    onPracticeClick: () => {},
    onMultiplePracticesClick: () => {},
  },
};

export const MultiplePracticesDay: Story = {
  args: {
    practices: [
      { ...samplePractices[0], date: '2025-08-08' },
      { ...samplePractices[1], date: '2025-08-08' },
      { ...samplePractices[2], date: '2025-08-08' },
    ],
    choirTeams: sampleChoirTeams,
    venues: sampleVenues,
    onPracticeClick: () => {},
    onMultiplePracticesClick: () => {},
  },
};
```

### Chromatic での Visual Testing
```typescript
// .github/workflows/chromatic.yml
name: Chromatic

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run Chromatic
        uses: chromaui/action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

## 5. テストデータ管理

### テスト用ファクトリー
```typescript
// test-utils/factories.ts
export class PracticeFactory {
  static create(overrides: Partial<Practice> = {}): Practice {
    return {
      id: Math.random().toString(36).substr(2, 9),
      date: '2025-08-07',
      startTime: '19:00',
      endTime: '21:00',
      choirTeamId: '1',
      venueId: '1',
      songIds: ['1'],
      notes: 'テスト用練習',
      ...overrides
    };
  }

  static createMultiple(count: number, overrides: Partial<Practice> = {}): Practice[] {
    return Array.from({ length: count }, (_, i) => 
      this.create({ 
        id: `test-${i}`, 
        ...overrides 
      })
    );
  }
}

export class ChoirTeamFactory {
  static create(overrides: Partial<ChoirTeam> = {}): ChoirTeam {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'テスト合唱団',
      abbreviation: 'テスト団',
      color: '#3B82F6',
      ...overrides
    };
  }
}

// 使用例
describe('Calendar with multiple practices', () => {
  test('複数練習の表示', () => {
    const practices = PracticeFactory.createMultiple(3, { 
      date: '2025-08-08' 
    });
    const choirTeams = [ChoirTeamFactory.create()];
    
    render(
      <Calendar 
        practices={practices} 
        choirTeams={choirTeams}
        venues={[]}
        onPracticeClick={() => {}}
        onMultiplePracticesClick={() => {}}
      />
    );
    
    expect(screen.getByText('練習3件')).toBeInTheDocument();
  });
});
```

### カスタムレンダー関数
```typescript
// test-utils/render.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## 6. CI/CD での自動テスト

### GitHub Actions 設定
```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run unit tests
      run: npm run test:unit
      
    - name: Run integration tests
      run: npm run test:integration
      
    - name: Build application
      run: npm run build
      
    - name: Start application
      run: npm start &
      
    - name: Wait for application
      run: npx wait-on http://localhost:3000
      
    - name: Run E2E tests
      run: npm run test:e2e
      
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: test-results
        path: |
          test-results/
          playwright-report/
```

## まとめ

React テストは、バックエンドテストと同様の戦略で構築できます：

| バックエンド | React | テスト対象 |
|---|---|---|
| Unit Test | Component Test | 個別コンポーネント |
| Integration Test | Hook/Context Test | 複数コンポーネント連携 |
| E2E Test | Browser Test | 全体フロー |
| Contract Test | API Mock Test | 外部API連携 |

テストピラミッドを意識し、コストと効果のバランスを取りながら品質の高いReactアプリケーションを構築しましょう。

次は [06-deployment-aws.md](./06-deployment-aws.md) でAWSデプロイメント戦略について学びましょう。