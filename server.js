const WebSocket = require('ws');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const WS_PORT = 8080;


const clients = new Map();

const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
  let clientId = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'register') {
      clientId = data.clientId;
      clients.set(clientId, ws);
      console.log(`Client ${clientId} connected`);
      ws.send(JSON.stringify({ type: 'registered', clientId }));
    }

    if (data.type === 'file_chunk') {
      const writeStream = global.activeDownloads.get(data.clientId);
      if (writeStream) {
        const chunk = Buffer.from(data.chunk, 'base64');
        writeStream.write(chunk);
      }
    }

    if (data.type === 'file_complete') {
      const writeStream = global.activeDownloads.get(data.clientId);
      if (writeStream) {
        writeStream.end();
        global.activeDownloads.delete(data.clientId);
        console.log(`File download from ${data.clientId} completed`);
      }
    }

    if (data.type === 'file_error') {
      console.error(`Error from ${data.clientId}: ${data.error}`);
      const writeStream = global.activeDownloads.get(data.clientId);
      if (writeStream) {
        writeStream.end();
        global.activeDownloads.delete(data.clientId);
      }
    }
  });

  ws.on('close', () => {
    if (clientId) {
      clients.delete(clientId);
      console.log(`Client ${clientId} disconnected`);
    }
  });
});

// Track active downloads
global.activeDownloads = new Map();

// API endpoint to trigger file download
app.get('/download/:clientId', async (req, res) => {
  const clientId = req.params.clientId;
  const client = clients.get(clientId);

  if (!client) {
    return res.status(404).json({ error: 'Client not connected' });
  }

  const downloadPath = path.join(__dirname, 'downloads', `${clientId}_file.txt`);
  
  if (!fs.existsSync(path.join(__dirname, 'downloads'))) {
    fs.mkdirSync(path.join(__dirname, 'downloads'));
  }

  const writeStream = fs.createWriteStream(downloadPath);
  global.activeDownloads.set(clientId, writeStream);

  client.send(JSON.stringify({ type: 'download_request' }));

  writeStream.on('finish', () => {
    res.json({ 
      success: true, 
      message: 'File downloaded successfully',
      path: downloadPath 
    });
  });

  writeStream.on('error', (error) => {
    res.status(500).json({ error: error.message });
  });
});

// API to get connected clients
app.get('/clients', (req, res) => {
  const clientList = Array.from(clients.keys());
  res.json({ clients: clientList });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on port ${WS_PORT}`);
  console.log(`Download File API: http://localhost:${PORT}/download/:clientId`);
});