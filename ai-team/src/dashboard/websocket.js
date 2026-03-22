import { WebSocketServer } from 'ws';

let wss = null;
const clients = new Set();

export function initWebSocket(server) {
  wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    console.log('Dashboard client connected');
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Dashboard client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  return wss;
}

export function broadcastStatus(data) {
  const message = JSON.stringify({
    ...data,
    timestamp: data.timestamp || new Date()
  });
  
  clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}
