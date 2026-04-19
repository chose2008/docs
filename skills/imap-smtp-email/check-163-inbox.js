const Imap = require('imap');

// IMAP ID for 163.com compatibility
const IMAP_ID = {
  name: 'openclaw',
  version: '1.0.0',
  vendor: 'netease',
  'support-email': 'kefu@188.com'
};

const config = {
  host: 'imap.163.com',
  port: 993,
  tls: true,
  user: 'chose2026@163.com',
  password: 'VSsntqWkW7ctSLD6',
  // Enable ID extension
  id: IMAP_ID
};

const imap = new Imap(config);

// Override the _login method to send ID first
const originalLogin = imap._login.bind(imap);
imap._login = function() {
  // Send ID command before login
  if (typeof this.id === 'function') {
    this.id(IMAP_ID, (err) => {
      if (err) {
        console.warn('ID command failed:', err.message);
      } else {
        console.log('ID command sent successfully');
      }
      // Proceed with login
      originalLogin();
    });
  } else {
    originalLogin();
  }
};

imap.once('ready', function() {
  console.log('Authenticated successfully');
  
  imap.openBox('INBOX', true, function(err, box) {
    if (err) {
      console.error('Open inbox error:', err.message);
      imap.end();
      return;
    }
    
    console.log('\n=== 收件箱状态 ===');
    console.log('总邮件数:', box.messages.total);
    console.log('新邮件数:', box.messages.new);
    
    if (box.messages.total === 0) {
      console.log('\n收件箱为空');
      imap.end();
      return;
    }
    
    // Search for unseen messages
    imap.search(['UNSEEN'], function(err, results) {
      if (err) {
        console.error('Search error:', err.message);
        imap.end();
        return;
      }
      
      const unreadCount = results ? results.length : 0;
      console.log('未读邮件数:', unreadCount);
      
      if (unreadCount === 0) {
        console.log('\n没有未读邮件');
        imap.end();
        return;
      }
      
      // Fetch recent 10 unread
      const toFetch = results.slice(-10);
      const f = imap.fetch(toFetch, { 
        bodies: 'HEADER.FIELDS (FROM SUBJECT DATE)',
        struct: false 
      });
      
      const emails = [];
      
      f.on('message', function(msg, seqno) {
        const email = { seqno };
        
        msg.on('body', function(stream) {
          let buffer = '';
          stream.on('data', chunk => buffer += chunk.toString('utf8'));
          stream.once('end', () => {
            const header = Imap.parseHeader(buffer);
            email.from = header.from?.[0] || '未知';
            email.subject = header.subject?.[0] || '无主题';
            email.date = header.date?.[0] || '未知';
          });
        });
        
        msg.once('end', () => emails.push(email));
      });
      
      f.once('error', err => console.error('Fetch error:', err.message));
      
      f.once('end', () => {
        console.log('\n=== 未读邮件列表（最近10封）===\n');
        emails.reverse().forEach((email, i) => {
          console.log(`${i+1}. ${email.subject}`);
          console.log(`   发件人: ${email.from}`);
          console.log(`   日期: ${email.date}`);
          console.log('');
        });
        imap.end();
      });
    });
  });
});

imap.once('error', function(err) {
  console.error('IMAP Error:', err.message);
});

imap.once('end', () => console.log('\n连接已关闭'));

console.log('Connecting to imap.163.com...');
imap.connect();