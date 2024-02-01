const app = require("../../../app");
const request = require("supertest");
require("../../mongodb_helper");
const Battleships = require('../../../models/battleships');
const User = require('../../../models/user');
const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

// initialise re-used variables
let token;
let user1;
let user2;
let user3;
let game;
let response;


// ==================== SUBMIT SHIPS PLACEMENTS ===========================
// For this method, the frontend will take in ALL of the user's proposed ship placements and enter them at the same time
// The frontend should HOLD the submission till both users submit?

// Error handling in FE? (overlapping ships)
// token & no errors
// no token
// need player two to join
// game already commenced/placement already finalised
// you're not in this game
// Incomplete ship placements


// ==================== RESET BOARD ============================
// token & no errors
// no token