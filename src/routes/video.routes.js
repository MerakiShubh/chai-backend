import { Router } from "express";
import {
  getAllVideosWithSearchAndUploaderInfo,
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  incrementViewCount,
  getVideosByTag,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { incrementViewLimiter } from "../middlewares/rateLimiter.middleware.js";
const router = Router();

router.route("/").get(getAllVideosWithSearchAndUploaderInfo);
router.route("/:videoId").get(getVideoById);
router.route("/tag/:tag").get(getVideosByTag);
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);
router.route("/authUser").get(getAllVideos);
router
  .route("/:videoId")
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
router
  .route("/increment-views/:videoId")
  .post(incrementViewLimiter, incrementViewCount);

export default router;
