const mongoose = require("mongoose");
const Section = require("../models/Section");
const subSection = require("../models/SubSection");
const Course = require("../models/Course");

exports.updateCourseProgress = async (req, res) => {
    try{
        // data fetch
        const subSection = await subSection.findById(subSection)
        if(!subSection) {
            return res.status(404).json({
                error:"Invalid subSection",
            });
        }

        //fin thecourse progress document for the user and the course
        let courseProgress = await CourseProgress.findOne({
            courseId : courseId,
            userId : userId,
        });

        if(!courseProgress) {
            return res.status(404).json({
                success:false,
                message:"Course Progress does not exist",
            });
        } else {
            if(courseProgress.completedVideos.includes(subsectionId)){
                return res.status(400).json({
                    error:"Subsection already completed",
                })
            }
            //push the subsection into completed videos array
            courseProgress.completedVideos.push(subsectionId)
        }
        // ..save the updated course progresss
        await courseProgress.save()
        return res.status(200).json({
            status:true,
            message:"Course Progres Updated",
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            status:false,
            message:"Course Progres cannot be Updated",
        });
    }
}