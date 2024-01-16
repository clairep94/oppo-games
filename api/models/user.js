const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  points: { 
    type: Number, 
    default: 0 
  },
  // gameHistory: {
  //   type: [{
  //     gameType: { type: String, enum: ['TicTacToe', 'RockPaperScissors', 'BattleShips'] }, // TODO,
  //     game: { type: mongoose.Schema.Types.ObjectId, ref: 'gameType' }
  //   }],
  //   default: []
  // }
  //TODO add gameHistory: list of games
},
{
  timestamps: true,
}
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
