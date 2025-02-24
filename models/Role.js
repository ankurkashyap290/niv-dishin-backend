const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');
var lastModified = require('./plugins/lastModified');

const roleSchema = new Schema({
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

class RolesClass {}

roleSchema.loadClass(RolesClass);

roleSchema.plugin(mongoosePaginate);

roleSchema.plugin(lastModified);

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
