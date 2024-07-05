import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import {
  deletefromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideosWithSearchAndUploaderInfo = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    username,
    fullname,
  } = req.query;

  const sortOrder = sortType.toLowerCase() === "desc" ? -1 : 1;
  const userId = req.user?._id;

  const matchConditions = [];

  if (query) {
    matchConditions.push({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
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

  const matchStage =
    matchConditions.length > 0
      ? { $match: { $and: matchConditions } }
      : { $match: {} };

  const lookupUserStage = {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "ownerInfo",
    },
  };

  const unwindUserStage = {
    $unwind: {
      path: "$ownerInfo",
      preserveNullAndEmptyArrays: true,
    },
  };

  const lookupLikeStage = {
    $lookup: {
      from: "likes",
      let: { videoId: "$_id", userId },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$video", "$$videoId"] },
                { $eq: ["$likedBy", "$$userId"] },
              ],
            },
          },
        },
      ],
      as: "likeInfo",
    },
  };

  const addFieldsStage = {
    $addFields: {
      isLikedByUser: {
        $cond: {
          if: { $gt: [{ $size: "$likeInfo" }, 0] },
          then: true,
          else: false,
        },
      },
    },
  };

  const projectStage = {
    $project: {
      videoFile: 1,
      thumbnail: 1,
      title: 1,
      description: 1,
      duration: 1,
      views: 1,
      isPublished: 1,
      createdAt: 1,
      updatedAt: 1,
      owner: 1,
      "ownerInfo.fullName": 1,
      "ownerInfo.avatar": 1,
      "ownerInfo.username": 1,
      isLikedByUser: 1,
    },
  };

  const sortStage = {
    $sort: {
      [sortBy]: sortOrder,
    },
  };

  const myAggregate = Video.aggregate([
    matchStage,
    lookupUserStage,
    unwindUserStage,
    lookupLikeStage,
    addFieldsStage,
    projectStage,
    sortStage,
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customLabels: {
      totalDocs: "totalResults",
      docs: "videos",
      limit: "pageSize",
      page: "currentPage",
      totalPages: "totalPages",
      nextPage: "nextPage",
      prevPage: "prevPage",
      pagingCounter: "pagingCounter",
      meta: "pagination",
    },
  };

  try {
    const result = await Video.aggregatePaginate(myAggregate, options);
    res.status(200).json({
      statusCode: 200,
      result,
      message: "Videos fetched successfully",
    });
  } catch (error) {
    console.error("Error while fetching videos:", error);
    res.status(500).json({
      statusCode: 500,
      message: error.message || "Error while fetching videos from database",
    });
  }
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const matchStage = {
    $match: {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
      ...(userId && { owner: new mongoose.Types.ObjectId(userId) }),
    },
  };

  const lookupStage = {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "ownerInfo",
    },
  };

  const unwindStage = {
    $unwind: {
      path: "$ownerInfo",
      preserveNullAndEmptyArrays: true,
    },
  };

  const projectStage = {
    $project: {
      videoFile: 1,
      thumbnail: 1,
      title: 1,
      description: 1,
      duration: 1,
      views: 1,
      isPublished: 1,
      createdAt: 1,
      updatedAt: 1,
      owner: 1,
      "ownerInfo.fullName": 1,
      "ownerInfo.avatar": 1,
    },
  };

  const sortStage = {
    $sort: {
      [sortBy]: sortType === "desc" ? -1 : 1,
    },
  };

  const myAggregate = Video.aggregate([
    matchStage,
    lookupStage,
    unwindStage,
    projectStage,
    sortStage,
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customLabels: {
      totalDocs: "totalResults",
      docs: "videos",
      limit: "pageSize",
      page: "currentPage",
      totalPages: "totalPages",
      nextPage: "nextPage",
      prevPage: "prevPage",
      pagingCounter: "pagingCounter",
      meta: "pagination",
    },
  };

  try {
    const result = await Video.aggregatePaginate(myAggregate, options);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Videos fetched successfully"));
  } catch (error) {
    throw new ApiError(
      501,
      error?.message || "Error while fetching videos from database"
    );
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    // Debugging: Log req.files

    const videoFile = req.files?.videoFile?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (
      !title?.trim() ||
      !description?.trim() ||
      !videoFile ||
      !thumbnailFile
    ) {
      throw new ApiError(
        400,
        "Title, description, video, and thumbnail are required"
      );
    }

    const videoLocalFilePath = videoFile.path;
    const thumbnailLocalFilePath = thumbnailFile.path;

    const [uploadVideo, uploadThumbnail] = await Promise.all([
      uploadOnCloudinary(videoLocalFilePath),
      uploadOnCloudinary(thumbnailLocalFilePath),
    ]);

    const { url: videoUrl, duration } = uploadVideo;
    const { url: thumbnailUrl } = uploadThumbnail;

    const video = await Video.create({
      title,
      description,
      videoFile: videoUrl || " ",
      thumbnail: thumbnailUrl || " ",
      owner: req.user?._id,
      duration,
      tags: tags ? tags.split(",") : [],
    });

    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video uploaded successfully"));
  } catch (error) {
    console.error(error);
    throw new ApiError(
      500,
      error?.message ||
        "Error while uploading files on Cloudinary or database error"
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!videoId) throw new ApiError(400, "Video id is required");

  try {
    const videoObjectId = new mongoose.Types.ObjectId(videoId);
    const video = await Video.findById(videoObjectId)
      .populate({
        path: "owner",
        select: "fullName avatar username",
      })
      .exec();

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    const isLikedByUser = await Like.exists({
      video: videoObjectId,
      likedBy: userId,
    });

    const response = {
      ...video.toObject(),
      isLikedByUser: !!isLikedByUser,
    };

    res
      .status(200)
      .json(new ApiResponse(200, response, "Video fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error occurred while getting video from database"
    );
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  // TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  const thumbnailLocalFilePath = req.file?.path;

  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "Video id is required");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(400, "Video doesn't exist");

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(404, "Not authorized to update video");
  }

  const updateData = {};

  if (title) updateData.title = title;
  if (description) updateData.description = description;

  if (thumbnailLocalFilePath) {
    const oldVideoThumbnailUrl = video.thumbnail;
    if (oldVideoThumbnailUrl) {
      const publicId = oldVideoThumbnailUrl.split("/").pop().split(".")[0];
      deletefromCloudinary(publicId);
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalFilePath);
    updateData.thumbnail = thumbnail.url;
  }

  try {
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedVideo) {
      throw new ApiError(500, "Error occurred while updating video");
    }

    res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Error occurred while updating fields"
    );
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) throw new ApiError(400, "Video id is required");

  try {
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video doesn't exist");

    if (video.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "Not authorized to delete this video");
    }

    const videoFileUrl = video.videoFile;
    if (videoFileUrl) {
      const publicId = videoFileUrl.split("/").pop().split(".")[0];
      try {
        await deletefromCloudinary(publicId);
      } catch (error) {
        throw new ApiError(
          500,
          error?.message || "Failed to delete video from Cloudinary"
        );
      }
    }

    try {
      await Video.findByIdAndDelete(videoId);
    } catch (error) {
      throw new ApiError(500, "Error deleting video from the database");
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Video deleted successfully"));
  } catch (error) {
    console.error("Error during video deletion:", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "Video Id is required");
  try {
    const video = await Video.findByIdAndUpdate(
      videoId,
      [
        {
          $set: {
            isPublished: { $not: ["$isPublished"] },
          },
        },
      ],
      { new: true }
    );
    if (!video) throw new ApiError(400, "Video does'nt exist");
    res
      .status(200)
      .json(
        new ApiResponse(200, video, "Video publish status toggled successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Error occured while toggling");
  }
});

const incrementViewCount = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  video.views += 1;
  await video.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, { views: video.views }, "View count incremented")
    );
});

// controllers/video.controller.js
const getVideosByTag = asyncHandler(async (req, res) => {
  const { tag } = req.params;
  try {
    const userId = req.user?._id;

    const matchStage = {
      $match: {
        tags: tag,
      },
    };

    const lookupUserStage = {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    };

    const unwindUserStage = {
      $unwind: {
        path: "$ownerInfo",
        preserveNullAndEmptyArrays: true,
      },
    };

    const lookupLikeStage = {
      $lookup: {
        from: "likes",
        let: { videoId: "$_id", userId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$video", "$$videoId"] },
                  { $eq: ["$likedBy", "$$userId"] },
                ],
              },
            },
          },
        ],
        as: "likeInfo",
      },
    };

    const addFieldsStage = {
      $addFields: {
        isLikedByUser: {
          $cond: {
            if: { $gt: [{ $size: "$likeInfo" }, 0] },
            then: true,
            else: false,
          },
        },
      },
    };

    const projectStage = {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: 1,
        "ownerInfo.fullName": 1,
        "ownerInfo.avatar": 1,
        "ownerInfo.username": 1,
        isLikedByUser: 1,
      },
    };

    const videos = await Video.aggregate([
      matchStage,
      lookupUserStage,
      unwindUserStage,
      lookupLikeStage,
      addFieldsStage,
      projectStage,
    ]).exec();

    res
      .status(200)
      .json(new ApiResponse(200, videos, "Videos fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error occurred while fetching videos"
    );
  }
});

export {
  getAllVideosWithSearchAndUploaderInfo,
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  incrementViewCount,
  getVideosByTag,
};
