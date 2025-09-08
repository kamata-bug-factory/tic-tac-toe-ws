import { WebSocket, WebSocketServer } from 'ws';
import type {
  Player,
  Board,
  Position,
  AssignMessage,
  UpdateMessage,
  MoveMessage,
} from '@tic-tac-toe-ws/common';

/**
 * WebSocket サーバーのインスタンスを作成。
 * ポート 8080 で待ち受ける。
 */
const webSocketServer = new WebSocketServer({ port: 8080 });

/**
 * ゲーム盤面（3x3 の二次元配列）。
 * すべて null で初期化。
 */
const board: Board = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

/**
 * 接続中の WebSocket とプレイヤーの対応表。
 * 最初の接続には 'X' を、2人目には 'O' を割り当てる。
 */
const players: Map<WebSocket, Player> = new Map();

/**
 * 次に手を打つべきプレイヤー。
 * 初期値は 'X'。
 */
let next: Player = 'X';

/**
 * 勝者を判定する関数。
 * 横・縦・斜めのいずれか 3 マスが同じプレイヤーならそのプレイヤーを返す。
 * 勝者がいなければ null を返す。
 */
function checkWinner(): Player | null {
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
  for (const line of lines) {
    if (line[0] && line[0] === line[1] && line[1] === line[2]) {
      return line[0]; // 勝者を返す
    }
  }
  return null; // まだ勝敗は決まっていない
}

/**
 * 全クライアントにゲームの最新状態を送信する関数。
 * @param message UpdateMessage サーバーから送る更新情報
 */
function broadcast(message: UpdateMessage) {
  for (const client of webSocketServer.clients) {
    client.send(JSON.stringify(message));
  }
}

/**
 * 新しいクライアント接続時の処理。
 * - プレイヤー 'X' または 'O' を割り当てて通知
 * - メッセージ受信時に盤面を更新して全員にブロードキャスト
 * - 接続終了時にプレイヤーを削除
 */
webSocketServer.on('connection', (webSocket) => {
  // 新規接続にプレイヤーを割り当てる
  if (!players.has(webSocket)) {
    const assigned: Player = players.size === 0 ? 'X' : 'O';
    players.set(webSocket, assigned);

    const assignMessage: AssignMessage = { type: 'assign', player: assigned };
    webSocket.send(JSON.stringify(assignMessage));
  }

  // クライアントから「手を打つ」メッセージを受け取ったとき
  webSocket.on('message', (data) => {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case 'move': {
        const move = message as MoveMessage;
        const player = players.get(webSocket);
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
          winner,
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
    players.delete(webSocket);
  });
});

console.log('✅ WebSocket server running on ws://localhost:8080');
