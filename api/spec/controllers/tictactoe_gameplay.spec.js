const app = require("../../app");
const request = require("supertest");
require("../mongodb_helper");
const TicTacToe = require('../../models/tictactoe');
const User = require('../../models/user');
const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

let token;

// =============== PLACE PIECE - NORMAL & MIDGAME ================= //

// =============== PLACE PIECE - OUT OF TURN ================= //

// =============== PLACE PIECE - ALREADY A PIECE THERE ================= //

// =============== PLACE PIECE - GAME OVER ================= //

// =============== PLACE PIECE - YOU'RE NOT IN THIS GAME ================= //

// =============== PLACE PIECE - GAMEPLAY TO CHECK WIN - X WIN ================= //

// =============== PLACE PIECE - GAMEPLAY TO CHECK WIN - O WIN ================= //

// =============== PLACE PIECE - GAMEPLAY TO DRAW ================= //