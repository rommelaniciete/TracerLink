import * as React from 'react';
import { echo } from '@/echo'; // your echo setup

export function TestRealtimeComponent() {
  const [messages, setMessages] = React.useState<string[]>([]);
  const socket = (echo.connector as any).socket;

if (socket) {
  socket.onopen = () => {
  };

  socket.onerror = (err: any) => {
    console.error('❌ WebSocket error:', err);
  };

  socket.onclose = (event: CloseEvent) => {
    console.warn('⚠️ WebSocket closed:', event);
  };
} else {
  console.warn('⚠️ Socket not ready yet. Try after a moment.');
}

  React.useEffect(() => {
    echo.channel('alumni')
      .listen('.TestRealtime', (e: any) => {
        setMessages(prev => [e.message, ...prev]);
      });

    return () => echo.leaveChannel('alumni');
  }, []);

  return (
    <div>
      <h2>Realtime Test</h2>
      {messages.map((msg, idx) => (
        <div key={idx}>{msg}</div>
      ))}
    </div>
  );
}
