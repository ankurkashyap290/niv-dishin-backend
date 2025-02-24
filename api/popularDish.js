const express = require('express');
const router = express.Router();
const PopularDish = require('../models/PopularDish');
const { resultOk, resultError } = require('./helper');

router.post('/', function(req, res, next) {
  const data = req.body;
  const obj = {
    name: data.name,
  };
  PopularDish.findOne({ name: data.name })
    .then(popularDish => {
      if (popularDish) {
        res.json(resultError(null, `PopularDish already exists with name "${data.name}"`));
      } else {
        PopularDish.create(obj)
          .then(popularDish => {
            res.json(resultOk(popularDish.toJSON(), 'PopularDish is added successfully'));
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

router.post('/:id', function(req, res, next) {
  const data = req.body;
  const id = req.params.id;
  PopularDish.findOne({ _id: id })
    .then(popularDish => {
      if (popularDish) {
        PopularDish.findOne({ name: data.name, _id: { $ne: id } })
          .then(alreadyExistsPopularDish => {
            if (alreadyExistsPopularDish) {
              res.json(resultError(null, `PopularDish already exists with name "${data.name}"`));
            } else {
              popularDish.name = data.name;
              popularDish
                .save()
                .then(popularDish1 => {
                  res.json(resultOk(popularDish1.toJSON(), 'PopularDish is edited successfully'));
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
});

router.delete('/:id', function(req, res, next) {
  const id = req.params.id;
  PopularDish.findOne({ _id: id })
    .then(popularDish => {
      if (popularDish) {
        popularDish
          .remove()
          .then(deletedPopularDish => {
            if (deletedPopularDish) {
              res.json(
                resultOk(deletedPopularDish.toJSON(), 'PopularDish is deleted successfully')
              );
            }
          })
          .catch(err => {
            next(err);
          });
      } else {
        res.json(resultError(null, `PopularDish not found with "${id}" id`));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.get('/', function(req, res, next) {
  let page = req.query.page || 1;
  let limit = req.query.limit || 10;
  PopularDish.paginate({}, { page, limit })
    .then(list => {
      res.json(resultOk(list.docs));
    })
    .catch(err => {
      next(err);
    });
});
module.exports = router;
