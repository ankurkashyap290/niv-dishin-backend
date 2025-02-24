const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');
var lastModified = require('./plugins/lastModified');

const contributeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    require: true,
  },
  restaurantName: {
    type: String,
    required: true,
  },
  dishName: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  dishScore: {
    type: String,
    required: true,
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

class ContributeClass {}

contributeSchema.loadClass(ContributeClass);

contributeSchema.plugin(mongoosePaginate);

contributeSchema.plugin(lastModified);

const Contribute = mongoose.model('Contribute', contributeSchema);

module.exports = Contribute;
