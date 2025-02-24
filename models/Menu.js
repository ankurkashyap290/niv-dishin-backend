const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');
var lastModified = require('./plugins/lastModified');

const menuSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  category: [
    {
      type: Schema.Types.ObjectId,
      ref: 'MenuCategory',
      require: true,
    },
  ],

  restaurant_id: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    require: true,
  },
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

class MenuClass {}

menuSchema.loadClass(MenuClass);

menuSchema.plugin(mongoosePaginate);

menuSchema.plugin(lastModified);

const Menu = mongoose.model('Menu', menuSchema);

module.exports = Menu;
