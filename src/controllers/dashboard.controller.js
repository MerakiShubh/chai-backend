import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get the channel stats like total video views, total subscribers, total videos, total likes etc.
const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user._id;

  const totalVideos = await Video.countDocuments({ owner: channelId });

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  const totalLikes = await Like.countDocuments({
    video: { $in: await Video.find({ owner: channelId }).select("_id") },
  });

  const totalViews = await Video.aggregate([
    { $match: { owner: channelId } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);

  const stats = {
    totalVideos,
    totalSubscribers,
    totalLikes,
    totalViews: totalViews[0]?.totalViews || 0,
  };

  res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
});

// Get all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.user._id;

  const videos = await Video.find({ owner: channelId });

  res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
