## File Downloader
Download file using web socket protocol built with Express JS. Client can establish connection to server without having IP exposed publicly.

## How to run
Ensure nodejs and npm is installed. Example:
```
sudo apt install nodejs npm
```

### Server
Run server by pulling the code
```bash
npm install
node server.js
```

### CLient
Adjust the server IP accordingly in the client file
```
const SERVER_URL = 'ws://{SERVER_IP}:8080';
```

Run client by pulling the code and run:
```bash
npm install
node client.js
```

### Download File
Once client is connected, You can download file by hitting the GET endpoint on
```
http://localhost:8080
```

## Example

<img width="2030" height="1172" alt="Screenshot 2025-11-17 234237" src="https://github.com/user-attachments/assets/e9853229-2125-4b7f-b2b0-e523231b1bd2" />
