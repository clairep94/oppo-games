const express = require("express");
const router = express.Router();

const RockPaperScissorsGamesController = require("../controllers/rock-paper-scissors-games");

router.get("/", RockPaperScissorsGamesController.Index);
router.get("/:id", RockPaperScissorsGamesController.FindById);
router.post("/", RockPaperScissorsGamesController.Create);
router.put("/:id/:op", RockPaperScissorsGamesController.DoGameAction);
//router.delete("/:id", RockPaperScissorsGamesController.Delete); // No need to implement yet

module.exports = router;
