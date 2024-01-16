const mongoose = require("mongoose");

const MessagesSchema = mongoose.Schema({
  gameID: {
    type: String, // mongoose.Schema.Types.ObjectId not used here as it does not need to be populated
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Messages must have an author']
  },

  body: {
    type:String,
  },
});

const Message = mongoose.model("Message", MessagesSchema);

module.exports = Message;