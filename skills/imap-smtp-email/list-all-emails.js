const tls = require('tls');

const IMAP_ID = {
  name: 'openclaw',
  version: '1.0.0',
  vendor: 'netease',
  'support-email': 'kefu@188.com'
};

const HOST = 'imap.163.com';
const PORT = 993;
const USER = 'chose2026@163.com';
const PASS = 'VSsntqWkW7ctSLD6';

let buffer = '';
let state = 'greeting';
let tagCounter = 0;
let totalMessages = 0;
let emails = [];
let currentFetch = null;

function nextTag() {
  return `A${++tagCounter}`;
}

function sendCommand(socket, tag, cmd) {
  const line = `${tag} ${cmd}\r\n`;
  socket.write(line);
}

const socket = tls.connect(PORT, HOST, { rejectUnauthorized: true });

socket.on('data', (data) => {
  buffer += data.toString('utf8');
  
  // Check for complete lines
  let idx;
  while ((idx = buffer.indexOf('\r\n')) !== -1) {
    const line = buffer.substring(0, idx);
    buffer = buffer.substring(idx + 2);
    
    if (state === 'greeting' && line.includes('OK')) {
      const idParams = Object.entries(IMAP_ID)
        .map(([k, v]) => `"${k}" "${v}"`)
        .join(' ');
      sendCommand(socket, nextTag(), `ID (${idParams})`);
      state = 'id';
    }
    else if (state === 'id' && line.startsWith('A1') && line.includes('OK')) {
      sendCommand(socket, nextTag(), `LOGIN "${USER}" "${PASS}"`);
      state = 'login';
    }
    else if (state === 'login' && line.startsWith('A2')) {
      if (line.includes('OK')) {
        sendCommand(socket, nextTag(), 'EXAMINE INBOX');
        state = 'examine';
      } else {
        console.error('Login failed:', line);
        socket.end();
      }
    }
    else if (state === 'examine') {
      const existsMatch = line.match(/(\d+) EXISTS/);
      if (existsMatch) {
        totalMessages = parseInt(existsMatch[1]);
        console.log('总邮件数:', totalMessages);
      }
      if (line.startsWith('A3') && line.includes('OK')) {
        if (totalMessages > 0) {
          // Fetch last 10 messages
          const start = Math.max(1, totalMessages - 9);
          sendCommand(socket, nextTag(), `FETCH ${start}:${totalMessages} (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])`);
          state = 'fetch';
        } else {
          console.log('收件箱为空');
          sendCommand(socket, nextTag(), 'LOGOUT');
          state = 'logout';
        }
      }
    }
    else if (state === 'fetch') {
      // Parse FETCH responses
      const fetchMatch = line.match(/\* (\d+) FETCH/);
      if (fetchMatch) {
        currentFetch = { seq: parseInt(fetchMatch[1]) };
      }
      
      if (line.includes('Subject:')) {
        if (currentFetch) currentFetch.subject = line.replace(/Subject:\s*/i, '');
      }
      if (line.includes('From:')) {
        if (currentFetch) currentFetch.from = line.replace(/From:\s*/i, '');
      }
      if (line.includes('Date:')) {
        if (currentFetch) currentFetch.date = line.replace(/Date:\s*/i, '');
      }
      
      if (line.startsWith('A4') && line.includes('OK')) {
        // Output results
        console.log('\n=== 邮件列表（最近10封）===\n');
        emails.reverse().forEach((email, i) => {
          console.log(`${i+1}. ${email.subject || '无主题'}`);
          console.log(`   发件人: ${email.from || '未知'}`);
          console.log(`   日期: ${email.date || '未知'}`);
          console.log('');
        });
        
        sendCommand(socket, nextTag(), 'LOGOUT');
        state = 'logout';
      }
    }
    else if (state === 'logout' && line.includes('OK')) {
      socket.end();
    }
    else if (line.includes('NO') || line.includes('BAD')) {
      console.error('Error:', line);
    }
  }
});

socket.on('end', () => {
  process.exit(0);
});

socket.connect(PORT, HOST);