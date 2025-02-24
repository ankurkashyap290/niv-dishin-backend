const mongoose = require('mongoose');
const { Schema } = mongoose;

const menuCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  menus_id: {
    type: Schema.Types.ObjectId,
    ref: 'Menu',
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

class MenuCategoryClass {}

menuCategorySchema.loadClass(MenuCategoryClass);

const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);

module.exports = MenuCategory;
