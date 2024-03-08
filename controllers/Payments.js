const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {
  constEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
const { mongo, default: mongoose } = require("mongoose");
const {paymentSuccessEmail} = require("../mail/templates/paymentSuccessEmail");
const CourseProgress = require("../models/CourseProgress");
const crypto = require("crypto");

//capture the payment and initiate the Razorpay order
exports.capturePayment = async (req, res) => {
  //get courseid and userid
  const { course_id } = req.body;
  const userId = req.user.id;

  //validation
  //valid courseid
  if (!course_id) {
    return res.json({
      success: false,
      message: "Please enter valid course id",
    });
  }
  //vaild coursedetail
  let course;
  try {
    course = await Course.findById(course_id);
    if (!course) {
      return res.json({
        success: false,
        message: "Could not find the course",
      });
    }
    //user already pay for the same course
    const uid = new mongoose.Types.ObjectId(userId);
    if (course.studentsEnrolled.includes(uid)) {
      return res.status(200).json({
        success: false,
        message: "Student is already enrolled",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  //create order
  const amount = course.price;
  const currency = "INR";

  const options = {
    amount: amount * 100,
    currency,
    recipt: Math.random(Date.now()).toString(),
    notes: {
      course_id: course_id,
      userId,
    },
  };
  try {
    //initiate the payment using razorpay
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);
    return res.status(200).json({
      success: true,
      // message:"Order initiated successfully"
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      orderId: paymentResponse.id,
      currency: paymentResponse.currency,
      amount: paymentResponse.amount,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Could not inaite order",
    });
  }
  //return response
};

//verify signature
exports.verifySignature = async (req, res) => {
  const webhooksecret = "12345678";

  const signature = req.headers("x-razorpay-signature");

  const shasum = crypto.createHmac("sha256", webhooksecret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (signature === digest) {
    console.log("Payment is Authorized");

    const { courseId, userId } = req.body.payload.entity.notes;

    try {
      // fulfill the action
      //find the course and rnroll the studnt in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnrolled: userId } },
        { new: true }
      );
      if (!enrolledCourse) {
        return res.status(500).json({
          success: false,
          message: "Course not found",
        });
      }
      console.log(enrolledCourse);
      //find the stundet and te course to their enrolled course me
      const enrolledStudent = await User.findByIdAndDelete(
        { _id: userId },
        { $push: { course: courseId } },
        { new: true }
      );
      console.log(enrolledCourse);

      //mail sned for the confirmation

      const emailResponse = await mailSender(
        enrolledStudent.email,
        "Congratuions, you are enrolled"
      );
      console.log(emailResponse);
      return res.status(200).json({
        success: true,
        message: "Signature verifed and course added",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        return: false,
        message: error.message,
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: "Invaild Response",
    });
  }
};
