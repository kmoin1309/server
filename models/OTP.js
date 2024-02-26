const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required:true,
  },
  createdAt: {
    type: Date,
    default:Date.now(),
    expires:5*60,
  }
});

// a function -> to send emails
async function sendVerificationEmail(email,otp){
    try{
        const mailRsponse = await mailSender(email, "Verification email from StudyNotion",otp);
        console.log("Email Sent Successfully", mailRsponse);

    }catch(error){
        console.log("Error Ocurred while Sending mails", error);
        throw error;

    }
}  

OTPSchema.pre("save",async function(next){
    await sendVerificationEmail(this.email,this.otp);
    next();
})

module.exports = mongoose.model("OTP", OTPSchema);

