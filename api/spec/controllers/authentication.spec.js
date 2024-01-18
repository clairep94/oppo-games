const app = require("../../app");
const request = require("supertest");
require("../mongodb_helper");
const User = require('../../models/user');

describe("/tokens", () => {
  // ARRANGE
  beforeAll(async () => {
    const user = new User({ email: "test@test.com", username: "testacc123", password: "12345678" })
    await user.save()
  });

  afterAll(async () => {
    await User.deleteMany({})
  })

  test("a token is returned when creds are valid", async () => {
    // ACT
    let response = await request(app)
      .post("/tokens")
      .send({email: "test@test.com", username: "testacc123", password: "12345678"})

    // ASSERT
    expect(response.status).toEqual(201)
    expect(response.body.token).not.toEqual(undefined)
    expect(response.body.message).toEqual("OK")
  })


  test("a token is not returned when creds are invalid", async () => {
    // ACT
    let response = await request(app)
      .post("/tokens")
      .send({email: "test@test.com", username: "testacc123", password: "1234"})
    
    // ASSERT
    expect(response.status).toEqual(401)
    expect(response.body.token).toEqual(undefined)
    expect(response.body.message).toEqual("auth error")
  })
})