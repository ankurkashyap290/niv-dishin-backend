const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');
var lastModified = require('./plugins/lastModified');

const reservationRequestSchema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  name: {
    type: String,
    default: false,
  },
  phone: {
    type: String,
    default: false,
  },
  reservationDate: {
    type: Date,
    ref: 'SystemReward',
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
class ReservationRequestClass {}

reservationRequestSchema.loadClass(ReservationRequestClass);

reservationRequestSchema.plugin(mongoosePaginate);

reservationRequestSchema.plugin(lastModified);

const ReservationRequest = mongoose.model('ReservationRequest', reservationRequestSchema);

module.exports = ReservationRequest;
