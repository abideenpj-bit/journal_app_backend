import Manuscript from "../models/Manuscript.js";
import cloudinary from "../config/cloudinary.js";

// Get all published manuscripts
export const getAllPublishedManuscripts = async (req, res) => {
  try {
    const publishedManuscripts = await Manuscript.find({
      status: "published",
    })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: publishedManuscripts.length,
      data: publishedManuscripts,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not fetch manuscripts",
      error: error.message,
    });
  }
};

// Open Published PDF from Cloudinary
export const getPublishedFile = async (req, res) => {
  try {
    const { id } = req.params;

    const manuscript = await Manuscript.findById(id);

    if (!manuscript || manuscript.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "File not found or not published",
      });
    }

    // Extract file extension
    const extension = manuscript.filename
      .split(".")
      .pop();

    // Ensure proper public_id
    const publicId = manuscript.fileId.startsWith("manuscripts/")
      ? manuscript.fileId
      : `manuscripts/${manuscript.fileId}`;

    // Generate signed download URL
    const signedUrl = cloudinary.utils.private_download_url(
      publicId,
      extension,
      {
        resource_type: "raw",
        type: "authenticated",
        attachment: true, // Force download
        expires_at:
          Math.floor(Date.now() / 1000) + 300,
        // Add filename for Content-Disposition header
        flags: [`attachment:${manuscript.filename}`],
      }
    );

    // Redirect to the signed URL to trigger download
    return res.redirect(signedUrl);

  } catch (error) {
    console.error("Published File Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
