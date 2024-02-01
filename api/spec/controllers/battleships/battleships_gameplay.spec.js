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

// This test file contains all the normal, non-auth and edgecases for gameplay
// TODO add winner getting points for the two win conditions.

// ==================== LAUNCH MISSILE ===========================
// token & no errors
// no token
// out of turn -- not in game & not your turn
// space already checked
// game already over

// =================== CHECK WIN ==============================
// token & no errors
// no token


// =================== GAMEPLAY TO WIN ===========================
