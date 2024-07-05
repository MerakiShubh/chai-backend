import express from "express";
import {
  addToWatchHistory,
  getWatchHistory,
} from "../controllers/watchHistory.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = express.Router();
router.use(verifyJWT);
router.route("/").get(getWatchHistory);
router.route("/:videoId").post(addToWatchHistory);

export default router;
