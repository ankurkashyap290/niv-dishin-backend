const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');
var lastModified = require('./plugins/lastModified');

const reviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ratings: Number,
  description: String,
  typeId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'typeObject',
  },
  typeObject: {
    type: String,
    required: true,
    enum: ['Restaurant', 'Dish'],
  },
  valueForMoneyRatings: {
    type: Number,
    required: false,
  },
  tasteRatings: {
    type: Number,
    required: false,
  },
  lookAndFeelRatings: {
    type: Number,
    required: false,
  },
  likes: {
    type: String,
    required: false,
  },
  dislikes: {
    type: String,
    required: false,
  },
  totalReviews: {
    type: Number,
    required: false,
  },
  images: {
    type: Schema.Types.ObjectId,
    ref: 'Image',
    require: false,
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
class ReviewClass {}

reviewSchema.loadClass(ReviewClass);

reviewSchema.plugin(mongoosePaginate);

reviewSchema.plugin(lastModified);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
