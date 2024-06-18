import mongoose, { isValidObjectId, mongo } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!isValidObjectId(channelId))
    throw new ApiError(400, "Provide valid channel id");
  const subscriptionId = req.user?._id;
  if (!subscriptionId) new ApiError(400, "User not found");
  const existingSubscription = await Subscription.findOne({
    subscriber: subscriptionId,
    channel: channelId,
  });
  if (existingSubscription) {
    await existingSubscription.deleteOne();
    res
      .status(200)
      .json(new ApiResponse(200, {}, "User unsubscribed successfully"));
  } else {
    const newSubscription = await Subscription.create({
      subscriber: subscriptionId,
      channel: channelId,
    });
    res
      .status(200)
      .json(
        new ApiResponse(200, newSubscription, "User subscribed successfully")
      );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId))
    throw new ApiError(400, "Provide valid channel id");
  const subscribers = await Subscription.find({
    channel: channelId,
  }).populate("subscriber", "username email avatar");
  if (!subscribers.length)
    throw new ApiError(404, "No subscribers found for this channel");

  res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId))
    throw new ApiError(400, "Provide valid subscriber id");
  const channels = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "username email avatar ");
  if (!channels.length)
    throw new ApiError(404, "No subscriber channel found for this user");
  res
    .status(200)
    .json(
      new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
