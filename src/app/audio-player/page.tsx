'use client';

import React, { useState, useRef, useEffect } from 'react';

// 音声ブックマークの型定義
// ユーザーが特定の再生位置を名前付きで保存するためのデータ構造
interface AudioBookmark {
  id: string;        // 一意識別子（削除・管理用）
  name: string;      // ユーザーが設定するブックマーク名
  time: number;      // 再生位置（秒数）
  fileName: string;  // 対象音声ファイル名（ファイル切り替え時の制御用）
}

const AudioPlayerPage: React.FC = () => {
  // 音声再生関連のRef（DOM要素への直接アクセス用）
  const audioRef = useRef<HTMLAudioElement>(null);     // HTML5 audio要素への参照
  const fileInputRef = useRef<HTMLInputElement>(null); // ファイル入力要素への参照（将来の機能拡張用）
  
  // 音声再生の状態管理
  const [isPlaying, setIsPlaying] = useState(false);           // 再生中かどうかのフラグ
  const [currentTime, setCurrentTime] = useState(0);           // 現在の再生位置（秒）
  const [duration, setDuration] = useState(0);                // 音声ファイルの総再生時間（秒）
  const [currentFile, setCurrentFile] = useState<File | null>(null); // 選択中のファイルオブジェクト
  const [audioUrl, setAudioUrl] = useState<string>('');       // ブラウザで再生可能なURL（Object URL）
  
  // ブックマーク機能の状態管理
  const [bookmarks, setBookmarks] = useState<AudioBookmark[]>([]); // 保存済みブックマーク一覧
  const [bookmarkName, setBookmarkName] = useState('');            // 新規ブックマーク名の入力値
  const [showBookmarkInput, setShowBookmarkInput] = useState(false); // ブックマーク入力フォームの表示状態

  // コンポーネント初期化時の処理
  // ローカルストレージから保存済みブックマークを復元
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('audioBookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (error) {
        console.error('ブックマークの読み込みに失敗しました:', error);
        // 破損したデータを削除
        localStorage.removeItem('audioBookmarks');
      }
    }
  }, []);

  // ブックマーク変更時の自動保存処理
  // ブックマークが追加・削除される度にローカルストレージに永続化
  useEffect(() => {
    if (bookmarks.length >= 0) { // 初期化時も含めて保存
      localStorage.setItem('audioBookmarks', JSON.stringify(bookmarks));
    }
  }, [bookmarks]);

  // 音声要素のイベントリスナー設定
  // 再生時間の更新、メタデータ読み込み、再生終了の検知を行う
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 再生中の時間更新（通常は250ms間隔で発火）
    const updateTime = () => setCurrentTime(audio.currentTime);
    
    // 音声ファイルのメタデータ読み込み完了時に総時間を取得
    const updateDuration = () => setDuration(audio.duration);
    
    // 再生が終了した時の処理
    const handleEnd = () => setIsPlaying(false);

    // イベントリスナーを登録
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);

    // クリーンアップ: コンポーネントのアンマウント時やaudioUrlが変更された時にリスナーを削除
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
    };
  }, [audioUrl]); // audioUrlが変更された時に再実行

  // ローカルファイル選択時の処理
  // File APIを使用してユーザーが選択したMP3ファイルを読み込み
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // 音声ファイルかどうかをMIMEタイプで判定
    if (file && file.type.startsWith('audio/')) {
      setCurrentFile(file);
      
      // メモリリーク防止: 既存のObject URLがあれば解放
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // ファイルをブラウザで再生可能なURLに変換（Object URL）
      const newUrl = URL.createObjectURL(file);
      setAudioUrl(newUrl);
      
      // 再生状態をリセット
      setIsPlaying(false);
      setCurrentTime(0);
    } else if (file) {
      // 音声ファイル以外が選択された場合の警告
      alert('音声ファイル（MP3など）を選択してください。');
    }
  };

  // 再生・一時停止の切り替え処理
  // HTML5 AudioのAPIを使用して音声の再生制御を行う
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();  // 一時停止
    } else {
      // 再生開始（非同期処理のためエラーハンドリング推奨）
      audio.play().catch(error => {
        console.error('音声の再生に失敗しました:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  // プログレスバーのクリック処理
  // ユーザーがクリックした位置に応じて再生位置を変更する
  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return; // 音声が読み込まれていない場合は何もしない

    // クリック位置の計算
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;  // 要素内での相対X座標
    const progress = clickX / rect.width;       // 0-1の進捗率
    const newTime = progress * duration;        // 対応する再生時間
    
    // 再生位置を変更
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 時間表示用のフォーマット関数
  // 秒数を「分:秒」形式（例: 1:23, 10:05）に変換
  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00'; // 無効な値の場合のフォールバック
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`; // 秒は常に2桁表示
  };

  // ブックマーク追加処理
  // 現在の再生位置を名前付きで保存する
  const addBookmark = () => {
    // バリデーション: 必要な条件が揃っているかチェック
    if (!currentFile || !bookmarkName.trim() || currentTime === 0) {
      return;
    }

    const newBookmark: AudioBookmark = {
      id: Date.now().toString(),      // 現在時刻をIDとして使用（簡易的な一意性保証）
      name: bookmarkName.trim(),      // 前後の空白を除去
      time: currentTime,              // 現在の再生位置
      fileName: currentFile.name      // ファイル名（ファイル切り替え時の制御用）
    };

    // 新しいブックマークを配列に追加
    setBookmarks(prev => [...prev, newBookmark]);
    
    // 入力フォームをリセット
    setBookmarkName('');
    setShowBookmarkInput(false);
  };

  // ブックマーク削除処理
  // 指定されたIDのブックマークを削除する
  const deleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
  };

  // ブックマーク位置へのジャンプ処理
  // 保存された時間位置に即座に移動する
  const jumpToBookmark = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    // 指定された時間位置に移動
    audio.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">音楽プレーヤー</h1>
          <p className="text-gray-600">MP3ファイルの再生とブックマーク管理</p>
          
          {/* ホームに戻るリンク */}
          <div className="mt-4">
            <a 
              href="/" 
              className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🏠 カレンダーに戻る
            </a>
          </div>
        </header>

        {/* ファイル選択セクション */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">ファイル選択</h2>
          <div className="flex items-center space-x-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,audio/mpeg,audio/mp3"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {currentFile && (
              <span className="text-gray-600">選択中: {currentFile.name}</span>
            )}
          </div>
        </div>

        {/* プレーヤーセクション */}
        {audioUrl && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">プレーヤー</h2>
            
            {/* 隠れた音声要素 */}
            <audio ref={audioRef} src={audioUrl} />
            
            {/* プログレスバー */}
            <div className="mb-4">
              <div 
                className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
                onClick={handleProgressClick}
              >
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 操作ボタン */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={togglePlayPause}
                disabled={!audioUrl}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>{isPlaying ? '⏸️' : '▶️'}</span>
                <span>{isPlaying ? '停止' : '再生'}</span>
              </button>
              
              <button
                onClick={() => setShowBookmarkInput(!showBookmarkInput)}
                disabled={!audioUrl || currentTime === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                📝 ブックマーク追加
              </button>
            </div>

            {/* ブックマーク追加入力フォーム */}
            {showBookmarkInput && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={bookmarkName}
                    onChange={(e) => setBookmarkName(e.target.value)}
                    placeholder="ブックマーク名を入力"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                  />
                  <button
                    onClick={addBookmark}
                    disabled={!bookmarkName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setShowBookmarkInput(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    キャンセル
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  現在位置: {formatTime(currentTime)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ブックマーク一覧セクション */}
        {bookmarks.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">保存済みブックマーク</h2>
            <div className="space-y-2">
              {bookmarks.map(bookmark => (
                <div 
                  key={bookmark.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{bookmark.name}</h3>
                    <p className="text-sm text-gray-600">
                      {bookmark.fileName} - {formatTime(bookmark.time)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => jumpToBookmark(bookmark.time)}
                      disabled={!audioUrl || currentFile?.name !== bookmark.fileName}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      ⏯️ 再生
                    </button>
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      🗑️ 削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 使い方説明 */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">使い方</h3>
          <ul className="text-blue-700 space-y-1">
            <li>1. 「ファイル選択」でMP3ファイルを選択してください</li>
            <li>2. プログレスバーをクリックして好きな位置に移動できます</li>
            <li>3. 「ブックマーク追加」で現在位置を名前付きで保存できます</li>
            <li>4. 保存したブックマークは次回も利用できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerPage;