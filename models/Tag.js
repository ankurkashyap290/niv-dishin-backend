const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');
var lastModified = require('./plugins/lastModified');

const tagSchema = new Schema({
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

class TagClass {}

tagSchema.loadClass(TagClass);

tagSchema.plugin(mongoosePaginate);

tagSchema.plugin(lastModified);

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
