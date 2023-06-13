// Mongoose - mongodb object modeling for node.js.
// It helps making CRUD options a bit more elegant, and help me set limitation on the data
// I collect, for example, I can make a user model, there a name will expected to be a string, and
// obligatory.

// Behind the scenes mongoose is lavreging mongoDB optionalities

const mongoose = require('mongoose'); // require mongoose

mongoose.connect(process.env.MONGODB_URL) //connecting to db
