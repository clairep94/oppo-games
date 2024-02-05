const express = require("express");
const router = express.Router();

const RockPaperScissorsController = require("../controllers/rockpaperscissors");

// Routes the HTTP request type with the API endpoint + ModelController.Method
router.get("/", RockPaperScissorsController.Index);
router.get("/:id", RockPaperScissorsController.FindByID);

router.post("/", RockPaperScissorsController.Create);

router.put("/:id/join", RockPaperScissorsController.Join);
router.put("/:id/forfeit", RockPaperScissorsController.Forfeit);
router.delete("/:id", RockPaperScissorsController.Delete);

router.put("/:id/submit_choice", RockPaperScissorsController.SubmitChoice);

module.exports = router;
