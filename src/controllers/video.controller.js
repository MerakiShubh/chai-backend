import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination
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
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
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
