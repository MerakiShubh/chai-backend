import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content || content.trim() === "")
    throw new ApiError(400, "Provide content for tweet");
  const userId = req.user?._id;
  const tweet = await Tweet.create({ content, owner: userId });
  if (!tweet) throw new ApiError(500, "Unable to save tweet");
  res.status(200).json(new ApiResponse(200, tweet, "tweet saved successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!isValidObjectId(userId))
    throw new ApiError(404, "User's tweet doest exists");
  const tweet = await Tweet.find({ owner: userId });
  if (!tweet.length) throw new ApiError(400, "No tweets");
  res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  if (!content || content.trim() === "")
    throw new ApiError(400, "Provide content for tweet");
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id");
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );
  if (!updatedTweet) throw new ApiError(500, "Tweet not found");
  res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(404, "No such tweet");
  await tweet.deleteOne();
  res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
