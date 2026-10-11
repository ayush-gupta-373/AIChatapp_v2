const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer, originalName, mimeType) =>
  new Promise((resolve, reject) => {
    const resourceType = mimeType?.startsWith("image/") ? "image" : "auto";
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "chatapp/files",
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        filename_override: originalName,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });

module.exports = { uploadToCloudinary };