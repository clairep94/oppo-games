const express = require("express");
const router = express.Router();

const BattleshipsController = require("../controllers/battleships");

// Routes the HTTP request type with the API endpoint + ModelController.Method
router.get("/", BattleshipsController.Index);
router.get("/:id", BattleshipsController.FindByID);

router.post("/", BattleshipsController.Create);

// router.put("/:id/place_piece", BattleshipsController.PlacePiece);
router.put("/:id/join", BattleshipsController.Join);
router.put("/:id/forfeit", BattleshipsController.Forfeit);

router.delete("/:id", BattleshipsController.Delete);

module.exports = router;