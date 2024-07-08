import { asyncHandler } from "../utils/asyncHandler.js";
import WatchHistory from "../models/watchHistory.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
// Add video to watch history

const addToWatchHistory = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    let watchHistory = await WatchHistory.findOne({ user: userId });

    if (!watchHistory) {
      console.log("No existing watch history found, creating new one", {
        userId,
      });
      watchHistory = new WatchHistory({ user: userId, videos: [] });
    }

    const videoIndex = watchHistory.videos.findIndex(
      (v) => v.video.toString() === videoId
    );
    if (videoIndex !== -1) {
      watchHistory.videos.splice(videoIndex, 1);
    }

    watchHistory.videos.unshift({ video: videoId, watchedAt: new Date() });

    await watchHistory.save();

    // Return only the newly added video details
    const addedVideo = watchHistory.videos[0];

    res.status(200).json({ success: true, data: addedVideo });
  } catch (error) {
    console.error("Error adding video to watch history", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get user's watch history with pagination
const getWatchHistory = asyncHandler(async (req, res) => {
  const {
    query = "",
    sortBy = "watchedAt",
    sortType = "desc",
    username,
    fullname,
  } = req.query;

  const userId = req.user._id;
  const sortOrder = sortType.toLowerCase() === "desc" ? -1 : 1;

  const matchConditions = [{ user: userId }];

  if (query) {
    matchConditions.push({
      $or: [
        { "videos.video.title": { $regex: query, $options: "i" } },
        { "videos.video.description": { $regex: query, $options: "i" } },
      ],
    });
  }

  if (username || fullname) {
    const userMatchConditions = {};
    if (username) {
      userMatchConditions.username = { $regex: username, $options: "i" };
    }
    if (fullname) {
      userMatchConditions.fullName = { $regex: fullname, $options: "i" };
    }

    const users = await User.find(userMatchConditions).select("_id").exec();
    const userIds = users.map((user) => user._id);
    matchConditions.push({ owner: { $in: userIds } });
  }

  const matchStage = {
    $match: { $and: matchConditions },
  };

  const lookupVideoStage = {
    $lookup: {
      from: "videos",
      localField: "videos.video",
      foreignField: "_id",
      as: "videos.videoDetails",
    },
  };

  const unwindVideoStage = {
    $unwind: {
      path: "$videos.videoDetails",
      preserveNullAndEmptyArrays: true,
    },
  };

  const lookupOwnerStage = {
    $lookup: {
      from: "users",
      localField: "videos.videoDetails.owner",
      foreignField: "_id",
      as: "videos.videoDetails.ownerDetails",
    },
  };

  const unwindOwnerStage = {
    $unwind: {
      path: "$videos.videoDetails.ownerDetails",
      preserveNullAndEmptyArrays: true,
    },
  };

  const projectStage = {
    $project: {
      _id: "$videos.videoDetails._id",
      title: "$videos.videoDetails.title",
      description: "$videos.videoDetails.description",
      duration: "$videos.videoDetails.duration",
      createdAt: "$videos.videoDetails.createdAt",
      views: "$videos.videoDetails.views",
      thumbnail: "$videos.videoDetails.thumbnail",
      videoFile: "$videos.videoDetails.videoFile",
      ownerAvatar: "$videos.videoDetails.ownerDetails.avatar",
      ownerFullName: "$videos.videoDetails.ownerDetails.fullName",
      ownerUsername: "$videos.videoDetails.ownerDetails.username",
    },
  };

  const sortStage = {
    $sort: {
      [sortBy]: sortOrder,
    },
  };

  try {
    const watchHistory = await WatchHistory.aggregate([
      matchStage,
      lookupVideoStage,
      unwindVideoStage,
      lookupOwnerStage,
      unwindOwnerStage,
      projectStage,
      sortStage,
    ]);

    res.status(200).json({
      statusCode: 200,
      watchHistory,
      message: "Watch history fetched successfully",
    });
  } catch (error) {
    console.error("Error while fetching watch history:", error);
    res.status(500).json({
      statusCode: 500,
      message: error.message || "Error while fetching watch history",
    });
  }
});

export { addToWatchHistory, getWatchHistory };
