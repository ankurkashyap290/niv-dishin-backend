const express = require('express');
const router = express.Router();
const SystemReward = require('../models/SystemReward');
const { resultOk, resultError } = require('./helper');

router.post('/', function(req, res, next) {
  const data = req.body;
  const obj = {
    rewardPoints: data.rewardPoints,
    rewardDesc: data.rewardDesc,
    deductPoints: data.deductPoints,
    expiredOn: data.expiredOn,
  };
  SystemReward.create(obj)
    .then(reward => {
      res.json(resultOk(reward.toJSON(), 'System Reward is added successfully'));
    })
    .catch(err => {
      next(err);
    });
});

router.post('/:id', function(req, res, next) {
  const data = req.body;
  const id = req.params.id;
  SystemReward.findOne({ _id: id })
    .then(reward => {
      if (reward) {
        reward.rewardPoints = data.rewardPoints;
        reward.rewardDesc = data.rewardDesc;
        reward.deductPoints = data.deductPoints;
        reward.expiredOn = data.expiredOn;
        reward
          .save()
          .then(reward1 => {
            res.json(resultOk(reward1.toJSON(), 'System Reward is edited successfully'));
          })
          .catch(err => {
            next(err);
          });
      }
    })
    .catch(err => {
      next(err);
    });
});

router.delete('/:id', function(req, res, next) {
  const id = req.params.id;
  SystemReward.findOne({ _id: id })
    .then(reward => {
      if (reward) {
        reward
          .remove()
          .then(deletedReward => {
            if (deletedReward) {
              res.json(resultOk(deletedReward.toJSON(), 'System Reward is deleted successfully'));
            }
          })
          .catch(err => {
            next(err);
          });
      } else {
        res.json(resultError(null, `System Reward not found with "${id}" id`));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.get('/', function(req, res, next) {
  let page = req.query.page || 1;
  let limit = req.query.limit || 10;
  SystemReward.paginate({}, { page, limit })
    .then(list => {
      res.json(resultOk(list.docs));
    })
    .catch(err => {
      next(err);
    });
});
module.exports = router;
