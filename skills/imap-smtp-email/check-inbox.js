const Imap = require('imap');
const { simpleParser } = require('mailparser');

const imap = new Imap({
  host: 'imap.163.com',
  port: 993,
  tls: true,
  user: 'chose2026@163.com',
  password: 'VSsntqWkW7ctSLD6'
});

function openInbox(cb) {
  imap.openBox('INBOX', false, cb);
}

imap.once('ready', function() {
  openInbox(function(err, box) {
    if (err) {
      console.error('打开收件箱失败:', err);
      imap.end();
      return;
    }
    
    console.log('=== 收件箱状态 ===');
    console.log('总邮件数:', box.messages.total);
    console.log('未读邮件数:', box.messages.total - box.messages.new);
    
    if (box.messages.total === 0) {
      console.log('\n收件箱为空');
      imap.end();
      return;
    }
    
    // 获取最近的20封邮件
    const fetchOptions = {
      bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
      struct: true
    };
    
    const f = imap.seq.fetch(Math.max(1, box.messages.total - 19) + ':' + box.messages.total, fetchOptions);
    
    const emails = [];
    
    f.on('message', function(msg, seqno) {
      const email = { seqno: seqno };
      
      msg.on('body', function(stream, info) {
        let buffer = '';
        stream.on('data', function(chunk) {
          buffer += chunk.toString('utf8');
        });
        stream.once('end', function() {
          const header = Imap.parseHeader(buffer);
          email.from = header.from ? header.from[0] : '未知';
          email.subject = header.subject ? header.subject[0] : '无主题';
          email.date = header.date ? header.date[0] : '未知日期';
        });
      });
      
      msg.once('attributes', function(attrs) {
        email.flags = attrs.flags;
        email.unread = !attrs.flags.includes('\\Seen');
      });
      
      msg.once('end', function() {
        emails.push(email);
      });
    });
    
    f.once('error', function(err) {
      console.error('获取邮件失败:', err);
    });
    
    f.once('end', function() {
      console.log('\n=== 最近邮件列表（最新20封）===\n');
      
      // 按序号排序（最新的在前）
      emails.sort((a, b) => b.seqno - a.seqno);
      
      let unreadCount = 0;
      emails.forEach((email, index) => {
        const status = email.unread ? '[未读]' : '[已读]';
        if (email.unread) unreadCount++;
        
        console.log(`${index + 1}. ${status} ${email.subject}`);
        console.log(`   发件人: ${email.from}`);
        console.log(`   日期: ${email.date}`);
        console.log('');
      });
      
      console.log(`=== 统计 ===`);
      console.log(`显示邮件数: ${emails.length}`);
      console.log(`其中未读: ${unreadCount}`);
      
      imap.end();
    });
  });
});

imap.once('error', function(err) {
  console.error('IMAP连接错误:', err);
});

imap.once('end', function() {
  console.log('\n连接已关闭');
});

imap.connect();