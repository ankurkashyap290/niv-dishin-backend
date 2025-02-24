const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const { resultOk, resultError } = require('./helper');

router.post('/', function(req, res, next) {
  const data = req.body;
  const obj = {
    name: data.name,
  };
  Role.findOne({ name: data.name })
    .then(role => {
      if (role) {
        res.json(resultError(null, `Role already exists with name "${data.name}"`));
      } else {
        Role.create(obj)
          .then(role => {
            res.json(resultOk(role.toJSON(), 'Role is added successfully'));
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
  Role.findOne({ _id: id })
    .then(role => {
      if (role) {
        Role.findOne({ name: data.name, _id: { $ne: id } })
          .then(alreadyExistsRole => {
            if (alreadyExistsRole) {
              res.json(resultError(null, `Role already exists with name "${data.name}"`));
            } else {
              role.name = data.name;
              role
                .save()
                .then(role1 => {
                  res.json(resultOk(role1.toJSON(), 'Role is edited successfully'));
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
  Role.findOne({ _id: id })
    .then(role => {
      if (role) {
        role
          .remove()
          .then(deletedRole => {
            if (deletedRole) {
              res.json(resultOk(deletedRole.toJSON(), 'Role is deleted successfully'));
            }
          })
          .catch(err => {
            next(err);
          });
      } else {
        res.json(resultError(null, `Role not found with "${id}" id`));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.get('/', function(req, res, next) {
  let page = req.query.page || 1;
  let limit = req.query.limit || 10;
  Role.paginate({}, { page, limit })
    .then(list => {
      res.json(resultOk(list.docs));
    })
    .catch(err => {
      next(err);
    });
});
module.exports = router;
