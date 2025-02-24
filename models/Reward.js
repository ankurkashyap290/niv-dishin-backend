const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');
var lastModified = require('./plugins/lastModified');

const rewardSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rewardId: {
    type: Schema.Types.ObjectId,
    ref: 'SystemReward',
    required: true,
  },
  isRedeemed: {
    type: Boolean,
    default: false,
  },
  expiredOn: {
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
class RewardClass {}

rewardSchema.loadClass(RewardClass);

rewardSchema.plugin(mongoosePaginate);

rewardSchema.plugin(lastModified);

const Reward = mongoose.model('Reward', rewardSchema);

module.exports = Reward;
