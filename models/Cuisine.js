const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');
var lastModified = require('./plugins/lastModified');

const cuisineSchema = new Schema({
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

class CuisineClass {}

cuisineSchema.loadClass(CuisineClass);

cuisineSchema.plugin(mongoosePaginate);

cuisineSchema.plugin(lastModified);

const Cuisine = mongoose.model('Cuisine', cuisineSchema);

module.exports = Cuisine;
