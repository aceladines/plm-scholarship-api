const express = require("express");
const app = express();
const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");
const { nanoid } = require("nanoid");

const containerName = process.env.AZURE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);

const formTypes = [
  { type: "scholarshipForm", keyword: "ScholarshipForm" },
  { type: "form137_138", keyword: "form137_138" },
  { type: "IncomeTax", keyword: "IncomeTax" },
  { type: "SnglParentID", keyword: "SnglParentID" },
  { type: "CoR", keyword: "CoR" },
  { type: "CGM", keyword: "CGM" },
  { type: "ScholarshipLetter", keyword: "ScholarshipLetter" },
  { type: "PlmID", keyword: "PlmID" },
];

module.exports = async function uploadFiles(files, email) {
  const filesObj = {};

  for (const file of files) {
    const folderName = email;
    const blobName = `${folderName}/${nanoid(16)}-${path.basename(file.originalname)}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const blobOptions = {
      blobHTTPHeaders: { blobContentType: "application/pdf" },
    };

    await blockBlobClient.uploadData(file.buffer, blobOptions);

    for (const formType of formTypes) {
      if (file.originalname.includes(formType.keyword)) {
        filesObj[formType.type] = {
          fileName: file.originalname,
          filePath: `https://plmscholarship.blob.core.windows.net/files/${blobName}`,
        };
      }
    }
  }

  return filesObj;
};
