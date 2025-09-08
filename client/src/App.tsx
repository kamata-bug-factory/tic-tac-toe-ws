import { useEffect, useState } from 'react';
import type {
  Player,
  Board,
  Position,
  MoveMessage,
} from '@tic-tac-toe-ws/common';

/**
 * Tic-Tac-Toe クライアントアプリ
 *
 * サーバーと WebSocket で接続し、
 * ボードの状態を更新しながらプレイヤーのターンを管理する。
 */
export default function App() {
  // WebSocket 接続オブジェクト
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  // ゲームボードの状態 (3x3)
  const [board, setBoard] = useState<Board>([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);

  // このクライアントのプレイヤー ("X" または "O")
  const [player, setPlayer] = useState<Player | null>(null);

  // 次のターンのプレイヤー
  const [next, setNext] = useState<Player>('X');

  // 勝者 (ゲーム進行中は null)
  const [winner, setWinner] = useState<Player | null>(null);

  /**
   * WebSocket 接続の初期化
   * - 接続完了時にコンソールログ
   * - メッセージ受信時にボード状態・プレイヤー情報を更新
   */
  useEffect(() => {
    const webSocket = new WebSocket('ws://localhost:8080');

    webSocket.onopen = () => console.log('✅ Connected to server');

    webSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'assign':
          // サーバーから自分のプレイヤー情報を受け取る
          setPlayer(message.player);
          break;
        case 'update':
          // サーバーからのボード更新を反映
          setBoard(message.board);
          setNext(message.next);
          setWinner(message.winner);
          break;
      }
    };

    setWebSocket(webSocket);

    // クリーンアップ: コンポーネントアンマウント時に WebSocket を閉じる
    return () => webSocket.close();
  }, []);

  /**
   * プレイヤーの手をサーバーに送信
      * @param x Position 列番号 (0〜2)
   * @param y Position 行番号 (0〜2)
   */
  const sendMove = (x: Position, y: Position) => {
    if (!webSocket || winner) {
return; // 未接続またはゲーム終了時は何もしない
}

    const message: MoveMessage = { type: 'move', x, y };
    webSocket.send(JSON.stringify(message));
  };

  return (
    <div>
      <h1>Tic-Tac-Toe</h1>

      {/* プレイヤー情報とゲーム状況 */}
      <p>Your piece: {player}</p>
      <p>Next turn: {next}</p>
      <p>{winner ? `Winner: ${winner}` : 'In progress'}</p>

      {/* ゲームボード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 50px)' }}>
        {board.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              onClick={() => sendMove(x as Position, y as Position)}
              style={{
                width: 50,
                height: 50,
                border: '1px solid black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                cursor: winner ? 'not-allowed' : 'pointer',
                backgroundColor: cell ? '#f0f0f0' : 'white',
              }}
            >
              {cell}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
