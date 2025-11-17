const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SERVER_URL = 'ws://localhost:8080';
const CLIENT_ID = os.hostname();
const FILE_PATH = path.join(os.homedir(), 'file_to_download.txt');
const CHUNK_SIZE = 64 * 1024; // 64KB

let ws;

function connect() {
  ws = new WebSocket(SERVER_URL);

  ws.on('open', () => {
    console.log('Connected to server');
    ws.send(JSON.stringify({ type: 'register', clientId: CLIENT_ID }));
  });

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'registered') {
      console.log(`Registered as ${data.clientId}`);
    }

    if (data.type === 'download_request') {
      console.log('Server requested file download');
      sendFile();
    }
  });

  ws.on('close', () => {
    console.log('Disconnected from server. Reconnecting in 5s...');
    setTimeout(connect, 5000);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
}

function sendFile() {
  if (!fs.existsSync(FILE_PATH)) {
    ws.send(JSON.stringify({ 
      type: 'file_error', 
      clientId: CLIENT_ID,
      error: 'File not found' 
    }));
    return;
  }

  const stats = fs.statSync(FILE_PATH);
  console.log(`Sending file (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

  const readStream = fs.createReadStream(FILE_PATH, { highWaterMark: CHUNK_SIZE });

  readStream.on('data', (chunk) => {
    const base64Chunk = chunk.toString('base64');
    ws.send(JSON.stringify({ 
      type: 'file_chunk', 
      clientId: CLIENT_ID,
      chunk: base64Chunk 
    }));
  });

  readStream.on('end', () => {
    ws.send(JSON.stringify({ 
      type: 'file_complete', 
      clientId: CLIENT_ID 
    }));
    console.log('File sent successfully');
  });

  readStream.on('error', (error) => {
    ws.send(JSON.stringify({ 
      type: 'file_error', 
      clientId: CLIENT_ID,
      error: error.message 
    }));
    console.error('Error reading file:', error.message);
  });
}

connect();