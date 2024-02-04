const express = require("express");
const router = express.Router();

const BattleshipsController = require("../controllers/battleships");

// Routes the HTTP request type with the API endpoint + ModelController.Method
router.get("/", BattleshipsController.Index);
router.get("/:id", BattleshipsController.FindByID);

router.post("/", BattleshipsController.Create);

router.put("/:id/join", BattleshipsController.Join);
router.put("/:id/forfeit", BattleshipsController.Forfeit);
router.delete("/:id", BattleshipsController.Delete);

router.put(
  "/:id/submit_placements",
  BattleshipsController.SubmitShipPlacements
);
router.put("/:id/reset_placements", BattleshipsController.ResetShipPlacements);
router.put("/:id/launch_missile", BattleshipsController.LaunchMissile);

module.exports = router;
