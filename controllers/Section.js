const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req, res) => {
  try {
    // datafetch
    const { sectionName, courseId } = req.body;

    //data validation
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing Properties",
      });
    }
    // / create section
    const newSection = await Section.create({ sectionName });
    // update course woth section objectid
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    )
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();
    // use populate to replace section / sub-section both in the updatdCOurseDetails
    // return response
    return res.status(200).json({
      success: true,
      message: "Section Created Successfully",
      updatedCourseDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Section Cannot be Created Interal Server Error",
      error: error.message,
    });
  }
};

exports.updateSection = async (req, res) => {
  try {
    //data fetch
    const { sectionName, sectionId } = req.body;
    // dta validation
    if (!sectionId || !sectionName) {
      return res.status(400).json({
        success: false,
        message: "Missing Properties",
      });
    }
    // data updte
    const section = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );

    // return res
    return res.status(200).json({
      status: true,
      message: "Section Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: true,
      message: "Unable to Update Secton , Please Try again",
      error: error.message,
    });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    // get id - assuming that we are sendind id in params
    const { sectionId, courseId } = req.body;

    await Course.findByIdAndUpdate(courseId, {
      $pull: {
        courseContent: sectionId,
      },
    });
    const section = await Section.findById(sectionId);
    console.log(sectionId, courseId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not Found",
      });
    }

    //use finfByIdand Deleet
    await SubSection.deleteMany({ _id: { $in: section.subSection } });

    await Section.findByIdAndDelete(sectionId);

    //find the updated course and return
    const course = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    res.status(200).json({
      success: true,
      message: "Section deleted",
      data: course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to Delete Section , Please try Again",
      error: error.message,
    });
  }
};
