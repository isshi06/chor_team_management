'use client';

import React, { useState, useRef, useEffect } from 'react';

// 音声ブックマークの型定義
// ユーザーが特定の再生範囲を名前付きで保存するためのデータ構造
interface AudioBookmark {
  id: string;        // 一意識別子（削除・管理用）
  name: string;      // ユーザーが設定するブックマーク名
  startTime: number; // 開始位置（秒数）
  endTime: number;   // 終了位置（秒数）
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
  const [bookmarkEndTime, setBookmarkEndTime] = useState(0);       // 新規ブックマークの終了時間
  
  // ループ再生機能の状態管理
  const [activeBookmark, setActiveBookmark] = useState<AudioBookmark | null>(null); // 現在ループ再生中のブックマーク
  const [isLooping, setIsLooping] = useState(false);               // ループ再生中かどうかのフラグ

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
  // 再生時間の更新、メタデータ読み込み、再生終了の検知、ループ制御を行う
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 再生中の時間更新（通常は250ms間隔で発火）
    const updateTime = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      
      // ループ再生中の終了時間チェック
      if (activeBookmark && isLooping && time >= activeBookmark.endTime) {
        audio.currentTime = activeBookmark.startTime;
      }
    };
    
    // 音声ファイルのメタデータ読み込み完了時に総時間を取得
    const updateDuration = () => setDuration(audio.duration);
    
    // 再生が終了した時の処理
    const handleEnd = () => {
      if (activeBookmark && isLooping) {
        // ループ再生中の場合は開始位置に戻って再生継続
        audio.currentTime = activeBookmark.startTime;
        audio.play().catch(error => console.error('ループ再生失敗:', error));
      } else {
        setIsPlaying(false);
        setActiveBookmark(null);
        setIsLooping(false);
      }
    };

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
  }, [audioUrl, activeBookmark, isLooping]); // audioUrl、ループ関連の状態が変更された時に再実行

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
  // 現在の再生位置から終了時間までの範囲を名前付きで保存する
  const addBookmark = () => {
    // バリデーション: 必要な条件が揃っているかチェック
    if (!currentFile || !bookmarkName.trim() || currentTime === 0 || bookmarkEndTime <= currentTime) {
      alert('ブックマーク名を入力し、終了時間が開始時間より後になるよう設定してください。');
      return;
    }

    const newBookmark: AudioBookmark = {
      id: Date.now().toString(),      // 現在時刻をIDとして使用（簡易的な一意性保証）
      name: bookmarkName.trim(),      // 前後の空白を除去
      startTime: currentTime,         // 開始位置（現在の再生位置）
      endTime: bookmarkEndTime,       // 終了位置（ユーザーが設定した時間）
      fileName: currentFile.name      // ファイル名（ファイル切り替え時の制御用）
    };

    // 新しいブックマークを配列に追加
    setBookmarks(prev => [...prev, newBookmark]);
    
    // 入力フォームをリセット
    setBookmarkName('');
    setBookmarkEndTime(0);
    setShowBookmarkInput(false);
  };

  // ブックマーク削除処理
  // 指定されたIDのブックマークを削除する
  const deleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
  };

  // ブックマーク範囲でのループ再生開始処理
  // 保存された開始時間に移動し、終了時間でループする再生を開始
  const startBookmarkLoop = (bookmark: AudioBookmark) => {
    const audio = audioRef.current;
    if (!audio) return;

    // ブックマークの開始位置に移動
    audio.currentTime = bookmark.startTime;
    setCurrentTime(bookmark.startTime);
    
    // ループ再生状態を設定
    setActiveBookmark(bookmark);
    setIsLooping(true);
    
    // 再生開始
    if (!isPlaying) {
      audio.play().catch(error => console.error('ループ再生開始失敗:', error));
      setIsPlaying(true);
    }
  };

  // ループ再生停止処理
  const stopLoop = () => {
    setActiveBookmark(null);
    setIsLooping(false);
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
                onClick={() => {
                  setShowBookmarkInput(!showBookmarkInput);
                  // フォーム表示時に現在時間より10秒後を初期値として設定
                  if (!showBookmarkInput) {
                    setBookmarkEndTime(Math.min(currentTime + 10, duration));
                  }
                }}
                disabled={!audioUrl || currentTime === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                📝 範囲ブックマーク追加
              </button>
              
              {/* ループ停止ボタン */}
              {isLooping && (
                <button
                  onClick={stopLoop}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  🔄 ループ停止
                </button>
              )}
            </div>

            {/* ブックマーク追加入力フォーム */}
            {showBookmarkInput && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  {/* ブックマーク名入力 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ブックマーク名
                    </label>
                    <input
                      type="text"
                      value={bookmarkName}
                      onChange={(e) => setBookmarkName(e.target.value)}
                      placeholder="ブックマーク名を入力"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                    />
                  </div>
                  
                  {/* 時間範囲設定 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        開始時間
                      </label>
                      <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-md">
                        {formatTime(currentTime)} (現在位置)
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        終了時間
                      </label>
                      <input
                        type="range"
                        min={currentTime}
                        max={duration}
                        step="0.1"
                        value={bookmarkEndTime}
                        onChange={(e) => setBookmarkEndTime(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-600 text-center mt-1">
                        {formatTime(bookmarkEndTime)}
                      </div>
                    </div>
                  </div>
                  
                  {/* 再生時間表示 */}
                  <div className="text-sm text-gray-600">
                    ループ再生時間: {formatTime(bookmarkEndTime - currentTime)}
                  </div>
                  
                  {/* ボタン */}
                  <div className="flex space-x-2">
                    <button
                      onClick={addBookmark}
                      disabled={!bookmarkName.trim() || bookmarkEndTime <= currentTime}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setShowBookmarkInput(false);
                        setBookmarkName('');
                        setBookmarkEndTime(0);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ブックマーク一覧セクション */}
        {bookmarks.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">保存済み範囲ブックマーク</h2>
            <div className="space-y-3">
              {bookmarks.map(bookmark => (
                <div 
                  key={bookmark.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    activeBookmark?.id === bookmark.id 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 mb-1">
                        {bookmark.name}
                        {activeBookmark?.id === bookmark.id && (
                          <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            🔄 ループ中
                          </span>
                        )}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>ファイル: {bookmark.fileName}</p>
                        <p>
                          範囲: {formatTime(bookmark.startTime)} ～ {formatTime(bookmark.endTime)}
                          <span className="ml-2 text-gray-500">
                            (時間: {formatTime(bookmark.endTime - bookmark.startTime)})
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startBookmarkLoop(bookmark)}
                        disabled={!audioUrl || currentFile?.name !== bookmark.fileName}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        🔄 ループ再生
                      </button>
                      <button
                        onClick={() => deleteBookmark(bookmark.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        🗑️ 削除
                      </button>
                    </div>
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
            <li>3. 「範囲ブックマーク追加」で開始～終了時間を設定して保存できます</li>
            <li>4. 「ループ再生」で指定範囲を繰り返し再生できます</li>
            <li>5. ブックマークは次回起動時も利用できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerPage;
