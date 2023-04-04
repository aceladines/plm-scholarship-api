const express = require("express");
const app = express();
const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");
const fileUpload = require("./file-upload");

const containerName = process.env.AZURE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient(containerName);

// This will delete the files that matches the given string
module.exports = deleteFileWithText = async (email, files, fileToDelete) => {
  try {
    for await (const blob of containerClient.listBlobsFlat()) {
      for (const file of files) {
        if (
          blob.name.includes(email) &&
          blob.name.includes(file.originalname)
        ) {
          await containerClient.deleteBlob(blob.name);
        }
      }
    }

    for await (const blob of containerClient.listBlobsFlat()) {
      for (const file of fileToDelete) {
        if (blob.name.includes(email) && blob.name.includes(file)) {
          await containerClient.deleteBlob(blob.name);
        }
      }
    }

    // Upload new files
    return await fileUpload(files, email);
  } catch (e) {
    return e.message;
  }
};
