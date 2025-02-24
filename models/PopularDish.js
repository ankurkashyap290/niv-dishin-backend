const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');
var lastModified = require('./plugins/lastModified');

const populardishSchema = new Schema({
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

class populardishClass {
  static insertPopulardish(name) {
    return this.create({
      name: name,
      createdAt: new Date(),
      modifiedAt: new Date(),
    });
  }
}

populardishSchema.loadClass(populardishClass);

populardishSchema.plugin(mongoosePaginate);

populardishSchema.plugin(lastModified);

const PopularDish = mongoose.model('PopularDish', populardishSchema);

module.exports = PopularDish;
