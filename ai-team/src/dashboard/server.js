import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { initWebSocket } from './websocket.js';
import { crew } from '../crew.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.DASHBOARD_PORT || 3333;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize WebSocket
initWebSocket(server);

// API endpoints
app.get('/api/status', (req, res) => {
  res.json(crew.getStatus());
});

app.post('/api/task/assign', async (req, res) => {
  const { agent, task, description } = req.body;
  
  try {
    const result = await crew.assignTask(agent, task, description);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/task/parallel', async (req, res) => {
  const { tasks } = req.body;
  
  try {
    const results = await crew.runParallel(tasks);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/agents', (req, res) => {
  const agents = Object.keys(crew.agents).map(name => ({
    name,
    role: crew.agents[name].role,
    goal: crew.agents[name].goal,
    backstory: crew.agents[name].backstory
  }));
  
  res.json(agents);
});

app.get('/api/tasks/:agent', (req, res) => {
  const { agent } = req.params;
  const tasks = crew.tasks[agent];
  
  if (!tasks) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  res.json(Object.keys(tasks).map(taskName => ({
    name: taskName,
    ...tasks[taskName]
  })));
});

server.listen(PORT, () => {
  console.log(`\n🎯 AI Team Dashboard running at http://localhost:${PORT}`);
  console.log(`📊 Open in browser to monitor your AI team\n`);
});
