import nodemailer from "nodemailer";

// Generate a 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit number
};

// Create a transporter using Gmail service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USERNAME, // Your Gmail address
    pass: process.env.GMAIL_PASSWORD, // Your Gmail App Password
  },
});
// Function to send verification email
export const sendEmail = async ({
  to,
  subject,
  text,
}: {
  to: string;
  text: string;
  subject: string;
}) => {
  const mailOptions = {
    from: "emiracegroup@example.com",
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};
