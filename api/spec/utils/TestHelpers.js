const app = require("../../app");
const request = require("supertest");
require("../mongodb_helper");
const User = require("../../models/user");
const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

// Note: this is WIP, still a bit disorganised. Use when helpful, but ignore if less readable than longhand tests

// RESPONSE CODE
const expectResponseCode = async (response, expectedCode) => {
  expect(response.statusCode).toBe(expectedCode);
};

// AUTH ERROR (NO TOKEN):
const expectAuthError = async (response) => {
  expect(response.statusCode).toBe(401);
  expect(response.body).toEqual({ message: "auth error" });
  expect(response.body.token).toEqual(undefined);
};

// ERROR MESSAGE & RESPONSE CODE COMBO:
const expectError = async (response, expectedCode, expectedErrorMessage) => {
  expect(response.statusCode).toBe(expectedCode);
  expect(response.body.error).toBe(expectedErrorMessage);
};

// NEW TOKEN
const expectNewToken = async (response, token) => {
  expect(response.body.token).toBeDefined();
  let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
  let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
  expect(newPayload.iat > originalPayload.iat).toEqual(true);
};

// NO TOKEN
const expectNoToken = async (response) => {
  expect(response.body.token).toEqual(undefined);
};

// RESPONSE BODY
const expectResponseBody = async (response, expectedResponseBody) => {
  expect(response.body.game).toMatchObject(expectedResponseBody);
};

// NO RESPONSE BODY
const expectNoGameObject = async (response) => {
  expect(response.body.game).toEqual(undefined);
};

// HELPER FOR RESPONS COMPARISON
const expectedGameObject = (
  playerOneUsername,
  playerTwoUsername,
  title,
  endpoint,
  gameProperties,
  turn = 0,
  winner = [],
  finished = false
) => {
  return {
    playerOne: {
      username: playerOneUsername,
      points: 0,
    },
    playerTwo: {
      username: playerTwoUsername,
      points: 0,
    },
    title: title,
    endpoint: endpoint,
    turn: turn,
    winner: winner,
    finished: finished,
    ...gameProperties,
  };
};

module.exports = {
  expectedGameObject,
  expectNewToken,
  expectResponseBody,
  expectResponseCode,
  expectNoGameObject,
  expectNoToken,
  expectError,
  expectAuthError,
};
