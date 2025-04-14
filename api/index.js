import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import { Readable } from "stream";

dotenv.config();
const app = express();
const upload = multer();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.GOOGLE_CREDENTIAL_TYPE,
    project_id: process.env.GOOGLE_CREDENTIAL_PROJECT_ID,
    private_key_id: process.env.GOOGLE_CREDENTIAL_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_CREDENTIAL_PRIVATE_KEY.replace(
      /\\n/g,
      "\n"
    ),
    client_email: process.env.GOOGLE_CREDENTIAL_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CREDENTIAL_CLIENT_ID,
    auth_uri: process.env.GOOGLE_CREDENTIAL_AUTH_URI,
    token_uri: process.env.GOOGLE_CREDENTIAL_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.GOOGLE_CREDENTIAL_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CREDENTIAL_CLIENT_X509_CERT_URL,
    universe_domain: process.env.GOOGLE_CREDENTIAL_UNIVERSE_DOMAIN,
  },
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const driveService = google.drive({ version: "v3", auth });

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const folderId = req.body.folderId;

    if (!file || !folderId) {
      return res.status(400).json({ error: "Archivo o folderId faltante" });
    }

    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    const { data } = await driveService.files.create({
      requestBody: {
        name: file.originalname,
        mimeType: file.mimetype,
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
      fields: "id",
    });

    const fileUrl = `https://drive.google.com/file/d/${data.id}/view`;

    res.json({ fileId: data.id, fileUrl });
  } catch (error) {
    console.error("❌ Error al subir:", error);
    res.status(500).json({ error: "Error al subir el archivo" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});
// deploy 2
