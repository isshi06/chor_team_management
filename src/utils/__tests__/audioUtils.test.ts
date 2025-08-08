import { 
  formatTime, 
  validateBookmarkRange, 
  isSupportedAudioFormat, 
  validateBookmarkName 
} from '../audioUtils';

describe('audioUtils', () => {
  describe('formatTime', () => {
    it('秒数を正しく分:秒形式に変換する', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(125)).toBe('2:05');
      expect(formatTime(3661)).toBe('61:01'); // 61分1秒
    });

    it('無効な値に対してフォールバック値を返す', () => {
      expect(formatTime(NaN)).toBe('0:00');
      expect(formatTime(Infinity)).toBe('0:00');
      expect(formatTime(-1)).toBe('0:00'); // 負の数も適切に処理される
    });

    it('小数点を含む秒数を正しく処理する', () => {
      expect(formatTime(30.7)).toBe('0:30');
      expect(formatTime(90.9)).toBe('1:30');
    });
  });

  describe('validateBookmarkRange', () => {
    const duration = 180; // 3分のテスト音声

    it('正常な範囲でバリデーションが通る', () => {
      const result = validateBookmarkRange(30, 60, duration);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('開始時間が負の場合はエラー', () => {
      const result = validateBookmarkRange(-1, 60, duration);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('開始時間は0以上である必要があります');
    });

    it('終了時間が音声長を超える場合はエラー', () => {
      const result = validateBookmarkRange(30, 200, duration);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('終了時間は音声ファイルの長さを超えることはできません');
    });

    it('開始時間が終了時間以上の場合はエラー', () => {
      const result = validateBookmarkRange(60, 60, duration);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('終了時間は開始時間より後である必要があります');
    });

    it('範囲が1秒未満の場合はエラー', () => {
      const result = validateBookmarkRange(30, 30.5, duration);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('ブックマーク範囲は最低1秒以上である必要があります');
    });
  });

  describe('isSupportedAudioFormat', () => {
    it('サポートされている音声形式を正しく識別する', () => {
      expect(isSupportedAudioFormat('audio/mpeg')).toBe(true);
      expect(isSupportedAudioFormat('audio/mp3')).toBe(true);
      expect(isSupportedAudioFormat('audio/wav')).toBe(true);
      expect(isSupportedAudioFormat('audio/ogg')).toBe(true);
      expect(isSupportedAudioFormat('audio/aac')).toBe(true);
      expect(isSupportedAudioFormat('audio/m4a')).toBe(true);
    });

    it('サポートされていない形式を正しく識別する', () => {
      expect(isSupportedAudioFormat('video/mp4')).toBe(false);
      expect(isSupportedAudioFormat('image/jpeg')).toBe(false);
      expect(isSupportedAudioFormat('text/plain')).toBe(false);
      expect(isSupportedAudioFormat('application/pdf')).toBe(false);
    });

    it('より具体的なMIMEタイプも正しく処理する', () => {
      expect(isSupportedAudioFormat('audio/mpeg; codecs="mp3"')).toBe(true);
      expect(isSupportedAudioFormat('audio/wav; rate=44100')).toBe(true);
    });
  });

  describe('validateBookmarkName', () => {
    it('正常な名前でバリデーションが通る', () => {
      const result = validateBookmarkName('サビ部分');
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('空の名前はエラー', () => {
      const result = validateBookmarkName('');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('ブックマーク名を入力してください');
    });

    it('空白のみの名前はエラー', () => {
      const result = validateBookmarkName('   ');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('ブックマーク名を入力してください');
    });

    it('50文字を超える名前はエラー', () => {
      const longName = 'あ'.repeat(51); // 51文字
      const result = validateBookmarkName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('ブックマーク名は50文字以下で入力してください');
    });

    it('50文字ちょうどの名前は通る', () => {
      const exactName = 'あ'.repeat(50); // 50文字
      const result = validateBookmarkName(exactName);
      expect(result.isValid).toBe(true);
    });
  });
});