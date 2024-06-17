import mongoose, { isValidObjectId, set } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  //TODO: create playlist
  if (!name || !description)
    throw new ApiError(400, "Name or description is required");
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });
  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) throw new ApiError(400, "User Id is required");
  const playlists = await Playlist.find({ owner: userId });
  if (!playlists) throw new ApiError(404, "No playlist found for this user");
  res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlist fetched successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
