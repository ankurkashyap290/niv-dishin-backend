const mongoose = require('mongoose');
const { Schema } = mongoose;
var lastModified = require('./plugins/lastModified');

const restaurantSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: false,
  },
  cuisines: [{ type: Schema.Types.ObjectId, ref: 'Cuisine', required: true }],
  kosher_halal: {
    type: String,
    required: true,
    enum: ['None', 'Kosher', 'Halal'],
  },
  images: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Image',
      require: false,
    },
  ],
  isSponsored: {
    type: Boolean,
    required: true,
    default: false,
  },
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

class RestaurantClass {}

restaurantSchema.loadClass(RestaurantClass);
restaurantSchema.plugin(lastModified);
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
