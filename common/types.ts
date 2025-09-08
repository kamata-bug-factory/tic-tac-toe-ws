/**
 * プレイヤーを表す型。
 * 'X' または 'O' のいずれかになる。
 */
export type Player = 'X' | 'O';

/**
 * マスの状態を表す型。
 * プレイヤーの印 ('X' または 'O') が入るか、まだ置かれていない場合は null。
 */
export type Cell = Player | null;

/**
 * 1行分の盤面を表すタプル型。
 * 3つのセルを持つ。
 */
export type Row = [Cell, Cell, Cell];

/**
 * ゲーム全体の盤面を表す型。
 * 3行3列の2次元配列（タプル）で構成される。
 */
export type Board = [Row, Row, Row];

/**
 * 座標を表す型。
 * 0, 1, 2 のいずれかを取る。
 */
export type Position = 0 | 1 | 2;

/**
 * サーバーがクライアントに送信する「プレイヤー割り当て」メッセージ。
 * 接続順に 'X' または 'O' が割り当てられる。
 */
export interface AssignMessage {
  type: 'assign';
  player: Player;
}

/**
 * サーバーがクライアントに送信する「ゲーム状態更新」メッセージ。
 * - 現在の盤面
 * - 次のプレイヤー
 * - 勝者（まだ決まっていなければ null）
 * を含む。
 */
export interface UpdateMessage {
  type: 'update';
  board: Cell[][];
  next: Player;
  winner: Player | null;
}

/**
 * クライアントがサーバーに送信する「手を打つ」メッセージ。
 * - x: 横方向の座標 (0, 1, 2)
 * - y: 縦方向の座標 (0, 1, 2)
 */
export interface MoveMessage {
  type: 'move';
  x: Position;
  y: Position;
}

/**
 * クライアントがサーバーに送信する「ゲームをリセットする」メッセージ。
 * 勝敗が決まった後、盤面を初期化するために使用される。
 */
export interface ResetMessage {
  type: 'reset';
}
