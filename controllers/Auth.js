const User = requiire("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const Profile = require("../models/Profile");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
require("dotenv").config();
//sendOTP
exports.sendOTP = async (req, res) => {
  try {
    //fetch email from kequest body
    const { email } = req.body;

    //check if user already exist
    const checkUserPresent = await User.findOne({ email });

    //if User Already exist , then retuen a response

    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already Exist",
      });
    }

    //generate otp
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("OTP Generated: ", otp);

    //check unique otp or not
    const result = await OTP.findOne({ otp: otp });
    console.log("Result is Generate OTP Func");
    console.log("OTP", otp);
    console.log("Result", result);

    while (result) {
      otp = otpGenerator(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
    }

    const otpPayload = { email, otp };

    // create an entry for OTP
    const otpBody = await OTP.create(otpPayload);
    console.log("OTP Body", otpBody);

    // return response successful
    res.status(200).json({
      success: true,
      message: "Otp Sent Successfully",
      otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//signup
exports.signup = async (req, res) => {
  try {
    //data fetch from req body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;
    //validate karlo
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All field are required",
      });
    }
    // 2 password match karlo
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "password and confirmPassword vlaue does not match , Please try again",
      });
    }
    //check user already exist or not
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User is already registered",
      });
    }

    //find most recent OTP stored for the user
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log(recentOtp);

    // validate OTP
    if (recentOtp.length == 0) {
      //otp not found
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    } else if (otp !== recentOtp.otp) {
      return res.status(400).json({
        success: false,
        message: "Otp Invalid",
      });
    }
    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create the user
    let approved = "";
    approved === "Instructor" ? (approved = false) : (approved = true);
    //entry create in DB
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstname} ${lastName}`,
    });
    // return res
    return res.status(200).json({
      success: true,
      message: "User is registered Successsfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User canot be registered",
    });
  }
};

//login
exports.login = async (req, res) => {
  try {
    //get data from req body
    const { email, password } = req.body;
    //v alidation data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "All field are required, plaese try again",
      });
    }
    //check user if exist or not
    const user = await User.findOne({ email }).populate("additonalDetails");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registered, please signup first",
      });
    }

    // generate jwt after password matching
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      user.token = token;
      user.password = undefined;

      //create cookie and send response
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 100),
        httpOnly: true,
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "Logged in successsfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Login Failure, please try again",
    });
  }
};

// changePassword
exports.changePassword = async (req, res) => {
  try {
    //get data from req body
    const userDetails = await User.findById(req.user.id);
    // get oldPassword, newPassword, confirmPassword
    const { oldPassword, newPassword, confirmPassword } = req.body;
    //validation old passsword
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (!isPasswordMatch) {
      // if old password does not match , return a 401 unauthorized error
      return res.status(401).json({
        success: false,
        message: "The password is Incorrect",
      });
    }
    //update Password in DB
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      {
        password: encryptedPassword,
      },
      {
        new: true,
      }
    );
    // send mail -> passsword updated notification
    try{
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Passsword for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Passsword updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      )
      console.log("Email sent Successfully", emailResponse.response)
    }
    catch(error){
      // if there's an error sending the mail, log the error and return a 500 internal server error
      console.log("Error occured while sending the mail",error);
      return res.status(500).json({
        message:false,
        message:'Error occured while sending the mail',
        error:error.message,
      })
    }
    //return response
    return res.status(200).json({
      success:true,
      message:'Password Updated Successfully',
    });
  } catch (error) {
    console.log("Error Ocurred while updating Passsword ",error);
    return res.status(500).json({
      success:false,
      message:'Error occured while updating password',
      error:error.message,
    })
  }
};
