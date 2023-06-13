const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    // The user ID is embeded in the token, so we grab it to find the user.
    // Looking if the user still have this authentication token still stored.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({_id: decoded._id, 'tokens.token': token});

    if (!user) {
      throw new Error();
    }

    req.token = token; //Storing token  on request, to know which sessions the user is loggin out of
    req.user = user; // Storing user on request, to avoid redundent search
    next();
  } catch {
    res.status(404).send({ error: 'Please Authenticate.' });
  }
}

module.exports = auth;
