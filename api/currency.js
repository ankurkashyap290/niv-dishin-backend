const express = require('express');
const router = express.Router();
const Currency = require('../models/Currency');
const { resultOk, resultError } = require('./helper');

router.post('/', function(req, res, next) {
  const data = req.body;
  const obj = {
    code: data.code,
    name: data.name,
  };
  Currency.findOne({ name: data.name })
    .then(currency => {
      if (currency) {
        res.json(resultError(null, `Currency already exists with name "${data.name}"`));
      } else {
        const len_code = obj.code.length;
        if (len_code != 3) {
          res.json(resultError(null, `Currency Code must be of 3 characters`));
        } else {
          Currency.create(obj)
            .then(currency1 => {
              res.json(resultOk(currency1.toJSON(), 'Currency is added successfully'));
            })
            .catch(err => {
              next(err);
            });
        }
      }
    })
    .catch(err => {
      next(err);
    });
});

router.post('/:id', function(req, res, next) {
  const data = req.body;
  const id = req.params.id;
  Currency.findOne({ _id: id })
    .then(currency => {
      if (currency) {
        Currency.findOne({ name: data.name, _id: { $ne: id } })
          .then(alreadyExistsCurrency => {
            if (alreadyExistsCurrency) {
              res.json(resultError(null, `Currency already exists with name "${data.name}"`));
            } else {
              const len_code = data.code.length;
              if (len_code != 3) {
                res.json(resultError(null, `Currency Code must be of 3 characters`));
              } else {
                currency.name = data.name;
                currency.code = data.code;
                currency
                  .save()
                  .then(currency1 => {
                    res.json(resultOk(currency1.toJSON(), 'Currency is edited successfully'));
                  })
                  .catch(err => {
                    next(err);
                  });
              }
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
  Currency.findOne({ _id: id })
    .then(currency => {
      if (currency) {
        currency
          .remove()
          .then(deletedCurrency => {
            if (deletedCurrency) {
              res.json(resultOk(deletedCurrency.toJSON(), 'Currency is deleted successfully'));
            }
          })
          .catch(err => {
            next(err);
          });
      } else {
        res.json(resultError(null, `Currency not found with "${id}" id`));
      }
    })
    .catch(err => {
      next(err);
    });
});

router.get('/', function(req, res, next) {
  let page = req.query.page || 1;
  let limit = req.query.limit || 10;
  Currency.paginate({}, { page, limit })
    .then(list => {
      res.json(resultOk(list.docs));
    })
    .catch(err => {
      next(err);
    });
});
module.exports = router;
