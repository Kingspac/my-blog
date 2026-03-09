const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const serviceId = process.env.TWILIO_VERIFY_SERVICE_SID;

// Send OTP via Twilio Verify
exports.sendOTP = async (phone) => {
  await client.verify.v2.services(serviceId)
    .verifications
    .create({ to: phone, channel: "sms" });
};

// Verify OTP entered by user
exports.verifyOTP = async (phone, code) => {
  const result = await client.verify.v2.services(serviceId)
    .verificationChecks
    .create({ to: phone, code: code });

  return result.status === "approved"; // returns true or false
};
