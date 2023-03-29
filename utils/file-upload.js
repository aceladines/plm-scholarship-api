const express = require("express");
const app = express();
const { BlobServiceClient, BlobHttpHeaders } = require("@azure/storage-blob");
const path = require("path");
const { nanoid } = require("nanoid");

const containerName = process.env.AZURE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient(containerName);

const fileName = [];
const filePath = [];

module.exports = uploadFiles = async (files, email) => {
  for (const file of files) {
    const folderName = email;
    const blobName = `${folderName}/${nanoid(16)}-${path.basename(
      file.originalname
    )}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const blobOptions = {
      blobHTTPHeaders: { blobContentType: "application/pdf" },
    };

    await blockBlobClient.uploadData(file.buffer, blobOptions);

    fileName.push(file.originalname);
    filePath.push(
      `https://plmeams.blob.core.windows.net/scholarship-files/${blobName}`
    );
  }

  return { fileName, filePath };
};
