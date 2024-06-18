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
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
