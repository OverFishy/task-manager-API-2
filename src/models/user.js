const mongoose = require('mongoose'); // Require mongoose
const validator = require('validator'); // Require validator
const bcrypt = require('bcryptjs'); // Require bcryptjs, use for encrypting passowrds
const jwt = require('jsonwebtoken'); // Require jsonwebtokens, for creating and using json web tokens
const Task = require('./task');

// Creating schema first in order to use mongoose middlewear, an ability to run code in verious stages of
// dealing with data, before saving, after reading etc
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    trim: true
  },
  age: {
    type: Number,
    default: 0,
    valdiate(value) {
      if(value < 0) {
        throw new Erorr('Age must me a positive number')
      }
    }
  },
  email: {
    type: String,
    require: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email unvalid')
      }
    }
  },
  password: {
    type: String,
    require: true,
    trim: true,
    minlength: 7,
    validate(value) {
      if(value.toLowerCase().includes('password')) {
        throw new Error('Password cannot be "password"');
      }
    }
  },
  avatar: {
    type: Buffer
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Virtual property, not actual data stored in database, rather a realitionship between 2 enteties (user & task)
userSchema.virtual('tasks', {
  ref: 'Task', // name of model is connected to
  localField: '_id', // what binds the local data with the ref foreignField
  foreignField: 'owner' // name of field on foreign entety (task)
})

// Gets called when even user object is being strigfy - when ever express is sending back the object
// to the user. Using toJSON I can control what is the outcome of an object stringy outcome, with the return value
// I return from here.
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
}

// Creating a jason web token to be send to logged user
// Methods to be accessed thourght the instances
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
}

// Creating a method to be accessed directly on the model
// Static to be accessed throught the model
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) { // Email is unrecognised in database
    throw new Error('Unable to login')
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) { // Password dose not match email
    throw new Error('unable to login')
  }

  return user;
}

// Hash the plain text password
userSchema.pre('save', async function (next) {
  const user = this;

  // Checks if a specific field is being modified
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next() // Alerting we are done, and the even may continue
})

// Delete user tasks when a user is removed
userSchema.pre('remove', async function (next) {
  const user = this;
  await Task.deleteMany( {owner: user._id} )
  next();
})

const User = mongoose.model('User', userSchema)

module.exports = User; // exporting User model
