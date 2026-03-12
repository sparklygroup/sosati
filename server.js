// SOSATI — Express Server
// Seal Services Appointment System
// Con Supabase + Cloudinary

const express    = require("express");
const path       = require("path");
const multer     = require("multer");
const cloudinary = require("cloudinary").v2;
const { createClient } = require("@supabase/supabase-js");
const docusign = require("docusign-esign");

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

// ── API: OBTENER DOCUMENTOS DE UNA CITA ──────────────────
app.get("/api/documents/:appointmentId", async (req, res) => {
  try {
    const folder = "sosati/seal-services/" + req.params.appointmentId;
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: folder,
      max_results: 50
    });
    const docs = result.resources.map(r => ({
      url: r.secure_url,
      publicId: r.public_id,
      format: r.format,
      size: r.bytes,
      createdAt: r.created_at
    }));
    res.json({ success: true, documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DOCUSIGN: JWT TOKEN ───────────────────────────────────
async function getDocuSignJWTToken() {
  const dsClient = new docusign.ApiClient();
  dsClient.setBasePath(process.env.DOCUSIGN_BASE_URI + "/restapi");
  dsClient.setOAuthBasePath("account-d.docusign.com");

  // Reconstruct private key as Buffer (Railway stores as single line base64 body)
  const privateKeyRaw = process.env.DOCUSIGN_PRIVATE_KEY || "";
  let privateKeyStr;
  if (privateKeyRaw.includes("-----BEGIN RSA PRIVATE KEY-----")) {
    privateKeyStr = privateKeyRaw.replace(/\\n/g, "\n");
  } else {
    const body = privateKeyRaw.match(/.{1,64}/g).join("\n");
    privateKeyStr = "-----BEGIN RSA PRIVATE KEY-----\n" + body + "\n-----END RSA PRIVATE KEY-----\n";
  }
  const privateKey = Buffer.from(privateKeyStr);

  const results = await dsClient.requestJWTUserToken(
    process.env.DOCUSIGN_INTEGRATION_KEY,
    process.env.DOCUSIGN_USER_ID,
    ["signature", "impersonation"],
    privateKey,
    3600
  );
  console.log("DocuSign token OK");
  return results.body.access_token;
}

// ── DOCUSIGN: ENVIAR SOBRE PARA FIRMA ────────────────────
app.post("/api/docusign/send", async (req, res) => {
  try {
    const { appointmentId, clientName, clientEmail, documentUrl, documentName } = req.body;
    if (!clientEmail) return res.status(400).json({ error: "Se requiere email del cliente" });

    // Obtener token JWT
    console.log("Getting DocuSign token...");
    const accessToken = await getDocuSignJWTToken();
    console.log("Token obtained:", accessToken ? "YES" : "NO");

    // Configurar cliente
    const dsClient = new docusign.ApiClient();
    dsClient.setBasePath(process.env.DOCUSIGN_BASE_URI + "/restapi");
    dsClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

    // Generar URL firmada de Cloudinary
    const ext = documentUrl.split(".").pop().toLowerCase().split("?")[0];
    const fileExt = ["jpg","jpeg","png","webp"].includes(ext) ? ext : "pdf";
    const urlParts = documentUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    let fetchUrl = documentUrl;
    if (urlParts) {
      const publicId = urlParts[1];
      const resourceType = fileExt === "pdf" ? "raw" : "image";
      fetchUrl = cloudinary.url(publicId, {
        resource_type: resourceType,
        sign_url: true,
        type: "upload",
        format: fileExt
      });
    }
    console.log("Fetching doc from:", fetchUrl.substring(0, 80));
    const docResponse = await fetch(fetchUrl);
    console.log("Doc fetch status:", docResponse.status);
    const docBuffer = await docResponse.arrayBuffer();
    console.log("Doc buffer size:", docBuffer.byteLength);
    const docBase64 = Buffer.from(docBuffer).toString("base64");

    // Crear documento
    const document = docusign.Document.constructFromObject({
      documentBase64: docBase64,
      name: documentName || "Documento",
      fileExtension: fileExt,
      documentId: "1"
    });

    // Crear firmante
    const signer = docusign.Signer.constructFromObject({
      email: clientEmail,
      name: clientName,
      recipientId: "1",
      routingOrder: "1"
    });

    // Crear sobre
    const envelope = docusign.EnvelopeDefinition.constructFromObject({
      emailSubject: "Seal Services — Documento para firmar",
      documents: [document],
      recipients: docusign.Recipients.constructFromObject({ signers: [signer] }),
      status: "sent"
    });

    console.log("DocuSign accountId:", process.env.DOCUSIGN_ACCOUNT_ID);
    console.log("DocuSign documentUrl:", documentUrl);
    console.log("DocuSign clientEmail:", clientEmail);
    console.log("DocuSign basePath:", process.env.DOCUSIGN_BASE_URI + "/restapi");
    const envelopesApi = new docusign.EnvelopesApi(dsClient);
    const result = await envelopesApi.createEnvelope(
      process.env.DOCUSIGN_ACCOUNT_ID,
      { envelopeDefinition: envelope }
    );

    res.json({
      success: true,
      envelopeId: result.envelopeId,
      status: result.status,
      message: "Documento enviado a " + clientEmail + " para firma"
    });

  } catch (err) {
    const detail = err.response?.body || err.message || String(err);
    console.error("DocuSign error status:", err.status || err.statusCode || "none");
    console.error("DocuSign error body:", JSON.stringify(err.response?.body));
    console.error("DocuSign error msg:", err.message);
    res.status(500).json({ error: err.message || "Error al enviar documento" });
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
