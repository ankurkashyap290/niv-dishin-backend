const mongoose = require('mongoose');
//const _ = require('lodash');
const { Schema } = mongoose;

const userSchema = new Schema({
  first_name: {
    type: String,
    required: false,
  },
  last_name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive'],
  },
  sign_up_from: {
    type: String,
    enum: ['Self', 'Facebook', 'Google', 'Instagram', 'Twitter'],
  },
  last_logged_in: {
    type: Date,
  },
  provider_id: {
    type: String,
    required: false,
  },
  social_meta: {
    type: Map,
    of: String,
    required: false,
  },
  image: {
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

class UsersClass {
  static async signUp(
    firstName,
    lastName,
    email,
    password,
    role,
    status,
    signUpFrom,
    providerId = null,
    socialMeta = null,
    image = null
  ) {
    const obj = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: password,
      role: role,
      status: status,
      sign_up_from: signUpFrom,
      last_logged_in: '',
      provider_id: providerId,
      social_meta: socialMeta,
      image: image,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    return await this.create(obj);
  }
}

userSchema.loadClass(UsersClass);

const User = mongoose.model('User', userSchema);

module.exports = User;
