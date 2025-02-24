/*eslint no-unused-vars: [0]*/
const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const Dish = require('../models/Dish');
const RestaurantLocation = require('../models/RestaurantLocation');
const Restaurant = require('../models/Restaurant');
const { resultOk, resultError } = require('./helper');

router.post('/', function(req, res, next) {
  const data = req.body;
  const obj = {
    name: data.name,
  };
  Tag.findOne({ name: data.name })
    .then(tag => {
      if (tag) {
        res.json(resultError(null, `Tag already exists with name "${data.name}"`));
      } else {
        Tag.create(obj)
          .then(tag => {
            res.json(resultOk(tag.toJSON(), 'Tag is added successfully'));
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
  Tag.findOne({ _id: id })
    .then(tag => {
      if (tag) {
        Tag.findOne({ name: data.name, _id: { $ne: id } })
          .then(alreadyExistsTag => {
            if (alreadyExistsTag) {
              res.json(resultError(null, `Tag already exists with name "${data.name}"`));
            } else {
              tag.name = data.name;
              tag
                .save()
                .then(tag1 => {
                  res.json(resultOk(tag1.toJSON(), 'Tag is edited successfully'));
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
  Tag.findOne({ _id: id })
    .then(tag => {
      if (tag) {
        tag
          .remove()
          .then(deletedTag => {
            if (deletedTag) {
              res.json(resultOk(deletedTag.toJSON(), 'Tag is deleted successfully'));
            }
          })
          .catch(err => {
            next(err);
          });
      } else {
        res.json(resultError(null, `Tag not found with "${id}" id`));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.get('/', function(req, res, next) {
  let page = req.query.page || 1;
  let limit = req.query.limit || 10;
  Tag.paginate({}, { page, limit })
    .then(list => {
      const result = resultOk(list.docs);
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

const getTmpCount = async function(model, id) {
  return await model.countDocuments({ tags: { $in: id } }).exec();
};

router.get('/with-counts', async function(req, res, next) {
  try {
    let tags = await Tag.find({}).exec();
    let newTags = [];

    for (const index in tags) {
      const tagObj = tags[index].toObject();
      tagObj.restCount = await getTmpCount(RestaurantLocation, tagObj._id);
      tagObj.dishCount = await getTmpCount(Dish, tagObj._id);
      newTags.push(tagObj);
    }
    res.json(resultOk(newTags, ''));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
