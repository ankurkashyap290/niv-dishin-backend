const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');
var lastModified = require('./plugins/lastModified');

const currencySchema = new Schema({
  code: String,
  name: String,
  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
  modifiedAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
});

class CurrencyClass {}

currencySchema.loadClass(CurrencyClass);

currencySchema.plugin(mongoosePaginate);

currencySchema.plugin(lastModified);

const Currency = mongoose.model('Currency', currencySchema);

module.exports = Currency;
