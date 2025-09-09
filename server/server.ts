import { WebSocket, WebSocketServer } from 'ws';
import type {
  Player,
  Winner,
  Board,
  Position,
  AssignMessage,
  UpdateMessage,
  MoveMessage,
} from '@tic-tac-toe-ws/common';

/**
 * ポートの設定
 * - 開発: 8080
 * - 本番: Render などの環境変数 PORT
 */
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

/**
 * WebSocket サーバーのインスタンスを作成
 * ポート 8080 で待ち受ける
 */
const webSocketServer = new WebSocketServer({ port: PORT });

/**
 * ゲーム盤面（3x3 の二次元配列）
 * すべて null で初期化
 */
const board: Board = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

/**
 * 接続中の WebSocket -> プレイヤー割り当て Map
 * 'X' | 'O' | null（観戦者）を割り当てる
 */
const playerAssignments: Map<WebSocket, Player | null> = new Map();

/**
 * 次のプレイヤー
 * 初期値は 'X'
 */
let next: Player = 'X';

/**
 * 勝者を判定する関数
 * @returns 'X' | 'O' | 'draw' | null
 */
function checkWinner(): Winner {
  const lines = [
    // 横
    ...board,
    // 縦
    [board[0][0], board[1][0], board[2][0]],
    [board[0][1], board[1][1], board[2][1]],
    [board[0][2], board[1][2], board[2][2]],
    // 斜め
    [board[0][0], board[1][1], board[2][2]],
    [board[0][2], board[1][1], board[2][0]],
  ];

  // 勝者判定
  for (const line of lines) {
    if (line[0] && line[0] === line[1] && line[1] === line[2]) {
      return line[0]; // 勝者を返す
    }
  }

  // 引き分け判定: 全マス埋まっていれば draw
  const isFull = board.every((row) => row.every((cell) => cell !== null));
  if (isFull) {
    return 'draw' as Winner; // 引き分け
  }

  return null; // まだ勝敗は決まっていない
}

/**
 * 全クライアントにゲームの最新状態を送信する関数
 * @param message UpdateMessage サーバーから送る更新情報
 */
function broadcast(message: UpdateMessage) {
  for (const client of webSocketServer.clients) {
    client.send(JSON.stringify(message));
  }
}

/**
 * 新しいクライアント接続時の処理
 */
webSocketServer.on('connection', (webSocket) => {
  // 新規接続にプレイヤーを割り当てる
  if (!playerAssignments.has(webSocket)) {
    let assigned: Player | null = null;
    // 'X' が未割り当てなら 'X' を割り当て
    if (![...playerAssignments.values()].includes('X')) {
      assigned = 'X';
    }
    // 'O' が未割り当てなら 'O' を割り当て
    else if (![...playerAssignments.values()].includes('O')) {
      assigned = 'O';
    }
    // それ以降は観戦者扱い (null)
    playerAssignments.set(webSocket, assigned);

    const assignMessage: AssignMessage = { type: 'assign', player: assigned };
    webSocket.send(JSON.stringify(assignMessage));
  }

  // クライアントからメッセージを受け取ったとき
  webSocket.on('message', (data) => {
    const message = JSON.parse(data.toString());
    const player = playerAssignments.get(webSocket);
    if (!player) {
      return; // 観戦者は操作できない
    }

    switch (message.type) {
      case 'move': {
        const move = message as MoveMessage;
        // 順番が違えば無視
        if (player !== next) {
          return;
        }
        // すでにマスが埋まっていれば無視
        if (board[move.y][move.x] !== null) {
          return;
        }

        // 手を打つ
        board[move.y][move.x] = player;
        // 勝者判定
        const winner = checkWinner();
        // 次のプレイヤーに交代
        next = next === 'X' ? 'O' : 'X';
        // 全員に最新盤面を通知
        const update: UpdateMessage = {
          type: 'update',
          board,
          next,
          winner, // 'X' | 'O' | 'draw' | null
        };
        broadcast(update);
        break;
      }

      case 'reset': {
        // 盤面をリセット
        for (let y = 0; y < 3; y++) {
          for (let x = 0; x < 3; x++) {
            board[y as Position][x as Position] = null;
          }
        }
        // プレイヤーの手番をリセット
        next = 'X';
        // 全員にリセットされた盤面を通知
        const update: UpdateMessage = {
          type: 'update',
          board,
          next,
          winner: null,
        };
        broadcast(update);
        break;
      }
    }
  });

  // 接続終了時にプレイヤーを削除
  webSocket.on('close', () => {
    playerAssignments.delete(webSocket);
  });
});

console.log('✅ WebSocket server running on ws://localhost:8080');
