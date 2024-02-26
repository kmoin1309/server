const Profile = require("../models/Profile");
const CourseProgress = require("../models/CourseProgress");

const Course = require("../models/Course");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const mongoose = require("mongoose");
const { convertSecondsToDuration } = require("../utils/secToDuration");

//update Profile Handler
exports.updateProfile = async (req, res) => {
  try {
    //fetch Data
    const {
      firstName = "",
      lastName = "",
      dateOfBirth = "",
      about = "",
      contactNumber = "",
      gender = "",
    } = req.body;
    //get userid
    const id = req.user.id;
    //validation
    if (!contactNumber || !about || !gender || !id) {
      return res.status(400).json({
        success: false,
        message: "All fileds are required",
      });
    }

    // Find the profile by id
    const userDetails = await User.findById(id);
    const profile = await Profile.findById(userDetails.additionalDetails);

    const user = await User.findByIdAndUpdate(id, {
      firstName,
      lastName,
    });
    await user.save();

    // Update the profile fields
    profile.dateOfBirth = dateOfBirth;
    profile.about = about;
    profile.contactNumber = contactNumber;
    profile.gender = gender;

    // Save the updated profile
    await profile.save();

    // Find the updated user details
    const updatedUserDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Profile Cannot be Updated",
      error: error.message,
    });
  }
};

//delete account
//how can we schedule this delete chrone job???
exports.deleteAccount = async (req, res) => {
  try {
    //fetch id
    const id = req.user.id;
    console.log(id);
    //validation
    const user = await User.findById({ _id: id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Delete Assosiated Profile with the User
    await Profile.findByIdAndDelete({
      _id: new mongoose.Types.ObjectId(user.additionalDetails),
    });
    // updated rnrolled stdents
    for (const courseId of user.courses) {
      await Course.findByIdAndUpdate(
        courseId,
        { $pull: { studentsEnroled: id } },
        { new: true }
      );
    }
    // Now Delete User
    await User.findByIdAndDelete({ _id: id });
    // return response
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
    await CourseProgress.deleteMany({ userId: id });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "User Cannot be deleted successfully",
    });
  }
};

//get all details for users
exports.getAllUserDetails = async (req, res) => {
  try {
    //fetch
    const id = req.user.id;
    //get user details
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();
    console.log(userDetails);
    //return response
    res.status(200).json({
      success: true,
      message: "User Data fetched successfully",
      data: userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};