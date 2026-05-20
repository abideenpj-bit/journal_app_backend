import User from "../models/User.js";
import ExpertRequest from "../models/ExpertRequest.js";
import { sendEmail } from "../utils/mailer.js";

// Admin → get all pending expert requests
export const getExpertRequests = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const requests = await ExpertRequest.find({
      status: "pending",
    }).populate("user", "name email role");

    res.json(requests);
  } catch (error) {
    console.log("GET REQUEST ERROR:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// APPROVE EXPERT
export const approveExpert = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const request = await ExpertRequest.findById(
      req.params.requestId
    ).populate("user");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Already processed",
      });
    }

    // update role
    request.user.role = "expert";

    // SAFE notifications
    if (!request.user.notifications) {
      request.user.notifications = [];
    }

    request.user.notifications.push({
      message: "🎉 Your expert request has been approved!",
    });

    await request.user.save();

    // update request
    request.status = "approved";
    await request.save();

    // email
    try {
      await sendEmail({
        to: request.user.email,
        subject: "Expert Request Approved",
        text: "Your expert request has been approved.",
        html: `
          <h1>Approved</h1>
          <p>Your expert request has been approved.</p>
        `,
      });
    } catch (emailError) {
      console.log("EMAIL ERROR:", emailError.message);
    }

    res.json({
      success: true,
      message: "Expert approved successfully",
    });
  } catch (error) {
    console.log("APPROVE ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// REJECT EXPERT
export const rejectExpert = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const request = await ExpertRequest.findById(
      req.params.requestId
    ).populate("user");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Already processed",
      });
    }

    // SAFE notifications
    if (!request.user.notifications) {
      request.user.notifications = [];
    }

    request.user.notifications.push({
      message: "❌ Your expert request was rejected.",
    });

    await request.user.save();

    // update request
    request.status = "rejected";
    await request.save();

    // email
    try {
      await sendEmail({
        to: request.user.email,
        subject: "Expert Request Rejected",
        text: "Your expert request was rejected.",
        html: `
          <h1>Rejected</h1>
          <p>Your expert request was rejected.</p>
        `,
      });
    } catch (emailError) {
      console.log("EMAIL ERROR:", emailError.message);
    }

    res.json({
      success: true,
      message: "Expert request rejected successfully",
    });
  } catch (error) {
    console.log("REJECT ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// AUTHOR REQUEST
export const requestExpertController = async (req, res) => {
  try {
    const { message } = req.body;

    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const alreadyExists = await ExpertRequest.findOne({
      user: req.user._id,
      status: "pending",
    });

    if (alreadyExists) {
      return res.status(400).json({
        message: "You already have a pending request",
      });
    }

    await ExpertRequest.create({
      user: req.user._id,
      message,
      status: "pending",
    });

    try {
      await sendEmail({
        to: req.user.email,
        subject: "Expert Request Submitted",
        text: "Your request has been submitted.",
        html: `
          <h1>Request Submitted</h1>
          <p>Your expert request has been submitted successfully.</p>
        `,
      });
    } catch (emailError) {
      console.log("EMAIL ERROR:", emailError.message);
    }

    res.json({
      success: true,
      message: "Expert request submitted successfully",
    });
  } catch (error) {
    console.log("REQUEST ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};