const express = require('express');
const router = express.Router();
// const mongoose = require('mongoose');
const User = require('../models/User');
//const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');
const _ = require('lodash');
const Tag = require('../models/Tag');
const Review = require('../models/Review');
const { authenticateToken } = require('../misc/common');
const { resultOk } = require('./helper');
const mongoose = require('mongoose');

function updateDishReview(dish, fields, values, oldRecord, isCreate) {
  isCreate = isCreate || false;
  if (isCreate) {
    dish.totalReviews += 1;
  }

  for (let index = 0; index < fields.length; index++) {
    let fieldName = fields[index];
    let fieldValue = values[index];
    if (_.isNumber(dish[`total${_.upperFirst(fieldName)}`])) {
      dish[`total${_.upperFirst(fieldName)}`] -= oldRecord ? oldRecord[fieldName] : 0;
      dish[`total${_.upperFirst(fieldName)}`] += fieldValue;
    }
  }

  return dish.save();
}

function isValidReview(fieldName, fieldValue) {
  if (/ratings/i.test(fieldName)) {
    return fieldValue >= 1 && fieldValue <= 10;
  } else {
    return fieldValue.length > 0;
  }
}

function genOrUpdateReviewRecord(review, fields, values) {
  for (let index = 0; index < fields.length; index++) {
    let fieldName = fields[index];
    let fieldValue = values[index];
    if (!isValidReview(fieldName, fieldValue)) {
      throw new Error(`Invalid ${fieldName} value`);
    }
    review[fieldName] = fieldValue;
  }
  return review;
}

router.post('/update-dish-review', authenticateToken, function(req, res, next) {
  let { dishId, fieldName, fieldValue } = req.body;
  let user = req.decodedToken;
  let userId = user.user_id;
  if (!_.isArray(fieldName)) {
    fieldName = [fieldName];
    fieldValue = [fieldValue];
  }
  // validate user
  User.findById(userId)
    .then(user => {
      if (!user) {
        return next(new Error('Invalid User'));
      }
      Dish.findById(dishId)
        .then(dish => {
          if (!dish) {
            return next(new Error('Invalid Dish'));
          }

          Review.findOne({ userId, typeId: dishId, typeObject: 'Dish' })
            .then(review => {
              if (!review) {
                let reviewRecord = genOrUpdateReviewRecord(
                  { userId, typeId: dishId, typeObject: 'Dish' },
                  fieldName,
                  fieldValue
                );
                // create new review
                Review.create(reviewRecord)
                  .then(nreview => {
                    updateDishReview(dish, fieldName, fieldValue, null, true)
                      .then(updatedDish => {
                        let reviewObj = nreview.toJSON();
                        reviewObj.dish = {
                          avgValueForMoneyRatings:
                            updatedDish.totalValueForMoneyRatings / updatedDish.totalReviews,
                          avgTasteRatings: updatedDish.totalTasteRatings / updatedDish.totalReviews,
                          avgLookAndFeelRatings:
                            updatedDish.totalLookAndFeelRatings / updatedDish.totalReviews,
                          avgRatings: updatedDish.totalRatings / updatedDish.totalReviews,
                        };
                        res.json(resultOk({ ...reviewObj }, 'Review created successfully'));
                      })
                      .catch(next);
                  })
                  .catch(next);
              } else {
                //update review already given by user
                let oldRecord = { ...review.toJSON() };
                review = genOrUpdateReviewRecord(review, fieldName, fieldValue);
                review
                  .save()
                  .then(nreview => {
                    updateDishReview(dish, fieldName, fieldValue, oldRecord, false)
                      .then(updatedDish => {
                        let reviewObj = nreview.toJSON();
                        reviewObj.dish = {
                          avgValueForMoneyRatings:
                            updatedDish.totalValueForMoneyRatings / updatedDish.totalReviews,
                          avgTasteRatings: updatedDish.totalTasteRatings / updatedDish.totalReviews,
                          avgLookAndFeelRatings:
                            updatedDish.totalLookAndFeelRatings / updatedDish.totalReviews,
                          avgRatings: updatedDish.totalRatings / updatedDish.totalReviews,
                        };
                        res.json(resultOk({ ...reviewObj }, 'Review updated successfully'));
                      })
                      .catch(next);
                  })
                  .catch(next);
              }
            })
            .catch(next);
        })
        .catch(next);
    })
    .catch(next);
});

router.get('/my-dish-review/:slug', authenticateToken, function(req, res, next) {
  let user = req.decodedToken;
  let userId = user.user_id;
  let slug = req.params.slug;

  Dish.aggregate([
    {
      $match: {
        slug: slug,
      },
    },
    {
      $lookup: {
        from: 'reviews',
        let: { dish_id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$typeId', '$$dish_id'],
                  },
                  {
                    $eq: ['$userId', mongoose.Types.ObjectId(userId)],
                  },
                ],
              },
            },
          },
        ],
        as: 'reviews',
      },
    },
  ])
    .then(records => {
      console.log('REcords', records[0]);
      let dish = null;
      if (records.length) {
        dish = records[0];
      }
      Tag.find()
        .then(tags => {
          res.json(
            resultOk({ ...dish, systemTags: tags }, 'Fetched dish and its review given by me')
          );
        })
        .catch(next);
    })
    .catch(next);
});
/*eslint no-dupe-keys: [0]*/
router.get('/', authenticateToken, function(req, res, next) {
  let user = req.decodedToken;
  let userId = user.user_id;
  if (userId) {
    Review.find({ userId })
      .populate({
        path: 'typeId',
        populate: { path: 'restaurant_id', select: 'address' },
        populate: { path: 'images' },
      })
      .then(response => {
        res.json(resultOk(response));
      })
      .catch(err => {
        next(err);
      });
  } else {
    next('Not a valid user');
  }
});
module.exports = router;
