import { v2 as cloudinary } from "cloudinary";

// NEW CLOUDINARY CREDENTIALS
cloudinary.config({
  cloud_name: 'dszxkj5ff',
  api_key: '828276545531189',
  api_secret: 'auahBrztaC2ZOsmwYLwz0gsNdQA',
});

// THE OLD RAW DOCUMENT URL
const oldDocUrl = "https://res.cloudinary.com/dzasncsep/raw/authenticated/s--JybvUG1x--/v1779260735/manuscripts/pecepwvx0b945qijjkpv";

/**
 * Migration function to upload the raw document to the new account.
 * We set type: 'authenticated' to match your old account's security settings.
 */
async function migrateDocument() {
  console.log("Starting migration for raw document...");
  console.log("Old URL:", oldDocUrl);

  try {
    const result = await cloudinary.uploader.upload(oldDocUrl, {
      resource_type: "raw",
      type: "authenticated", // This ensures the URL becomes /raw/authenticated/
      folder: "manuscripts",
    });

    console.log("\n✅ Migration Successful!");
    console.log("-----------------------------------------");
    console.log("New Public ID:", result.public_id);
    console.log("New Secure URL:", result.secure_url);
    console.log("-----------------------------------------");
    console.log("Note: This is now an 'authenticated' file, so it will work with your signed URL logic.");

    return result;
  } catch (error) {
    console.error("\n❌ Migration Failed!");
    console.error("Error details:", error.message);
  }
}

migrateDocument();
