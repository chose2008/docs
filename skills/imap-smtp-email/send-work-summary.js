const nodemailer = require('nodemailer');

const to = process.argv[2];
const subject = process.argv[3];
const body = process.argv[4];

if (!to || !subject || !body) {
    console.error('Usage: node send-work-summary.js <to> <subject> <body>');
    process.exit(1);
}

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
    to: to,
    subject: subject,
    text: body
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('邮件发送失败：', error);
        process.exit(1);
    } else {
        console.log('邮件发送成功！');
        console.log('Message ID:', info.messageId);
    }
});