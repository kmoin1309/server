const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");
const { reset } = require("nodemon");

// auth
exports.auth = async (req, res, next) => {
  try {
    // /extract token
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization").replace("Bearer ", "");
    // if token missing, then return response
    if (!token) {
      return res.status(401).json({
        success: false,
        message: `Token is Missing`,
      });
    }
    // verify the token
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decode);
      req.user = decode;
    } catch (error) {
      // verificaton issue
      return res.status(401).json({
        success: false,
        message: "token is invalid",
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Something went wrong whilw validating token",
    });
  }
};

//isStudent
exports.isStudent = async (req, res, next) => {
  try {
    // const userDetails = await User.
    if (req.user.accountType !== "Student") {
      return res.status(401).json({
        success: false,
        message: "This is proected Route for Students only",
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: `User role cannot be verified , please try again`,
    });
  }
};

//isInstructor
exports.isInstructor = async (req, res, next) => {
  try {
    // const userDetails = await User.
    const userDetails = await User.findOne({ email: req.user.email });
    console.log(userDetails);
    console.log(userDetails.accountType);
    if (userDetails.accountType !== "Instructor") {
      return res.status(401).json({
        success: false,
        message: "This is proected Route for Instructor only",
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: `User role cannot be verified , please try again`,
    });
  }
};

//isAdmin
exports.isAdmin = async (req, res, next) => {
  try {
    const userDetails = await User.findOne({ email: req.user.email });
    if (userDetails.accountType !== "Admin") {
      return res.status(401).json({
        success: false,
        message: "This is proected Route for Admin only",
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: `User role cannot be verified , please try again`,
    });
  }
};
