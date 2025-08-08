// Jest のグローバルセットアップファイル
import '@testing-library/jest-dom'

// HTMLMediaElement のモック（音声再生機能のテスト用）
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'currentTime', {
  writable: true,
  value: 0,
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'duration', {
  writable: true,
  value: 180, // 3分のデフォルト値
})

// URL.createObjectURL と URL.revokeObjectURL のモック
global.URL.createObjectURL = jest.fn(() => 'mocked-url')
global.URL.revokeObjectURL = jest.fn()

// localStorage のモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// console.error のモックでテスト中の不要なエラーメッセージを抑制
global.console.error = jest.fn()