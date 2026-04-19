const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 465,
  secure: true,
  auth: {
    user: 'chose2026@163.com',
    pass: 'VSsntqWkW7ctSLD6'
  }
});

const mailOptions = {
  from: 'chose2026@163.com',
  to: 'chose2008@qq.com',
  subject: '测试邮件 - OpenClaw 邮箱配置成功',
  text: '这是一封测试邮件。\n\n发送时间：' + new Date().toLocaleString() + '\n发送账号：chose2026@163.com\n\n如果收到这封邮件，说明 163.com 邮箱配置成功！'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('邮件发送失败：', error);
  } else {
    console.log('邮件发送成功！');
    console.log('Message ID:', info.messageId);
  }
});