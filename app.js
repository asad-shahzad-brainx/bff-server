import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import apiRouter from "./routes/api.js";
import imageUploadMiddleware from "./helpers/imageUploadMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// TODO: configure caching
// TODO: configure logging
// TODO: configure rate limiting

// TODO: configure cors
app.use(cors());
// app.use(
//   cors({
//     origin: "https://buildingsupplybff.com",
//   })
// );
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(imageUploadMiddleware);

app.get("/", (req, res) => {
  res.send("BFF Server is running");
});

app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
