// SOSATI — Express Server
// Seal Services Appointment System
// Con Cloudinary para documentos y fotos

const express    = require("express");
const path       = require("path");
const multer     = require("multer");
const cloudinary = require("cloudinary").v2;

const app  = express();
const PORT = process.env.PORT || 8080;

// ── CLOUDINARY CONFIG ─────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── MULTER (memoria temporal para uploads) ────────────────
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Solo JPG, PNG, WEBP y PDF"));
  }
});

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ── RUTAS HTML ────────────────────────────────────────────
app.get("/",            (req, res) => res.sendFile(path.join(__dirname, "sosati-appointment.html")));
app.get("/appointment", (req, res) => res.sendFile(path.join(__dirname, "sosati-appointment.html")));
app.get("/confirm",     (req, res) => res.sendFile(path.join(__dirname, "sosati-confirm.html")));
app.get("/admin",       (req, res) => res.sendFile(path.join(__dirname, "sosati-admin.html")));

// ── API: SUBIR DOCUMENTO ──────────────────────────────────
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibio ningun archivo" });

    const { clientName, appointmentId, docType } = req.body;
    const folder   = "sosati/seal-services/" + (appointmentId || "general");
    const publicId = (docType || "doc") + "-" + Date.now();

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id:     publicId,
          resource_type: "auto",
          tags:          ["sosati", "seal-services", docType || "document"],
          context: {
            client_name:    clientName || "",
            appointment_id: appointmentId || "",
            doc_type:       docType || "other"
          }
        },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    res.json({
      success:  true,
      url:      result.secure_url,
      publicId: result.public_id,
      format:   result.format,
      size:     result.bytes
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Error al subir archivo" });
  }
});

// ── API: OBTENER DOCUMENTOS DE UNA CITA ──────────────────
app.get("/api/documents/:appointmentId", async (req, res) => {
  try {
    const folder = "sosati/seal-services/" + req.params.appointmentId;
    const result = await cloudinary.api.resources({ type: "upload", prefix: folder, max_results: 50 });
    const docs = result.resources.map(r => ({
      url: r.secure_url, publicId: r.public_id, format: r.format, size: r.bytes, createdAt: r.created_at
    }));
    res.json({ success: true, documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: ELIMINAR DOCUMENTO ───────────────────────────────
app.delete("/api/documents/*", async (req, res) => {
  req.params.publicId = req.params[0];
  try {
    await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: HEALTH CHECK ─────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "SOSATI", time: new Date().toISOString() });
});

// ── START ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("SOSATI corriendo en puerto " + PORT);
  console.log("Cloudinary: " + (process.env.CLOUDINARY_CLOUD_NAME ? "Conectado" : "No configurado"));
});
