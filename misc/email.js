const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const appDir = path.dirname(require.main.filename);
const { emailSetting } = require('../config');

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: emailSetting.userName, // account.user, // generated ethereal user
    pass: emailSetting.pass, //'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', // account.pass, // generated ethereal password
  },
});

var readHTMLFile = function(path, callback) {
  fs.readFile(path, { encoding: 'utf-8' }, function(err, html) {
    if (err) {
      throw err;
    } else {
      callback(null, html);
    }
  });
};

// async..await is not allowed in global scope, must use a wrapper
class Email {
  static async sendEmail(from, to, subject, replacements) {
    readHTMLFile(appDir + '/email/user/verify-email.html', function(err, html) {
      const template = handlebars.compile(html);
      const TempReplacements = replacements;
      const htmlToSend = template(TempReplacements);
      const mailOptions = {
        from: from,
        to: to,
        subject: subject,
        html: htmlToSend,
        attachments: [
          {
            filename: 'logo.png',
            path:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAARCAYAAADOk8xKAAABA0lEQVRIS7WVURKDIAxEs1yserLak0kvRjphCBMQKjCjX7UT9+2GGEELVwjhJKINwA7Az0hgplhrQwgsvwEcAD4zGkNAZt6I6MXMR0fcS9IR+F+ggJj5Le1LiYg5hisuAPn/u9RdoIAkkRUjopikBjaSx7St2ibQDEV0fudaDNhuqMnWUF2ACkspuk57g1Kbdc4VjOImuTyTQ++c22cmUGv1ONS01SmAOu5pQKbfMWvOdsq2NgOtq5EzG0luAuRuZaB1VPd9RLxVU4WIHbPA5e3xz1C9lSJQh2V1XU0DqwPura+lztqlIEeF+r1ZUr15yGwrL8DrcnyCmjShX4IHGVb6+wNC77oBRzBkuAAAAABJRU5ErkJggg==',
            cid: 'logo@dishin.com', //same cid value as in the html img src
          },
        ],
      };
      transporter.sendMail(mailOptions, function(error, response) {
        if (error) {
          console.log('email error', error);
        } else {
          console.log('email response', response);
        }
      });
    });
    return true;
  }
}

module.exports = Email;
