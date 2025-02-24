const mongoose = require('mongoose');
const { Schema } = mongoose;

const restaurantLocationSchema = new Schema({
  restaurant_id: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    require: true,
  },
  address: {
    type: String,
    required: true,
  },
  country: { type: String, require: false },
  open_days: [
    {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
  ],
  opening_hours: {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Sunday: [],
  },
  closing_hours: {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Sunday: [],
  },
  loc: {
    type: { type: String },
    coordinates: [],
  },
  tags: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Tag',
      require: true,
    },
  ],
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

restaurantLocationSchema.index({ loc: '2dsphere' });

class RestaurantLocationClass {}

restaurantLocationSchema.loadClass(RestaurantLocationClass);

const RestaurantLocation = mongoose.model('RestaurantLocation', restaurantLocationSchema);

module.exports = RestaurantLocation;
