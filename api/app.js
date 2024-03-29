const createError = require("http-errors");
const express = require("express");
const path = require("path");
const logger = require("morgan");
const JWT = require("jsonwebtoken");

const authenticationRouter = require("./routes/authentication");
const signUpRouter = require("./routes/signup");
const usersRouter = require("./routes/users");
const messagesRouter = require("./routes/messages");

const tictactoeRouter = require("./routes/tictactoe");
const battleshipsRouter = require("./routes/battleships");
const rockpaperscissorsRouter = require("./routes/rockpaperscissors");

const app = express();

// setup for receiving JSON
app.use(express.json());

app.use(logger("dev"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
// app.use(cors())

// middleware function to check for valid tokens
const tokenChecker = (req, res, next) => {
  let token;
  const authHeader = req.get("Authorization");

  if (authHeader) {
    token = authHeader.slice(7);
  }

  JWT.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      console.log(err);
      res.status(401).json({ message: "auth error" });
    } else {
      req.user_id = payload.user_id;
      next();
    }
  });
};

// route setup
// token checker:
app.use("/tokens", authenticationRouter);

// routes with no authentication:
app.use("/signup", signUpRouter);

// routes with authentication:
app.use("/messages", tokenChecker, messagesRouter);
app.use("/users", tokenChecker, usersRouter);
app.use("/tictactoe", tokenChecker, tictactoeRouter);
app.use("/battleships", tokenChecker, battleshipsRouter);
app.use("/rockpaperscissors", tokenChecker, rockpaperscissorsRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // respond with details of the error
  res.status(err.status || 500).json({ message: "server error" });
});

module.exports = app;
