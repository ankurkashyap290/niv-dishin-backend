const bcrypt = require('bcrypt');
const { resultError } = require('../api/helper');
const jwt = require('../misc/jwt_token');

class Common {
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async checkPassword(password, confirmPassword) {
    let passwordError = null;
    if (password != confirmPassword) {
      passwordError = 'Password and Confirm password must be the same';
    } else if (password.length < 7) {
      passwordError = 'Password must be 8 character long';
    }
    return passwordError;
  }

  static async emailValidate(email) {
    let emailError = null;
    if (!email) {
      emailError = 'Email is required';
    } else {
      /*eslint no-useless-escape: 0*/
      let matchFormat = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (!matchFormat.test(email)) {
        emailError = 'invalid Email';
      } else {
        emailError = null;
      }
    }
    return emailError;
  }
}

const authenticateToken = function(req, res, next) {
  let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
  if (token.startsWith('Bearer')) {
    // Remove Bearer from string
    token = token.slice(7, token.length);
  }
  try {
    if (token) {
      jwt
        .verifyJWTToken(token)
        .then(response => {
          req.decodedToken = response;
          next();
        })
        .catch(() => {
          res.json(resultError(null, 'Token is invalid'));
        });
    } else {
      return res.json(resultError(null, 'Auth token is not supplied'));
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { Common, authenticateToken };
