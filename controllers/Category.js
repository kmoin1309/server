const Category = require("../models/Category");
// const Tag = require("../models/Category");

//create tags and the handler function

exports.exports.createCategory = async (req, res) => {
  try {
    // fetch data
    const { name, description } = req.body;
    //validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    // create entry in DB
    const CategorysDetails = await Category.create({
      name: name,
      description: description,
    });
    console.log(CategorysDetails);
    // return response
    return res.status(200).json({
      success: true,
      message: "Categorys Created Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json(500).json({
      success: false,
      message: error.message,
    });
  }
};

//getAlltags Handler Function
exports.showAllCategories = async (req, res) => {
  try {
    console.log("INSIDE SHOW ALL CATEGORIES");
    const allCategorys = await Category.find({});
    res.status(200).json({
      success: true,
      data: allCategorys,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
