const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');

const testSchema = new Schema({
  name: String,
  price: Schema.Types.Number,
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

class TestClass {}

testSchema.loadClass(TestClass);

testSchema.plugin(mongoosePaginate);

const Test = mongoose.model('Test', testSchema);

module.exports = Test;
