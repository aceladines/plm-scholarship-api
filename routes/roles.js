const express = require("express");
const superUserModel = require("../models/superuser");
const router = express.Router();

// * Get all superusers
router.get("/", async (req, res) => {
  try {
    const roles = await superUserModel.find();
    res.status(200).json({ roles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// * Get superuser by email
router.get("/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const user = await superUserModel.findOne({ email });
    if (!user) return res.status(400).json({ message: "Superuser not found!" });
    res.status(400).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// * Add new superuser
router.post("/add", async (req, res) => {
  const { firstName, middleName, lastName, email, role } = req.body;

  const newRole = new superUserModel({
    firstName,
    middleName,
    lastName,
    email,
    role,
  });

  try {
    const emailExist = await superUserModel.findOne({ email });
    if (emailExist) return res.status(400).json({ message: "User already exists!" });

    const savedRole = await newRole.save();
    res.status(200).json({ savedRole });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// * Update superuser
router.patch("/update", async (req, res) => {
  const { firstName, middleName, lastName, email, newEmail, role } = req.body;

  try {
    const updateAdmin = await superUserModel.findOneAndUpdate(
      {
        email,
      },
      {
        $set: {
          firstName,
          middleName,
          lastName,
          email: newEmail || email,
          role,
        },
      },
      { new: true }
    );

    if (!updateAdmin) return res.status(400).json({ message: "Admin not found!" });

    res.status(200).json({ updateAdmin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// * Delete superuser
router.delete("/delete", async (req, res) => {
  const { email } = req.body;
  try {
    const deletedUser = await superUserModel.findOneAndDelete({
      email,
    });

    if (!deletedUser) return res.status(400).json({ message: "Account not found!" });

    res.status(200).json({ deletedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
