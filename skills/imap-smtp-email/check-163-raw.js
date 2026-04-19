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
let unreadSeq = [];
let currentSeq = null;

function nextTag() {
  return `A${++tagCounter}`;
}

function sendCommand(socket, tag, cmd) {
  const line = `${tag} ${cmd}\r\n`;
  console.log('>>', line.trim());
  socket.write(line);
}

const socket = tls.connect(PORT, HOST, { rejectUnauthorized: true });

socket.on('connect', () => {
  console.log('TLS connected to', HOST);
});

socket.on('data', (data) => {
  buffer += data.toString('utf8');
  
  let idx;
  while ((idx = buffer.indexOf('\r\n')) !== -1) {
    const line = buffer.substring(0, idx);
    buffer = buffer.substring(idx + 2);
    
    console.log('<<', line);
    
    if (state === 'greeting' && line.includes('OK')) {
      const idParams = Object.entries(IMAP_ID)
        .map(([k, v]) => `"${k}" "${v}"`)
        .join(' ');
      sendCommand(socket, nextTag(), `ID (${idParams})`);
      state = 'id';
    }
    else if (state === 'id' && line.startsWith('A1')) {
      if (line.includes('OK')) {
        console.log('ID accepted');
        sendCommand(socket, nextTag(), `LOGIN "${USER}" "${PASS}"`);
        state = 'login';
      } else {
        sendCommand(socket, nextTag(), `LOGIN "${USER}" "${PASS}"`);
        state = 'login';
      }
    }
    else if (state === 'login' && line.startsWith('A2')) {
      if (line.includes('OK')) {
        console.log('Login successful');
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
        console.log('\n=== 收件箱状态 ===');
        console.log('总邮件数:', existsMatch[1]);
      }
      if (line.startsWith('A3') && line.includes('OK')) {
        sendCommand(socket, nextTag(), 'SEARCH UNSEEN');
        state = 'search';
      }
    }
    else if (state === 'search' && line.startsWith('A4')) {
      // Parse SEARCH results - format: * SEARCH 1 3 5 or just * SEARCH
      if (line.includes('SEARCH')) {
        // Extract sequence numbers after SEARCH
        const searchMatch = line.match(/\* SEARCH\s*(\d.*)?$/);
        if (searchMatch && searchMatch[1]) {
          unreadSeq = searchMatch[1].trim().split(/\s+/).filter(s => s && !isNaN(s));
        } else {
          unreadSeq = [];
        }
        
        console.log('未读邮件数:', unreadSeq.length);
        
        if (unreadSeq.length === 0) {
          console.log('\n没有未读邮件');
          sendCommand(socket, nextTag(), 'LOGOUT');
          state = 'logout';
        } else {
          currentSeq = unreadSeq[0];
          console.log('获取邮件序号:', currentSeq);
          // Use simple FETCH with sequence number
          sendCommand(socket, nextTag(), `FETCH ${currentSeq} (BODY[HEADER.FIELDS (FROM SUBJECT DATE)])`);
          state = 'fetch';
        }
      } else if (line.includes('OK')) {
        console.log('没有未读邮件');
        sendCommand(socket, nextTag(), 'LOGOUT');
        state = 'logout';
      }
    }
    else if (state === 'fetch') {
      // Look for FETCH response with email data
      if (line.includes('FETCH') && line.includes('BODY')) {
        // Multi-line response starting
        emailData = '';
      }
      
      // Collect header data
      if (line.includes('Subject:') || line.includes('From:') || line.includes('Date:')) {
        emailData += line + '\n';
      }
      
      if (line.startsWith('A5') && line.includes('OK')) {
        // Parse collected email data
        const subjectMatch = emailData.match(/Subject:\s*([^\n]+)/i);
        const fromMatch = emailData.match(/From:\s*([^\n]+)/i);
        const dateMatch = emailData.match(/Date:\s*([^\n]+)/i);
        
        console.log('\n=== 未读邮件详情 ===');
        console.log(`主题: ${subjectMatch ? subjectMatch[1].trim() : '无主题'}`);
        console.log(`发件人: ${fromMatch ? fromMatch[1].trim() : '未知'}`);
        console.log(`日期: ${dateMatch ? dateMatch[1].trim() : '未知'}`);
        
        sendCommand(socket, nextTag(), 'LOGOUT');
        state = 'logout';
      }
    }
    else if (state === 'logout' && line.includes('OK')) {
      console.log('\n=== 检查完成 ===');
      socket.end();
    }
    else if (line.includes('NO') || line.includes('BAD')) {
      console.error('Error:', line);
      socket.end();
    }
  }
});

socket.on('error', (err) => {
  console.error('Socket error:', err.message);
});

socket.on('end', () => {
  console.log('Connection closed');
  process.exit(0);
});

console.log('Connecting to', HOST, '...');