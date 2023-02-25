const express = require("express");
const app = express();
const { BlobServiceClient, BlobHttpHeaders } = require("@azure/storage-blob");
const path = require("path");

const containerName = process.env.AZURE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient(containerName);

const fileName = [];
const filePath = [];

module.exports = uploadFiles = async (files) => {
  for (const file of files) {
    const folderName = "jcdbolito2020@plm.edu.ph";
    const blobName = `${folderName}/${Date.now()}-${path.basename(
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
