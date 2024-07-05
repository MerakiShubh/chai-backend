import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
  const user = req.user?._id;
  const videoLike = await Like.findOne({
    video: videoId,
    likedBy: user,
  });
  if (videoLike) {
    await videoLike.deleteOne();
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Video is unliked successfully"));
  } else {
    await Like.create({
      video: videoId,
      likedBy: user,
    });
    res
      .status(200)
      .json(new ApiResponse(200, videoLike, "Video liked successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Invalid comment id");

  const user = req.user?._id;
  const commentLike = await Like.findOne({
    comment: commentId,
    likedBy: user,
  });

  if (commentLike) {
    await commentLike.deleteOne();
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment unliked successfully"));
  } else {
    const newLike = await Like.create({
      comment: commentId,
      likedBy: user,
    });
    res
      .status(200)
      .json(new ApiResponse(200, newLike, "Comment liked successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id");

  const user = req.user?._id;
  const tweetLike = await Like.findOne({
    tweet: tweetId,
    likedBy: user,
  });

  if (tweetLike) {
    await tweetLike.deleteOne();
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet unliked successfully"));
  } else {
    const newLike = await Like.create({
      tweet: tweetId,
      likedBy: user,
    });
    res
      .status(200)
      .json(new ApiResponse(200, newLike, "Tweet liked successfully"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  // Get the authenticated user's ID
  const userId = req.user._id;

  try {
    const likedVideos = await Like.find({
      likedBy: userId,
      video: { $exists: true },
    })
      .populate({
        path: "video",
        populate: {
          path: "owner",
          select: "fullName avatar username", // Select the fields you want from the owner
        },
      })
      .exec();

    if (!likedVideos.length) throw new ApiError(404, "No liked videos found");

    const response = likedVideos
      .map((like) => {
        if (!like.video) {
          console.error("Video is null for like:", like);
          return null;
        }
        return {
          ...like.toObject(),
          video: {
            ...like.video.toObject(),
            ownerInfo: like.video.owner ? like.video.owner.toObject() : null, // Add ownerInfo to video object
          },
        };
      })
      .filter((item) => item !== null);

    res
      .status(200)
      .json(
        new ApiResponse(200, response, "Liked videos fetched successfully")
      );
  } catch (error) {
    console.error("Error fetching liked videos:", error);
    res
      .status(500)
      .json(new ApiResponse(500, null, "Failed to fetch liked videos"));
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
