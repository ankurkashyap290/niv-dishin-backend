/*eslint no-unused-vars: [0]*/
const express = require('express');
const router = express.Router();
const Dish = require('../models/Dish');
const Menu = require('../models/Menu');
const Review = require('../models/Review');
const Image = require('../models/Image');
const User = require('../models/User');
const Tag = require('../models/Tag');

const { resultOk, resultError } = require('./helper');

router.post('/', function(req, res, next) {
  const data = req.body;
  const obj = {
    name: data.name,
    restaurant_id: data.restaurant_id,
    menus: data.menus,
    description: data.description,
    price: data.price,
    currency: data.currency,
    calories: data.calories,
    popular_name: data.popular_name,
    tags: data.tags,
    images: data.images,
  };

  Menu.find({ restaurant_id: data.restaurant_id, _id: { $in: data.menus } })
    .then(menu => {
      if (menu.length > 0) {
        Dish.find({
          restaurant_id: data.restaurant_id,
          menus: { $in: data.menus },
          name: data.name,
        })
          .then(dish => {
            if (dish.length === 0) {
              Dish.create(obj)
                .then(dish => {
                  res.json(resultOk(dish.toJSON(), 'Dish is added successfully'));
                })
                .catch(err => {
                  next(err);
                });
            } else {
              res.json(resultError(null, `Dish already exists with name "${data.name}"`));
            }
          })
          .catch(err => {
            next(err);
          });
      } else {
        res.json(resultError(null, 'Restaurant Id or Menu Id is not valid '));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.post('/:id', function(req, res, next) {
  const data = req.body;
  const id = req.params.id;
  Dish.findOne({ _id: id })
    .then(dish => {
      if (dish) {
        Menu.find({ restaurant_id: data.restaurant_id, _id: { $in: data.menus } })
          .then(menu => {
            if (menu.length > 0) {
              Dish.find({
                name: data.name,
                restaurant_id: data.restaurant_id,
                menus: { $in: data.menus },
                _id: { $ne: id },
              })
                .then(alreadyExistDish => {
                  if (alreadyExistDish.length > 0) {
                    res.json(resultError(null, `Dish already exists with name "${data.name}"`));
                  } else {
                    dish.name = data.name;
                    dish.menus = data.menus;
                    dish.description = data.description;
                    dish.price = data.price;
                    dish.currency = data.currency;
                    dish.calories = data.calories;
                    dish.popular_name = data.popular_name;
                    dish.tags = data.tags;
                    dish.images = data.images;
                    dish
                      .save()
                      .then(dish1 => {
                        res.json(resultOk(dish1.toJSON(), 'Dish is edited successfully'));
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
              res.json(resultError(null, 'Restaurant Id or Menu Id is not valid'));
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
});

router.delete('/:id', function(req, res, next) {
  const id = req.params.id;
  Dish.findOne({ _id: id })
    .then(dish => {
      if (dish) {
        dish
          .remove()
          .then(deletedDish => {
            if (deletedDish) {
              res.json(resultOk(deletedDish.toJSON(), 'Dish is deleted successfully'));
            }
          })
          .catch(err => {
            next(err);
          });
      } else {
        res.json(resultError(null, `Dish not found with "${id}" id`));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.get('/:slug', function(req, res, next) {
  let slug = req.params.slug;
  let includesData = (req.query.includes || '').split(',');
  Dish.findOne({ slug: slug })
    .populate({ path: 'restaurant_id' })
    .populate({ path: 'menus' })
    .populate({ path: 'tags' })
    .populate({ path: 'currency' })
    .populate({ path: 'images' })
    .then(dish => {
      if (dish) {
        let dishRec = dish.toJSON();
        dishRec.avgValueForMoneyRating = dishRec.totalValueForMoneyRatings / dishRec.totalReviews;
        dishRec.avgTasteRating = dishRec.totalTasteRatings / dishRec.totalReviews;
        dishRec.avgLookAndFeelRating = dishRec.totalLookAndFeelRatings / dishRec.totalReviews;
        dishRec.avgRating = dishRec.totalRatings / dishRec.totalReviews;

        let allPromise = [];
        if (includesData.includes('reviews')) {
          allPromise.push(
            Review.find({ typeId: dish._id, typeObject: 'Dish' })
              .populate({ path: 'userId' })
              .populate({ path: 'images', select: 'path name' })
              .limit(5)
          );
        }
        if (includesData.includes('system_tags')) {
          allPromise.push(Tag.find({}));
        }
        if (allPromise.length) {
          Promise.all(allPromise)
            .then(result => {
              let dataObj = { dish: dishRec };
              if (includesData.includes('reviews')) {
                dataObj['reviews'] = result[0];
              }
              if (includesData.includes('system_tags')) {
                dataObj['systemTags'] = result.length == 2 ? result[1] : result[0];
              }
              res.json(resultOk(dataObj, 'Fetched Data'));
            })
            .catch(err => {
              next(err);
            });
        } else {
          res.json(resultOk({ dish }, 'Fetched Data'));
        }
      } else {
        res.json(resultError(null, `Dish not found with "${name}" id`));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.get('/', function(req, res, next) {
  let page = req.query.page || 1;
  let limit = req.query.limit || 10;
  Dish.paginate({}, { page, limit })
    .then(list => {
      const result = resultOk(list.docs);
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});
module.exports = router;
