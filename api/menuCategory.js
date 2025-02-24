const express = require('express');
const router = express.Router();
const MenuCategory = require('../models/MenuCategory');
const { resultOk } = require('./helper');

router.post('/', function(req, res, next) {
  const data = req.body;
  const obj = {
    name: data.name,
    menus_id: data.menus_id,
  };

  MenuCategory.create(obj)
    .then(role => {
      res.json(resultOk(role.toJSON(), 'Menu Category is added successfully'));
    })
    .catch(err => {
      next(err);
    });
});
module.exports = router;
