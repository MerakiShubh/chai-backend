// require('dotenv').config({path: './env'})
import dotenv from "dotenv";

import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000),
      () => {
        console.log(`Server is running at port: ${process.env.PORT}`);
      };
  })
  .catch((err) => {
    console.log("Mongo db connection failed !!!", err);
  });

// process.on("unhandledRejection", (reason, promise) => {
//   console.error("Unhandled Rejection at:", promise, "reason:", reason);

//   process.exit(1);
// });

// .then(() => {
//   //Handling error before connection
//   // app.on("error", (error) => {
//   //   console.log("ERROR: ", error);
//   // });

//   app.listen(process.env.PORT || 8000, () => {
//     console.log(`Server is running at port:  ${process.env.PORT}`);
//   });
// })
// //Handling error after connection

// .catch((err) => {
//   console.log("Mongo DB connection failed !!!");
//   process.exit(1);
// });

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";

/*
import { express } from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("Express can't talk to DB: ", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("ERROR: ", error);
    throw err;
  }
})();
*/
