import { useEffect, useState } from 'react';
import type {
  Player,
  Winner,
  Board,
  Position,
  AssignMessage,
  MoveMessage,
  ResetMessage,
  UpdateMessage,
} from '@tic-tac-toe-ws/common';

/**
 * Tic-Tac-Toe クライアントアプリ
 */
export default function App() {
  /**
   * WebSocket 接続オブジェクト
   */
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  /**
   * ゲーム盤面（3x3 の二次元配列）
   * すべて null で初期化
   */
  const [board, setBoard] = useState<Board>([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);

  /**
   * このクライアントのプレイヤー
   * 'X' | 'O' | null（観戦者）
   */
  const [assignedPlayer, setAssignedPlayer] = useState<Player | null>(null);

  /**
   * 次のプレイヤー
   */
  const [next, setNext] = useState<Player>('X');

  /**
   * 勝者
   * 'X' | 'O' | 'draw' | null（ゲーム進行中）
   */
  const [winner, setWinner] = useState<Winner>(null);

  /**
   * WebSocket 接続の初期化
   */
  useEffect(() => {
    const webSocket = new WebSocket(import.meta.env.VITE_WS_URL);

    // 接続完了
    webSocket.onopen = () => console.log('✅ Connected to server');

    // サーバーからメッセージを受け取ったとき
    webSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'assign': {
          const assign = message as AssignMessage;
          // サーバーから自分のプレイヤー情報を受け取る
          setAssignedPlayer(assign.player);
          break;
        }
        case 'update': {
          const update = message as UpdateMessage;
          // サーバーからのボード更新を反映
          setBoard(update.board);
          setNext(update.next);
          setWinner(update.winner);
          break;
        }
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
    // 未接続 or ゲーム終了時 or 観戦者なら何もしない
    if (!webSocket || winner || !assignedPlayer) {
      return;
    }

    const message: MoveMessage = { type: 'move', x, y };
    webSocket.send(JSON.stringify(message));
  };

  /**
   * ゲームリセットをサーバーに送信
   */
  const sendReset = () => {
    // 未接続 or 観戦者なら何もしない
    if (!webSocket || !assignedPlayer) {
      return;
    }

    const message: ResetMessage = { type: 'reset' };
    webSocket.send(JSON.stringify(message));
  };

  return (
    <div>
      <h1>Tic-Tac-Toe</h1>

      {/* プレイヤー情報とゲーム状況 */}
      <p>Your role: {assignedPlayer ? assignedPlayer : 'Viewer'}</p>
      <p>
        {(() => {
          if (winner) {
            if (winner === ('draw' as Winner)) {
              return 'Draw';
            } else {
              return `Winner: ${winner}`;
            }
          } else {
            return `Next turn: ${next}`;
          }
        })()}
      </p>

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
                cursor: winner || !assignedPlayer ? 'not-allowed' : 'pointer',
                backgroundColor: cell ? '#f0f0f0' : 'white',
              }}
            >
              {cell}
            </div>
          ))
        )}
      </div>

      {/* リセットボタン */}
      <button
        onClick={sendReset}
        disabled={!assignedPlayer || !winner}
        style={{
          marginTop: 16,
          padding: '6px 12px',
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        Reset
      </button>
    </div>
  );
}
