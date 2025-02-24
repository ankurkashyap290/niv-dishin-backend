/*eslint no-unused-vars: [0]*/
const express = require('express');
const router = express.Router();
const jwt = require('../misc/jwt_token');
const User = require('../models/User');
const Role = require('../models/Role');
const UserToken = require('../models/UserToken');
const Image = require('../models/Image');
const { Common, authenticateToken } = require('../misc/common');
const Email = require('../misc/email');
const { APP_URL, emailSetting } = require('../config');
const { resultOk, resultError } = require('./helper');

const registerNewUser = async function(userData, suppressAlreadyExists = false) {
  const firstName = userData.firstName;
  const lastName = userData.lastName;
  const email = userData.email;
  const password = await Common.hashPassword(userData.password);
  const status = userData.status || 'pending';
  const signUpFrom = userData.signUpWith || 'Self';
  const providerId = userData.providerId || +new Date();
  const roleName = userData.role || 'Regular User';
  const socialMeta = userData.socialMeta || '';
  const image = userData.image || '';
  let validateUserCondition = { email: email };
  let user = await User.findOne(validateUserCondition);
  let response = {};
  if (!user) {
    const role = await Role.findOne({ name: roleName }, '_id');
    if (image) {
      const imageExixtes = await Image.findOne({ name: email });

      if (imageExixtes) {
        response = await Image.updateOne({ name: email }, { path: image });

        if (response.ok) {
          response = imageExixtes;
        } else {
          response = null;
        }
      } else {
        const ImageObj = {
          name: email,
          path: image,
          isLogo: false,
          type: 'User',
        };
        response = await Image.create(ImageObj);
      }
    }

    user = await User.signUp(
      firstName,
      lastName,
      email,
      password,
      role._id,
      status,
      signUpFrom,
      providerId,
      socialMeta,
      response._id || null
    );
  } else if (suppressAlreadyExists) {
    throw new Error('User Already Exists');
  } else {
    if (signUpFrom != 'Self' && signUpFrom != user.sign_up_from) {
      if (image) {
        const imageExixtes = await Image.findOne({ name: email });

        if (imageExixtes) {
          response = await Image.updateOne({ name: email }, { path: image });
          if (response.ok) {
            response = imageExixtes;
          } else {
            response = null;
          }
        } else {
          const ImageObj = {
            name: email,
            path: image,
            isLogo: false,
            type: 'User',
          };
          response = await Image.create(ImageObj);
        }
      }
      await User.updateOne(
        { email: email },
        {
          sign_up_from: signUpFrom,
          provider_id: providerId,
          social_meta: socialMeta,
          image: response._id || null,
          modifiedAt: new Date(),
        }
      );
      user = await User.findOne({ email: email });
    } else {
      let today = new Date();
      let tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      user.modifiedAt = tomorrow;
      return user;
    }
  }
  return user;
};

const signInUser = async function(userData) {
  const email = userData.email;
  const password = userData.password;
  const validUser = await User.findOne({ email: email }).populate({ path: 'image' });
  if (validUser) {
    const checkPassword = await Common.comparePassword(password, validUser.password);
    if (checkPassword) {
      await User.updateOne({ _id: validUser._id }, { last_logged_in: new Date() });
      return validUser;
    } else {
      throw new Error('Invalid email or password!');
    }
  } else {
    throw new Error('Invalid email or password!');
  }
};

const sendVerifyEmail = async function(req, userId, email, name = null) {
  let verifyEmailToken = await Common.hashPassword(email);
  let verifyEmailTokenExpire = new Date().setFullYear(new Date().getFullYear() + 1);
  await UserToken.deleteMany({ user_id: userId, token_type: 'verify-email-token' });
  let tokenInsert = await UserToken.insertToken(
    userId,
    'verify-email-token',
    verifyEmailToken,
    verifyEmailTokenExpire
  );
  let userName = '';
  if (name) {
    userName = `${name},`;
  }
  if (tokenInsert) {
    const from = emailSetting.emailAddress;
    const to = email;
    const subject = 'verify your email';
    const replacements = {
      emailHeading: 'Welcome to Dishin!',
      headingDesc: 'Just one more step..',
      name: userName,
      bodyFirstPrah: ` before you go out and eat something new, please verify your email address.`,
      bodySecondPrah:
        'If you did not create a Dishin account using this address, please contact us at support@dishin.com.',
      buttonHref: APP_URL + '/verify-email?token=' + verifyEmailToken,
      buttonText: 'Verify your account',
      verifyText: 'Or verify using link:',
      verifyHref: APP_URL + '/verify-email?token=' + verifyEmailToken,
      verifyLinkText: APP_URL + '/verify-email?token=' + verifyEmailToken,
    };
    const emailSend = await Email.sendEmail(from, to, subject, replacements, null);
    return true;
  } else {
    throw new Error('Saving token to db failed');
  }
};

const getUsers = async function() {
  return await User.find();
};

router.post('/sign-up', async function(req, res, next) {
  const userData = req.body;
  let result = {};
  try {
    let emailError = await Common.emailValidate(userData.email);
    let passwordError = await Common.checkPassword(userData.password, userData.confirmPassword);
    if (!emailError && !passwordError) {
      let user = await registerNewUser(userData, true);
      if (user) {
        await User.updateOne({ _id: user._id }, { last_logged_in: new Date() });
        let token = jwt.genJWTToken(user);
        await sendVerifyEmail(req, user._id, user.email, user.firstName);
        result = {
          status: 'ok',
          info: 'User successfully created!',
          data: {
            token: token,
          },
        };
      } else {
        result = { status: 'error', data: null, info: 'User not created!' };
      }
      return res.json(result);
    } else {
      result = { status: 'error', data: null, info: 'Invalid email or password!' };
    }
  } catch (error) {
    next(error);
  }
});

router.post('/sign-in', async function(req, res, next) {
  const userData = req.body;
  let result = {};
  try {
    const user = await signInUser(userData);
    if (user) {
      const roleName = await Role.findOne({ _id: user.role }, 'name');
      user.roleName = roleName.name;
      let token = jwt.genJWTToken(user);
      let tokenExpires = Date.now() + 24 * 3600000;
      result = {
        status: 'ok',
        info: 'Logged in successfully!',
        data: {
          token: token,
        },
      };
      await UserToken.insertToken(user._id, 'login-token', token, tokenExpires);
    } else {
      result = {
        status: 'error',
        error: 'Invalid email or password!',
      };
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/social-sign-in', async function(req, res, next) {
  const userData = req.body;
  let result = {};
  try {
    let emailError = await Common.emailValidate(userData.email);
    if (!emailError) {
      let user = await registerNewUser(userData, false);
      if (user) {
        let socialUser = await User.findOne({ email: user.email }).populate({ path: 'image' });

        let token = await jwt.genJWTToken(socialUser);
        if (user.createdAt - user.modifiedAt === 0) {
          await sendVerifyEmail(req, user._id, user.email, user.first_name);
        }
        result = {
          status: 'ok',
          info: 'Logged in successfully!',
          data: {
            token: token,
          },
        };
        await User.updateOne({ _id: user._id }, { last_logged_in: new Date() });
        return res.json(result);
      } else {
        result = { status: 'error', data: null, info: 'User not created!' };
      }
    } else {
      result = { status: 'error', data: null, info: 'Invalid email or password!' };
    }
  } catch (err) {
    next(err);
  }
});

router.get('/get-all-users', async function(req, res, next) {
  let users = null;
  let result = {};
  try {
    users = await getUsers();
    result = {
      status: 'ok',
      info: 'Available users',
      data: {
        users: users,
      },
    };
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/forget-password', async function(req, res, next) {
  let data = req.body;
  let result = {};
  let user = null;
  try {
    user = await User.findOne({ email: data.email });
    if (user) {
      let resetPasswordToken = await Common.hashPassword(data.email);
      let resetPasswordExpires = Date.now() + 3600000;
      await UserToken.deleteMany({ user_id: user._id, token_type: 'reset-token' });
      await UserToken.insertToken(
        user._id,
        'reset-token',
        resetPasswordToken,
        resetPasswordExpires
      );
      const from = emailSetting.emailAddress;
      const to = data.email;
      const subject = 'Forgot password';
      let name = '';

      if (user.first_name) {
        name = `${user.first_name},`;
      }
      const replacements = {
        emailHeading: 'Forgot your password?',
        headingDesc: '',
        name: name,
        bodyFirstPrah: ` we got a request to reset your Dishin password.`,
        bodySecondPrah: '',
        buttonHref: APP_URL + '/reset-password?token=' + resetPasswordToken,
        buttonText: 'Reset my password',
        verifyText: '',
        verifyHref: '',
        verifyLinkText: '',
        forgotPasswordDesc: `If you ignore this message, your password won't be changed. If you didn't request a password reset, `,
        tellUs: 'tell us',
        tellUsHref: '',
      };
      const emailSend = await Email.sendEmail(from, to, subject, replacements);
      if (emailSend) {
        result = {
          status: 'ok',
          info: `To reset password a link is send to your email ${to} `,
          data: {},
        };
      }
    } else {
      result = {
        status: 'error',
        error: 'Email not found!',
      };
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/update', authenticateToken, async function(req, res, next) {
  let data = req.body;
  let user = req.decodedToken;
  let id = user.user_id;
  let query = {};
  try {
    if (data.fieldName === 'userName') {
      query = { first_name: data.fieldValue };
    }
    if (data.fieldName === 'email') {
      query = { email: data.fieldValue };
    }
    if (data.fieldName === 'password') {
      let password = await Common.hashPassword(data.fieldValue);
      query = { password };
    }
    if (data.fieldName === 'email') {
      User.find(query)
        .then(response => {
          if (response.length > 0) {
            res.json(resultError(null, 'User already Exists'));
          } else {
            User.updateOne({ _id: id }, query)
              .then(result => {
                if (result.ok) {
                  User.findOne({ _id: id })
                    .populate({ path: 'image' })
                    .then(user => {
                      let token = jwt.genJWTToken(user);

                      res.json(resultOk({ token: token }, 'User updated successfully'));
                    })
                    .catch(err => {
                      next(err);
                    });
                }
              })
              .catch(err => {
                next(err);
              });
          }
        })
        .catch(err => {
          next(err);
        });
    } else {
      User.updateOne({ _id: id }, query)
        .then(result => {
          if (result.ok) {
            User.findOne({ _id: id })
              .populate({ path: 'image' })
              .then(user => {
                let token = jwt.genJWTToken(user);

                res.json(resultOk({ token: token }, 'User updated successfully'));
              })
              .catch(err => {
                next(err);
              });
          }
        })
        .catch(err => {
          next(err);
        });
    }
  } catch (err) {
    next(err);
  }
});

router.get('/', function(req, res, next) {
  // let page = req.query.page || 1;
  // let limit = req.query.limit || 10;
  // User.paginate({}, { page, limit })
  //   .then(list => {
  //     res.json(resultOk(list.docs));
  //   })
  //   .catch(err => {
  //     next(err);
  //   });
  res.json(resultOk({ name: 'Test 1' }));
});

module.exports = router;
