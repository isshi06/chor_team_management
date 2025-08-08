const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js アプリケーションへのパスを指定
  dir: './',
})

// Jest の追加設定
const customJestConfig = {
  // テスト環境を jsdom に設定（React コンポーネントのテスト用）
  testEnvironment: 'jsdom',
  
  // セットアップファイルの指定
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // テスト対象ファイルのパターン
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(js|jsx|ts|tsx)',
    '<rootDir>/**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // テスト対象から除外するディレクトリ
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/'
  ],
  
  // モジュールエイリアスの設定（Next.js の @ パスに対応）
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // カバレッジ情報を収集するファイル
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/page.tsx', // ページコンポーネントは除外（複雑すぎるため）
  ],
}

// Next.js の設定を適用した Jest 設定をエクスポート
module.exports = createJestConfig(customJestConfig)