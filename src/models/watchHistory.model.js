import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  videos: [
    {
      video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true,
        index: true,
      },
      watchedAt: { type: Date, default: Date.now },
    },
  ],
});

const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);

export default WatchHistory;
