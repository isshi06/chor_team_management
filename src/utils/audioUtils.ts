// 音声プレーヤー関連のユーティリティ関数

/**
 * 秒数を「分:秒」形式（例: 1:23, 10:05）に変換
 * @param time 秒数
 * @returns フォーマットされた時間文字列
 */
export const formatTime = (time: number): string => {
  if (isNaN(time)) return '0:00'; // 無効な値の場合のフォールバック
  
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`; // 秒は常に2桁表示
};

/**
 * ブックマークの開始時間から終了時間までの範囲をバリデーション
 * @param startTime 開始時間（秒）
 * @param endTime 終了時間（秒）
 * @param duration 音声ファイルの総時間（秒）
 * @returns バリデーション結果とエラーメッセージ
 */
export const validateBookmarkRange = (
  startTime: number, 
  endTime: number, 
  duration: number
): { isValid: boolean; errorMessage?: string } => {
  if (startTime < 0) {
    return { isValid: false, errorMessage: '開始時間は0以上である必要があります' };
  }
  
  if (endTime > duration) {
    return { isValid: false, errorMessage: '終了時間は音声ファイルの長さを超えることはできません' };
  }
  
  if (startTime >= endTime) {
    return { isValid: false, errorMessage: '終了時間は開始時間より後である必要があります' };
  }
  
  if (endTime - startTime < 1) {
    return { isValid: false, errorMessage: 'ブックマーク範囲は最低1秒以上である必要があります' };
  }
  
  return { isValid: true };
};

/**
 * 音声ファイルのMIMEタイプが対応しているかチェック
 * @param mimeType ファイルのMIMEタイプ
 * @returns 対応している場合はtrue
 */
export const isSupportedAudioFormat = (mimeType: string): boolean => {
  const supportedFormats = [
    'audio/mpeg',     // MP3
    'audio/mp3',      // MP3 (alternative)
    'audio/wav',      // WAV
    'audio/ogg',      // OGG
    'audio/aac',      // AAC
    'audio/m4a',      // M4A
  ];
  
  return supportedFormats.some(format => mimeType.startsWith(format));
};

/**
 * ブックマーク名のバリデーション
 * @param name ブックマーク名
 * @returns バリデーション結果とエラーメッセージ
 */
export const validateBookmarkName = (name: string): { isValid: boolean; errorMessage?: string } => {
  if (!name.trim()) {
    return { isValid: false, errorMessage: 'ブックマーク名を入力してください' };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, errorMessage: 'ブックマーク名は50文字以下で入力してください' };
  }
  
  return { isValid: true };
};