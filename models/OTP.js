const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const mailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 5 * 60,
  },
});

// a function -> to send emails
async function sendVerificationEmail(email, otp) {
  try {
    const mailRsponse = await mailSender(
      email,
      "Verification email from StudyNotion",
      mailTemplate(otp)
    );
    console.log("Email Sent Successfully", mailRsponse);
  } catch (error) {
    console.log("Error Ocurred while Sending mails", error);
    throw error;
  }
}

OTPSchema.pre("save", async function (next) {
  console.log("New document saved to database");
  if(this.isNew){
    await sendVerificationEmail(this.email, this.otp);
  }
  next();
});
const OTP = mongoose.model("OTP",OTPSchema);
module.exports = OTP;
