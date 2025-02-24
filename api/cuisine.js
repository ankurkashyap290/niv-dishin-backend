const express = require('express');
const router = express.Router();
const Cuisine = require('../models/Cuisine');
const { resultOk, resultError } = require('./helper');

router.post('/', function(req, res, next) {
  const data = req.body;
  const obj = {
    name: data.name,
  };
  Cuisine.findOne({ name: data.name })
    .then(cuisine => {
      if (cuisine) {
        res.json(resultError(null, `Cuisine already exists with name "${data.name}"`));
      } else {
        Cuisine.create(obj)
          .then(cuisine => {
            res.json(resultOk(cuisine.toJSON(), 'Cuisine is added successfully'));
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
  Cuisine.findOne({ _id: id })
    .then(cuisine => {
      if (cuisine) {
        Cuisine.findOne({ name: data.name, _id: { $ne: id } })
          .then(alreadyExistsCuisine => {
            if (alreadyExistsCuisine) {
              res.json(resultError(null, `Cuisine already exists with name "${data.name}"`));
            } else {
              cuisine.name = data.name;
              cuisine
                .save()
                .then(cuisine1 => {
                  res.json(resultOk(cuisine1.toJSON(), 'Cuisine is edited successfully'));
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
  Cuisine.findOne({ _id: id })
    .then(cuisine => {
      if (cuisine) {
        cuisine
          .remove()
          .then(deletedCuisine => {
            if (deletedCuisine) {
              res.json(resultOk(deletedCuisine.toJSON(), 'Cuisine is deleted successfully'));
            }
          })
          .catch(err => {
            next(err);
          });
      } else {
        res.json(resultError(null, `Cuisine not found with "${id}" id`));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.get('/', function(req, res, next) {
  let page = req.query.page || 1;
  let limit = req.query.limit || 10;
  Cuisine.paginate({}, { page, limit })
    .then(list => {
      res.json(resultOk(list.docs));
    })
    .catch(err => {
      next(err);
    });
});
module.exports = router;
