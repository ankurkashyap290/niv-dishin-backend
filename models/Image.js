const mongoose = require('mongoose');
const { Schema } = mongoose;

const imageSchema = new Schema({
  name: {
    type: String,
    required: false,
  },
  path: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Restaurant', 'Dish', 'User', 'Review'],
  },
  isLogo: {
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

class ImageClass {}

imageSchema.loadClass(ImageClass);

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
