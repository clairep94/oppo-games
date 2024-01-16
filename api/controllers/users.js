const User = require("../models/user");
const TokenGenerator = require("../lib/token_generator");


const UsersController = {
  // CREATE A USER ===============
  Create: (req, res) => {
    const user = new User(req.body);
    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          res.status(500).json({message: 'Duplicate email or username'})
        }
        else {
          res.status(400).json({message: 'Bad request'})
        } 
      }
      else {
        res.status(201).json({ user: user, message: 'OK' });
      }
    });
  },

  // GET ALL USERS FROM DB ===============
  Index: (req, res) => {
    User.find()
    .exec((err, users) => {
      if(err) {
        throw err;
      }
      const token = TokenGenerator.jsonwebtoken(req.user_id)
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.status(200).json({users: users, token: token})
    });
  },

  // GET SINGLE USER BY ID ===============
  FindByID: (req, res) => {
    // This function takes the ID from the params in the URL. eg. :id
    User.findById(req.params.id)
    .exec((err, user) => {
      if (err) {
        throw err;
      }
      const token = TokenGenerator.jsonwebtoken(req.user_id)
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.status(200).json({ user: user, token: token });
    });
  },

  
};

module.exports = UsersController;
