// SOSATI — Express Server
// Seal Services Appointment System
// Con Supabase + Cloudinary

const express    = require("express");
const path       = require("path");
const multer     = require("multer");
const cloudinary = require("cloudinary").v2;
const { createClient } = require("@supabase/supabase-js");

const app  = express();
const PORT = process.env.PORT || 8080;

// ── SUPABASE ──────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("Supabase: Conectado");
} else {
  console.warn("Supabase: No configurado - usando modo local");
}

// ── CLOUDINARY ────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── MULTER ────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
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

// ── API: CREAR CITA ───────────────────────────────────────
app.post("/api/appointments", async (req, res) => {
  try {
    const appt = req.body;
    if (!supabase) throw new Error('Supabase no configurado');
    const { data, error } = await supabase
      .from("appointments")
      .insert([{
        id:             appt.id,
        name:           appt.name,
        phone:          appt.phone,
        email:          appt.email || null,
        service:        appt.service,
        service_label:  appt.serviceLabel,
        date:           appt.date,
        time:           appt.time,
        location:       appt.location,
        location_label: appt.locationLabel,
        notes:          appt.notes || null,
        status:         "pending"
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, appointment: data });
  } catch (err) {
    console.error("Create appointment error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── API: OBTENER TODAS LAS CITAS ──────────────────────────
app.get("/api/appointments", async (req, res) => {
  try {
    let query = supabase.from("appointments").select("*").order("date", { ascending: true });

    if (req.query.date)   query = query.eq("date", req.query.date);
    if (req.query.status) query = query.eq("status", req.query.status);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, appointments: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: ACTUALIZAR ESTADO ────────────────────────────────
app.patch("/api/appointments/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, appointment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: ELIMINAR CITA ────────────────────────────────────
app.delete("/api/appointments/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: SUBIR DOCUMENTO ──────────────────────────────────
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibio ningun archivo" });

    const { clientName, appointmentId, docType } = req.body;
    const folder   = "sosati/seal-services/" + (appointmentId || "general");
    const publicId = (docType || "doc") + "-" + Date.now();

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, public_id: publicId, resource_type: "auto",
          tags: ["sosati", "seal-services", docType || "document"],
          context: { client_name: clientName || "", appointment_id: appointmentId || "", doc_type: docType || "other" }
        },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    res.json({ success: true, url: result.secure_url, publicId: result.public_id, format: result.format, size: result.bytes });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── API: HEALTH CHECK ─────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status:     "ok",
    service:    "SOSATI",
    supabase:   process.env.SUPABASE_URL ? "conectado" : "no configurado",
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? "conectado" : "no configurado",
    time:       new Date().toISOString()
  });
});

// ── START ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("SOSATI corriendo en puerto " + PORT);
  console.log("Supabase:   " + (process.env.SUPABASE_URL ? "Conectado" : "No configurado"));
  console.log("Cloudinary: " + (process.env.CLOUDINARY_CLOUD_NAME ? "Conectado" : "No configurado"));
});
