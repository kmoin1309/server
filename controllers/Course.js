const Course = require("../models/Course");
const Tag = require("../models/Category");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

//createCourse handler function
exports.createCourse = async (req, res) => {
  try {
    //fetch data
    const { courseName, courseDescription, whatYouWillLearn, price, tag } =
      req.body;

    //get thumbnail
    const thumbnail = req.files.thumbnailImage;

    //validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !thumbnail
    ) {
      return res.status(400).json({
        success: true,
        message: "All fields are required",
      });
    }

    // check for instructor
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId, {
      accountType: "Instructor",
    });
    console.log("Instructor Details: ", instructorDetails);

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor Details not found",
      });
    }

    //check given tag is valid no not
    const tagDetails = await Tag.findById(tag);
    if (!tagDetails) {
      return res.status(404).json({
        success: false,
        message: "Tag Details not found",
      });
    }

    //upload image to cloudinary
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );
    //create an entry for new course
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructorDetails: instructorDetails._id,
      whatYouWillLearn: whatYouWillLearn,
      price,
      tag: tagDetails._id,
      thumbnail: thumbnailImage.secure_url,
    });

    //update the user add the new course shema to instructor
    await User.findByIdAndUpdate(
      {
        _id: instructorDetails._id,
      },
      {
        $push: {
          courses: newCourse.id,
        },
      }
    );

    // update the TAG schema
    const categoryDetails2 = await Category.findByIdAndUpdate(
      { _id: category },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      {
        new: true,
      }
    );
    console.log("Here", categoryDetails2);
    //return response
    return res.status(200).json({
      success: true,
      message: "Course Created Successfully",
      data: newCourse,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to Create Course",
      error: error.message,
    });
  }
};

//getAllcourses handler functions
exports.showAlCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      { status: "Published" },
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor")
      .exec();
    return res.status(200).json({
      success: true,
      message: "Data for all courses fetched successfully",
      data: allCourses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot Fetch course data",
      error: error.message,
    });
  }
};
