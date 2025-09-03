import { WebSocket,WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws: WebSocket) => {
  console.log('クライアント接続あり');

  ws.on('message', (message: WebSocket.RawData) => {
    console.log(`受信: ${message.toString()}`);
    ws.send(`サーバーから: ${message.toString()}`);
  });

  ws.send('サーバーに接続しました！');
});

console.log('WebSocket サーバー起動: ws://localhost:8080');
