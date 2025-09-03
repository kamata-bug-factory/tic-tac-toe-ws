import { useEffect, useState } from "react";

function App() {
  const [messages, setMessages] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => console.log("WebSocket 接続完了");

    socket.onmessage = (event: MessageEvent) => {
      setMessages((prev) => [...prev, event.data]);
    };

    setWs(socket);

    return () => socket.close();
  }, []);

  const sendMessage = () => {
    if (ws) ws.send("Hello from React!");
  };

  return (
    <div>
      <h1>Tic Tac Toe</h1>
      <button onClick={sendMessage}>メッセージ送信</button>
      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
