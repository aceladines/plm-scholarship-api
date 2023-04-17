const express = require("express");
const superUserModel = require("../models/superuser");
const router = express.Router();
const superUserModel = require("../models/superuser");

router.get("/", async (req, res) => {
  try {
    const roles = await superUserModel.find();
    res.status(200).json({ roles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/add", async (req, res) => {
  const { fName, mName, lName, email, role } = req.body;

  const newRole = new superUserModel({
    name: `${fName} ${mName} ${lName}`,
    email,
    role,
  });

  try {
    const savedRole = await newRole.save();
    res.status(200).json({ savedRole });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/update", async (req, res) => {
  const { fName, mName, lName, email, role } = req.body;

  try {
    const updateAdmin = await superUserModel.findOneAndUpdate(
      {
        email,
      },
      {
        $set: {
          name: `${fName} ${mName} ${lName}`,
          role,
        },
      },
      { new: true }
    );

    if (!updateAdmin)
      return res.status(400).json({ message: "Admin not found!" });

    res.status(200).json({ updateAdmin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
