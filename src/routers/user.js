const express = require('express');
const auth = require('../middleware/auth'); // Authentication middleware
const multer = require('multer'); // Handel file upload in Node.js
const sharp = require('sharp'); // Require sharp for easy image care, resizem and unify file types
const router = new express.Router();

// User instance inside the route handler, so we can interact with it.
const User = require('../models/user');

// Singup a user
router.post('/users', async (req, res) => { // Using route parameters, given by express, parts of the url that are used to capture dynamic values
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch(e) {
    res.status(400).send(e);
  }
})

// Login a user
router.post('/users/login', async (req,res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
      const user = await User.findByCredentials(email, password);
      const token = await user.generateAuthToken();
      res.send({ user, token});
  } catch (e){
      res.status(400).send(e);
  }
})

// Logout user
router.post('/users/logout', auth, async (req, res) => {
  try {
    // Filter out the token that is currently used in the session
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save();

    res.send();
  } catch {
    res.status(500).send();
  }
})

// Logout all sessions
router.post('/users/logoutAll' , auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.send();
  } catch {
    res.status(500).send();
  }
})

// Read my profile
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
})

// Update a user
router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body); // take the objects, and keys will return as an array of strings
  const allowedUpdates = ['name', 'age', 'password', 'email'];
  // Check if the updates user is preforming are fields we allowed as updates.
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates'})
  }

  try {
   // Choose to preforme manually, other method bypass mongoose and directly efect the DB
      updates.forEach(update => req.user[update] = req.body[update]);
      await req.user.save();
      res.send(req.user);
  } catch (e) {
      res.status(400).send(e);
  }
})

// Deleting a user
router.delete('/users/me', auth, async (req, res) => {
  try {
      await req.user.remove();
      res.send(req.user);
  } catch {
      res.status(500).send();
  }
})

// Using multer to config how we handle a picture, size and type.
const upload = multer({
  limits: {
    fileSize: 1500000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error('Please upload image with extensions: .jpg | .jpeg | .png'));
    }
      cb(undefined, true);
  }
})

// Upload avatar picture
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
  req.user.avatar = buffer;
  await req.user.save();
  res.send();

  // using all the 4 parameters even if not used, so express understands it's designed to handle errors
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message });
})

// Delete avatar picture
router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
})

// Fetching an avatar
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    // Setting up response header, the returned type in png because sharp unify all the pictures I proccess as png
    res.set('content-Type', 'image/png');
    res.send(user.avatar);
  } catch {
    res.status(404).send();
  }
})
module.exports = router;
