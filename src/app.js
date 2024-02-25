import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//Limiting json data to 16kb
app.use(express.json({ limit: "16kb" }));

//Encoding data from url
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//public assests to keep files
app.use(express.static("public"));

//alowing server to perform CRUD operation over saved cookie in browser
app.use(cookieParser());

//routes
import userRouter from "./routes/user.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
export { app };
