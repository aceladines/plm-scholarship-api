// // const express = require('express');
// // const router = express.Router();
// // applicantsInfo = require('../../models/application')

// // router.put('/move', async (req,res) =>{
// //     // Dummy Field
// //     const toMove = {
// //         studentNumber: [202011759],
// //         provider: 'SM-Scholarship'
// //     }

// //     try {
// //         for (const student in toMove.studentNumber) {
// //             const movedStudents = await applicantsInfo.findOneAndUpdate({studentNum: toMove.studentNumber[student]}, {scholarshipProvider: toMove.provider})
// //         }

// //         res.status(200).json({message: 'Successfully moved student/s!'})
// //     }catch (e) {
// //         res.status(500).json({error: e.message})
// //     }
// // })

// // router.get('/*', async (req, res) => {
// //     try {

// //         // execute query with page and limit values
// //         const studentInfos = await applicantsInfo.find({ approvalStatus: 'APPROVED' })
// //             .sort({ totalScore: -1 })
// //             .exec();

// //         // get total documents in the Posts collection
// //         const count = await applicantsInfo.countDocuments({ approvalStatus: 'APPROVED' });

// //         if(studentInfos.length === 0){
// //             res.status(200).json({message: 'No data'})
// //         }
// //         else if(studentInfos.length === 1){
// //             await applicantsInfo.findOneAndUpdate({studentNum: studentInfos[0].studentNum}, {rank: 1})

// //             // return response with posts, total pages, and current page
// //             res.status(200).json({
// //                 studentInfos,
// //                 totalCount: count
// //             });
// //         }
// //         else {

// //             let sum = 1;
// //             let indexFlag = 2
// //             let rank = 0
// //             let rankArr = []
// //             let totalScoreArr = []

// //             // Push the totalScore into 'totalScoreArr'
// //             for (let i = 0; i < studentInfos.length; i++) {
// //                 totalScoreArr.push(studentInfos[i].totalScore)
// //             }

// //             // Making a set from 'totalScoreArr'
// //             let set = new Set(totalScoreArr)
// //             let distinctElems = [...set]

// //             console.log(totalScoreArr)

// //             // Counting occurences of 'totalScore' values
// //             let occurence = totalScoreArr.reduce(function(acc, current) {
// //                 if (acc[current]) {
// //                     acc[current]++;
// //                 } else {
// //                     acc[current] = 1;
// //                 }
// //                 return acc;
// //             }, {});

// //             console.log("Occurence: " + JSON.stringify(occurence))

// //             let keys = [],k ,i ,len

// //             for (k in occurence) {
// //                 if (occurence.hasOwnProperty(k)) {
// //                     keys.push(k);
// //                 }
// //             }

// //             // Sorting the keys
// //             keys.sort().reverse()
// //             console.log(keys)

// //             len = keys.length;
// //             let sortedOccuranceArr = []

// //             for (i = 0; i < len; i++) {
// //                 k = keys[i];
// //                 console.log(sortedOccuranceArr.push(occurence[k]));
// //             }

// //             let myMap = new Map();

// //             for (let i = 0; i < distinctElems.length; i++) {
// //                 myMap.set(distinctElems[i], sortedOccuranceArr[i]);
// //             }

// //             for (let i = 0; i < studentInfos.length - 1; i++) {

// //                 // Main logic for ranking
// //                 if (studentInfos[i].totalScore === studentInfos[i + 1].totalScore) {
// //                     sum = sum + indexFlag++

// //                     if (i === studentInfos.length - 2) {
// //                         rank = sum / myMap.get(studentInfos[i].totalScore);
// //                         rankArr.push(rank);
// //                     }
// //                 } else if (studentInfos[i].totalScore !== studentInfos[i + 1].totalScore) {

// //                     rank = sum / myMap.get(studentInfos[i].totalScore);
// //                     rankArr.push(rank)
// //                     sum = indexFlag++
// //                     if (i === studentInfos.length - 2) {
// //                         rank = --indexFlag;
// //                         rankArr.push(rank)
// //                     }
// //                 }

// //             }

// //             let finalRanking = []

// //             for (let i = 0; i < rankArr.length ; i++) {
// //                 for (let j = 0; j < sortedOccuranceArr[i]; j++) {
// //                     finalRanking.push(rankArr[i])
// //                 }
// //             }

// //             for (let i = 0; i < studentInfos.length; i++) {
// //                 await applicantsInfo.findOneAndUpdate({studentNum: studentInfos[i].studentNum},{rank: parseFloat(finalRanking[i])})
// //             }

// //             // return response with posts, total pages, and current page
// //             res.status(200).json({
// //                 studentInfos,
// //                 totalCount: count
// //             });

// //         }

// //     } catch (e) {
// //         res.status(404).json(e.message);
// //     }
// // });

// // module.exports = router



// // pdf

// router.get("/generate-pdf", async (req, res) => {
//   let data1 = [];
//   let data2 = [];
//   let data3 = [];

//   for (const data of csvData) {
//     data1.push({
//       "Name of Candidate": `${data.firstName} ${data.middleName} ${data.lastName}`,
//       "Degree Program": data.course,
//       Rank: data.rank,
//       Remarks: data.approvalStatus,
//     });
//   }

//   for (const data of csvData) {
//     data2.push({
//       Name: `${data.firstName} ${data.middleName} ${data.lastName}`,
//       Year: data.year,
//       College: data.college,
//       "Degree Program": data.course,
//       Contact: data.mobileNum,
//       GWA: data.currentGwa,
//       Equiv: data.EquivGWA,
//       "Parents' Household Income": data.householdIncome,
//       Equiv: data.EquivInc,
//       "Total Score": data.totalScore,
//       Rank: data.rank,
//     });
//   }

//   csvData.map((data, index) => {
//     data3.push({
//       No: index + 1,
//       "Name of Candidate": `${data.firstName} ${data.middleName} ${data.lastName}`,
//       "Degree Program": data.course,
//       Rank: data.rank,
//     });
//   });

//   const document1 = new PDFDocument({
//     layout: "landscape", // Set the layout to landscape
//     size: "letter", // Set the page size to letter (or any other size you prefer)
//   });
//   const document2 = new PDFDocument({
//     layout: "landscape", // Set the layout to landscape
//     size: "letter", // Set the page size to letter (or any other size you prefer)
//   });
//   const document3 = new PDFDocument({
//     layout: "landscape", // Set the layout to landscape
//     size: "letter", // Set the page size to letter (or any other size you prefer)
//   });

//   const archive = archiver("zip", {
//     zlib: { level: 9 }, // Sets the compression level.
//   });

//   // Set the content type header to indicate that the response will contain a zip file
//   res.setHeader("Content-Type", "application/zip");

//   // Set the content disposition header to indicate that the response should be treated as an attachment
//   res.setHeader("Content-Disposition", "attachment; filename=output.zip");

//   // Pipe the compressed archive to the response object
//   archive.pipe(res);

//   // Function to generate table in PDF document
//   const generateTable = (doc, data, headers, title, flag) => {
//     let tableWidth = 500; // Width of the table
//     if (flag === 2) tableWidth = 650;
//     const marginLeft = (doc.page.width - tableWidth) / 2; // Calculate left margin to center the table

//     doc.font("Helvetica-Bold");
//     doc.fontSize(14);
//     doc.text(title, { align: "center" });
//     doc.moveDown(2);

//     // Table headers with borders and centered
//     const headerSpacing = tableWidth / headers.length; // Spacing between headers
//     const headerY = doc.y; // Store current y coordinate for headers
//     doc.moveDown(0.5); // Add spacing before headers
//     doc.font("Helvetica-Bold"); // Set font style for headers
//     doc.fontSize(8);
//     headers.forEach((header, index) => {
//       doc.text(
//         header,
//         marginLeft + index * headerSpacing, // X-coordinate of the header
//         headerY, // Y-coordinate of the header
//         {
//           align: "center",
//           width: headerSpacing, // Set width of header cell
//           border: [true, true, true, true], // Border style
//         }
//       );
//     });

//     if (flag === 2) doc.moveDown(1.7);
//     else doc.moveDown(1.3);

//     // Table rows with borders and centered
//     doc.font("Helvetica"); // Reset font style for data rows
//     doc.fontSize(8);
//     const rowSpacing = 20; // Spacing between rows
//     data.forEach((row) => {
//       const cellHeights = headers.map((header) =>
//         doc.heightOfString(row[header], { width: headerSpacing })
//       );
//       const maxCellHeight = Math.max(...cellHeights);
//       const rowY = doc.y; // Store current y coordinate for the row
//       headers.forEach((header, index) => {
//         doc.text(
//           row[header], // Cell content
//           marginLeft + index * headerSpacing, // X-coordinate of the cell
//           rowY, // Y-coordinate of the cell
//           {
//             align: "center",
//             width: headerSpacing, // Set width of data cell
//             height: maxCellHeight, // Set height of data cell
//             border: [true, false, true, true], // Border style: [top, right, bottom, left]
//           }
//         );
//       });
//       doc.y = rowY + maxCellHeight + rowSpacing; // Update y coordinate for next row
//     });
//   };

//   // Note: This code assumes that the `doc` object is a valid PDF document object from a supported PDF generation library, and that `data` and `headers` are valid arrays with appropriate data for the table. You may need to modify the code based on your specific use case and the PDF generation library you are using.

//   // Note: This code assumes that the `doc` object is a valid PDF document object from a supported PDF generation library, and that `data` and `headers` are valid arrays with appropriate data for the table. You may need to modify the code based on your specific use case and the PDF generation library you are using.

//   const headers1 = ["Name of Candidate", "Degree Program", "Rank", "Remarks"];
//   const title1 = "REPORT";
//   generateTable(document1, data1, headers1, title1, 1);

//   const headers2 = [
//     "Name",
//     "Year",
//     "College",
//     "Degree Program",
//     "Contact",
//     "GWA",
//     "Equiv",
//     "Parents' Household Income",
//     "Total Score",
//     "Rank",
//   ];
//   const title2 = "REPORT";
//   generateTable(document2, data2, headers2, title2, 2);

//   const headers3 = ["No", "Name of Candidate", "Degree Program", "Rank"];
//   const title3 = "REPORT";
//   generateTable(document3, data3, headers3, title3, 3);

//   // Finalize the PDF documents and add them to the archive
//   document1.end();
//   archive.append(document1, { name: "file1.pdf" });

//   document2.end();
//   archive.append(document2, { name: "file2.pdf" });

//   document3.end();
//   archive.append(document3, { name: "file3.pdf" });

//   // Wrap archive.finalize() in a Promise
//   const finalizePromise = new Promise((resolve, reject) => {
//     archive.finalize();
//     archive.on("finish", resolve);
//     archive.on("error", reject);
//   });

//   try {
//     // Wait for the archive to finish writing before sending the response
//     await finalizePromise;
//     res.end();
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to generate PDF files." });
//   }
// });