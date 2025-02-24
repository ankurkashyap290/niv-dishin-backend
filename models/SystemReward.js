const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');
var lastModified = require('./plugins/lastModified');

const systemRewardSchema = new Schema({
  rewardPoints: Number,
  rewardDesc: String,
  deductPoints: Number,
  expiredOn: {
    type: Date,
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
class SystemRewardClass {}

systemRewardSchema.loadClass(SystemRewardClass);

systemRewardSchema.plugin(mongoosePaginate);

systemRewardSchema.plugin(lastModified);

const SystemReward = mongoose.model('SystemReward', systemRewardSchema);

module.exports = SystemReward;
