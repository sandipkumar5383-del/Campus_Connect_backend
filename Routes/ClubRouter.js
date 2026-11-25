
const ClubController = require("../Controllers/ClubController");
const express = require("express");
const ClubRouter = express.Router();
const uploadClub = require("../Middleware/uploadClub");

ClubRouter.post("/createClub",uploadClub.single("image"),ClubController.createClub);
ClubRouter.get("/allClub", ClubController.allClub);
ClubRouter.get("/viewClub/:id", ClubController.viewClub);
ClubRouter.post("/joinClub/:id", ClubController.joinClub);
ClubRouter.delete("/deleteClub/:id", ClubController.deleteClub);
ClubRouter.delete("/leaveClub/:id", ClubController.leaveClub);
ClubRouter.post("/reportClub", ClubController.reportClub);
ClubRouter.get("/fetchAllClubs", ClubController.fetchAllClubs);
module.exports = ClubRouter;
