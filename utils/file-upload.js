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

const filesObj = {
  scholarshipForm: {
    fileName: "",
    filePath: "",
  },
  form137_138: {
    fileName: "",
    filePath: "",
  },
  IncomeTax: {
    fileName: "",
    filePath: "",
  },
  SnglParentID: {
    fileName: "",
    filePath: "",
  },
  CoR: {
    fileName: "",
    filePath: "",
  },
  CGM: {
    fileName: "",
    filePath: "",
  },
  ScholarshipLetter: {
    fileName: "",
    filePath: "",
  },
  PlmID: {
    fileName: "",
    filePath: "",
  },
};

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

  for (file of fileName) {
    if (file.includes("scholarshipForm")) {
      filesObj.scholarshipForm.fileName = file;
    } else if (file.includes("form137_138")) {
      filesObj.form137_138.fileName = file;
    } else if (file.includes("IncomeTax")) {
      filesObj.IncomeTax.fileName = file;
    } else if (file.includes("SnglParentID")) {
      filesObj.SnglParentID.fileName = file;
    } else if (file.includes("CoR")) {
      filesObj.CoR.fileName = file;
    } else if (file.includes("CGM")) {
      filesObj.CGM.fileName = file;
    } else if (file.includes("ScholarshipLetter")) {
      filesObj.ScholarshipLetter.fileName = file;
    } else if (file.includes("PlmID")) {
      filesObj.PlmID.fileName = file;
    }
  }

  for (file of filePath) {
    if (file.includes("ScholarshipForm")) {
      filesObj.scholarshipForm.filePath = file;
    } else if (file.includes("form137_138")) {
      filesObj.form137_138.filePath = file;
    } else if (file.includes("IncomeTax")) {
      filesObj.IncomeTax.filePath = file;
    } else if (file.includes("SnglParentID")) {
      filesObj.SnglParentID.filePath = file;
    } else if (file.includes("CoR")) {
      filesObj.CoR.filePath = file;
    } else if (file.includes("CGM")) {
      filesObj.CGM.filePath = file;
    } else if (file.includes("ScholarshipLetter")) {
      filesObj.ScholarshipLetter.filePath = file;
    } else if (file.includes("PlmID")) {
      filesObj.PlmID.filePath = file;
    }
  }

  return filesObj;
};
