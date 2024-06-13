import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deletefromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  console.log(new mongoose.Types.ObjectId(userId));
  const myAggregate = Video.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
        ...(userId && { owner: new mongoose.Types.ObjectId(userId) }),
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "desc" ? -1 : 1,
      },
    },
  ]);
  // console.log("MyAggregate", JSON.stringify(myAggregate, null, 2));
  console.log("MyAggregate", myAggregate);

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
      .json(new ApiResponse(201, result, "Videos fetched successfully"));
  } catch (error) {
    throw new ApiError(
      501,
      error?.message || "Error while fetching videos from database"
    );
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video
    const videoLocalFilePath = req.files?.videoFile[0]?.path;
    const thumbnailLocalFilePath = req.files?.thumbnail[0]?.path;

    if (
      !title?.trim() ||
      !description?.trim() ||
      !videoLocalFilePath ||
      !thumbnailLocalFilePath
    ) {
      throw new ApiError(
        400,
        "Title, description, video, and thumbnail are required"
      );
    }
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
    });
    return res
      .status(201)
      .json(new ApiResponse(200, video, "Video uploaded successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message ||
        "Error while uploading files on cloudinary or database error"
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) throw new ApiError(400, "Video id is requried");

  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    res
      .status(200)
      .json(new ApiResponse(200, video, "Video fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error occured while getting videos from database"
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
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
