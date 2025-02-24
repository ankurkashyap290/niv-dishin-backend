const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const { resultOk, resultError } = require('./helper');

router.post('/', function(req, res, next) {
  const data = req.body;
  const obj = {
    name: data.name,
    open_days: data.open_days,
    opening_hours: data.opening_hours,
    closing_hours: data.closing_hours,
  };
  Menu.find({ restaurant_id: data.restaurant_id })
    .then(restaurant => {
      if (restaurant.length > 0) {
        Menu.findOne({ name: data.name })
          .then(menu => {
            if (menu) {
              res.json(resultError(null, `Menu already exists with name "${data.name}"`));
            } else {
              Menu.create(obj)
                .then(menu => {
                  res.json(resultOk(menu.toJSON(), 'Menu is added successfully'));
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
        res.json(resultError(null, 'Restaurant Id is not valid '));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.post('/:id', function(req, res, next) {
  const data = req.body;
  const id = req.params.id;
  Menu.findOne({ _id: id })
    .then(menu => {
      if (menu) {
        Menu.find({ restaurant_id: data.restaurant_id })
          .then(restaurant => {
            if (restaurant.length > 0) {
              Menu.findOne({ name: data.name, _id: { $ne: id } })
                .then(alreadyExistsMenu => {
                  if (alreadyExistsMenu) {
                    res.json(resultError(null, `Menu already exists with name "${data.name}"`));
                  } else {
                    menu.name = data.name;
                    menu.open_days = data.open_days;
                    menu.opening_hours = data.opening_hours;
                    menu.closing_hours = data.closing_hours;
                    menu
                      .save()
                      .then(menu1 => {
                        res.json(resultOk(menu1.toJSON(), 'Menu is edited successfully'));
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
              res.json(resultError(null, 'Restaurant Id is not valid '));
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
  Menu.findOne({ _id: id })
    .then(menu => {
      if (menu) {
        menu
          .remove()
          .then(deletedMenu => {
            if (deletedMenu) {
              res.json(resultOk(deletedMenu.toJSON(), 'Menu is deleted successfully'));
            }
          })
          .catch(err => {
            next(err);
          });
      } else {
        res.json(resultError(null, `Menu not found with "${id}" id`));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.get('/', function(req, res, next) {
  let page = req.query.page || 1;
  let limit = req.query.limit || 10;
  Menu.paginate({}, { page, limit })
    .then(list => {
      res.json(resultOk(list.docs));
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
