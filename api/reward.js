const express = require('express');
const router = express.Router();
const Reward = require('../models/Reward');
const { resultOk, resultError } = require('./helper');
const Email = require('../misc/email');
const { emailSetting } = require('../config');
const { authenticateToken } = require('../misc/common');

router.post('/', function(req, res, next) {
  const data = req.body;
  const obj = {
    userId: data.userId,
    rewardId: data.rewardId,
    isRedeemed: false,
    expiredOn: data.expiredOn,
  };
  Reward.create(obj)
    .then(reward => {
      res.json(resultOk(reward.toJSON(), 'Reward is added successfully'));
    })
    .catch(err => {
      next(err);
    });
});

router.delete('/:id', function(req, res, next) {
  const id = req.params.id;
  Reward.findOne({ _id: id })
    .then(reward => {
      if (reward) {
        reward
          .remove()
          .then(deletedReward => {
            if (deletedReward) {
              res.json(resultOk(deletedReward.toJSON(), 'Reward is deleted successfully'));
            }
          })
          .catch(err => {
            next(err);
          });
      } else {
        res.json(resultError(null, `Reward not found with "${id}" id`));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.get('/', function(req, res, next) {
  let page = req.query.page || 1;
  let limit = req.query.limit || 10;
  Reward.paginate({}, { page, limit })
    .then(list => {
      res.json(resultOk(list.docs));
    })
    .catch(err => {
      next(err);
    });
});

router.post('/redeem/', authenticateToken, function(req, res, next) {
  const data = req.body;
  const user = req.decodedToken;
  const userId = user.user_id;
  const rewardId = data.rewardId;
  Reward.findOne({
    userId: userId,
    rewardId: rewardId,
    isRedeemed: false,
    expiredOn: { $gt: Date.now() },
  })
    .populate({ path: 'rewardId' })
    .then(reward => {
      if (reward) {
        reward.isRedeemed = true;
        reward
          .save()
          .then(() => {
            const from = emailSetting.emailAddress;
            const to = emailSetting.emailAddress;
            const subject = 'Congratulations for Reward';
            const replacements = {
              emailHeading: 'Congratulations',
              headingDesc: 'Just one more step..',
              name: user.userName,
              bodyFirstPrah: ' You have won your first prize',
              bodySecondPrah: 'Share more to get more prizes..',
            };
            Email.sendEmail(from, to, subject, replacements, null);
            res.json(resultOk(reward.toJSON(), 'Coupon is redeemed successfully'));
          })
          .catch(err => {
            next(err);
          });
      } else {
        res.json(resultError(null, `Coupon is invalid or expired`));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.get('/reward-list/', authenticateToken, function(req, res, next) {
  const user = req.decodedToken;
  const userId = user.user_id;
  Reward.find({ userId: userId, expiredOn: { $gt: Date.now() } })
    .then(list => {
      res.json(resultOk(list));
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
