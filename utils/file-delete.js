const express = require("express");
const app = express();
const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");
const ApplicationForm = require("../models/application");

const containerName = process.env.AZURE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient(containerName);

// This will delete the files that matches the given string
module.exports = deleteFileWithText = async (email, filesToDelete) => {
  try {
    if (!filesToDelete) return "No file to update!";
    let filesObj = (await ApplicationForm.findOne({ email })).files.toObject({
      getters: true,
      virtuals: false,
    });

    for (const file of filesToDelete) {
      if (filesObj[file]) {
        delete filesObj[file];
      }
    }

    for await (const blob of containerClient.listBlobsFlat()) {
      for (const file of filesToDelete) {
        if (
          blob.name.includes(email) &&
          blob.name.toLowerCase().includes(file.toLowerCase())
        ) {
          await containerClient.deleteBlob(blob.name);
        }
      }
    }

    await ApplicationForm.findOneAndUpdate(
      { email },
      { files: filesObj },
      { new: true }
    );
    // Upload new files
    return "Files deleted!";
  } catch (e) {
    return e.message;
  }
};
