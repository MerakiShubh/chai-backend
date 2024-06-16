import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Valid video id is required");
  }

  const myAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        owner: {
          $arrayElemAt: ["$owner", 0],
        },
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        owner: {
          _id: "$owner._id",
          username: "$owner.username",
          avatar: "$owner.avatar",
        },
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customLabels: {
      totalDocs: "totalResults",
      docs: "comments",
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
    const comments = await Comment.aggregatePaginate(myAggregate, options);
    res
      .status(200)
      .json(new ApiResponse(200, comments, "Comment is fetch successfuly"));
  } catch (error) {
    throw new ApiError(
      400,
      error?.message || "Error occurred while fetching comments"
    );
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  if (!videoId) throw new ApiError(400, "Video Id is required");
  if (!content || content.trim() === "")
    throw new ApiError(400, "Content is required");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });
  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;
  if (!commentId) throw new ApiError(400, "CommentId is missing");
  if (!content || content.trim() === "")
    throw new ApiError(400, "Content is missing");
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment does not exist");
  if (comment.owner.toString() !== req.user?._id.toString())
    throw new ApiError(404, "Unauthorized user to edit comment");
  comment.content = content;
  await comment.save();
  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment edited successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!commentId) throw new ApiError(400, "Comment id is required");
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment does not exist");
  if (comment.owner.toString() !== req.user._id.toString())
    throw new ApiError(404, "Not authorized to delete this comment");
  await Comment.findByIdAndDelete(commentId);
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
