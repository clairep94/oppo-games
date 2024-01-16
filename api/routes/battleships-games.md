const express = require("express");
const router = express.Router();

const BattleshipsGamesController = require("../controllers/battleships-games");

router.get("/", BattleshipsGamesController.Index);
router.get("/:id", BattleshipsGamesController.FindById);
router.post("/", BattleshipsGamesController.Create);
router.put("/:id/:op", BattleshipsGamesController.DoGameAction);
//router.delete("/:id", BattleshipsGamesController.Delete); // No need to implement yet

module.exports = router;
