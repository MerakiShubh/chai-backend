import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, //cloudinary url
      required: true,
    },
    thumbnail: {
      type: String, //cloudinary url
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    tags: {
      type: [String], // Array of strings to store tags
      enum: ["Music", "Sports", "Gaming", "Movies", "News", "Live"],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(mongooseAggregatePaginate);

// Pre-save hook to ensure HTTPS URLs
videoSchema.pre("save", function (next) {
  if (this.videoFile && this.videoFile.startsWith("http://")) {
    this.videoFile = this.videoFile.replace("http://", "https://");
  }

  if (this.thumbnail && this.thumbnail.startsWith("http://")) {
    this.thumbnail = this.thumbnail.replace("http://", "https://");
  }

  next();
});

export const Video = mongoose.model("Video", videoSchema);
