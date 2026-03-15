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
  supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
      }
    }
  });
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
app.use(express.static(path.join(__dirname), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Serve static assets under /seal-services/ path too
app.use('/seal-services', express.static(path.join(__dirname), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
}));

// ── RUTAS HTML ────────────────────────────────────────────
// ── LEGACY ROUTES (redirect to /seal-services) ──────────
app.get("/",            (req, res) => res.redirect("/seal-services"));
app.get("/appointment", (req, res) => res.redirect("/seal-services"));
app.get("/confirm",     (req, res) => res.redirect("/seal-services/confirm"));
app.get("/admin",       (req, res) => res.redirect("/seal-services/admin"));

// ── SEAL SERVICES ROUTES ─────────────────────────────────
app.get("/seal-services",           (req, res) => res.sendFile(path.join(__dirname, "sosati-appointment.html")));
app.get("/seal-services/confirm",   (req, res) => res.sendFile(path.join(__dirname, "sosati-confirm.html")));
app.get("/seal-services/admin",     (req, res) => res.sendFile(path.join(__dirname, "sosati-admin.html")));
app.get("/seal-services/requisitos",(req, res) => res.sendFile(path.join(__dirname, "sosati-requisitos.html")));

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
    const { status, envelope_id, signature_status } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (envelope_id !== undefined) updates.envelope_id = envelope_id;
    if (signature_status !== undefined) updates.signature_status = signature_status;
    const { data, error } = await supabase
      .from("appointments")
      .update(updates)
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
      const isPdf = req.file.mimetype === "application/pdf";
      const stream = cloudinary.uploader.upload_stream(
        { folder, public_id: publicId, resource_type: isPdf ? "raw" : "image",
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
    // Fetch both image and raw resource types
    const [imgResult, rawResult] = await Promise.allSettled([
      cloudinary.api.resources({ type: "upload", resource_type: "image", prefix: folder, max_results: 50 }),
      cloudinary.api.resources({ type: "upload", resource_type: "raw", prefix: folder, max_results: 50 })
    ]);
    const imgDocs = imgResult.status === "fulfilled" ? imgResult.value.resources : [];
    const rawDocs = rawResult.status === "fulfilled" ? rawResult.value.resources : [];
    const allDocs = [...imgDocs, ...rawDocs].map(r => ({
      url: r.secure_url,
      publicId: r.public_id,
      format: r.format,
      size: r.bytes,
      createdAt: r.created_at,
      resourceType: r.resource_type
    }));
    allDocs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json({ success: true, documents: allDocs });
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

    // Generar URL correcta de Cloudinary segun tipo de archivo
    const ext = documentUrl.split(".").pop().toLowerCase().split("?")[0];
    const fileExt = ["jpg","jpeg","png","webp"].includes(ext) ? ext : "pdf";
    const urlParts = documentUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    let fetchUrl = documentUrl;
    if (urlParts) {
      const publicId = urlParts[1];
      const resourceType = fileExt === "pdf" ? "raw" : "image";
      // Use signed URL with correct resource type
      fetchUrl = cloudinary.url(publicId, {
        resource_type: resourceType,
        sign_url: true,
        type: "upload",
        format: fileExt
      });
    }
    console.log("Fetching doc from:", fetchUrl.substring(0, 100));
    const docResponse = await fetch(fetchUrl);
    console.log("Doc fetch status:", docResponse.status, "content-type:", docResponse.headers.get("content-type"));
    const docBuffer = await docResponse.arrayBuffer();
    console.log("Doc buffer size:", docBuffer.byteLength);
    if (docBuffer.byteLength === 0) {
      return res.status(400).json({ error: "No se pudo descargar el documento de Cloudinary" });
    }
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

// ── API: BORRAR DOCUMENTO ────────────────────────────────
app.delete("/api/documents/:publicId", async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    const resourceType = req.query.resourceType || "image";
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    if (result.result === "ok" || result.result === "not found") {
      res.json({ success: true });
    } else {
      // Try the other resource type
      const alt = resourceType === "image" ? "raw" : "image";
      const result2 = await cloudinary.uploader.destroy(publicId, { resource_type: alt });
      res.json({ success: true, result: result2 });
    }
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── DOCUSIGN: STATUS Y DOWNLOAD ──────────────────────────
app.get("/api/docusign/status/:envelopeId", async (req, res) => {
  try {
    const accessToken = await getDocuSignJWTToken();
    const dsClient = new docusign.ApiClient();
    dsClient.setBasePath(process.env.DOCUSIGN_BASE_URI + "/restapi");
    dsClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
    const envelopesApi = new docusign.EnvelopesApi(dsClient);
    const result = await envelopesApi.getEnvelope(process.env.DOCUSIGN_ACCOUNT_ID, req.params.envelopeId);
    res.json({ status: result.status, completedDateTime: result.completedDateTime });
  } catch(err) {
    console.error("DocuSign status error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/docusign/download/:envelopeId", async (req, res) => {
  try {
    const accessToken = await getDocuSignJWTToken();
    const url = process.env.DOCUSIGN_BASE_URI + "/restapi/v2.1/accounts/" +
      process.env.DOCUSIGN_ACCOUNT_ID + "/envelopes/" + req.params.envelopeId + "/documents/combined";
    const docRes = await fetch(url, {
      headers: { "Authorization": "Bearer " + accessToken }
    });
    if (!docRes.ok) {
      return res.status(docRes.status).json({ error: "No se pudo descargar" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=documento-firmado.pdf");
    const buf = await docRes.arrayBuffer();
    res.send(Buffer.from(buf));
  } catch(err) {
    console.error("DocuSign download error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── API: HEALTH CHECK ─────────────────────────────────────

app.get('/api/requirements/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const clientId = req.query.client || 'seal-services';
    const { data, error } = await supabase.from('requirements').select('*').eq('client_id', clientId).eq('service_id', serviceId).order('sort_order', { ascending: true });
    if (error) throw error;
    res.json({ success: true, requirements: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/health", async (req, res) => {
  let supabaseStatus = "no configurado";
  let supabaseError = null;
  try {
    const { data, error } = await supabase.from("appointments").select("id").limit(1);
    if (error) { supabaseStatus = "error"; supabaseError = error.message; }
    else { supabaseStatus = "ok - " + (data ? data.length : 0) + " rows"; }
  } catch(e) { supabaseStatus = "exception"; supabaseError = e.message; }
  
  res.json({
    status:     "ok",
    service:    "SOSATI",
    supabase:   supabaseStatus,
    supabaseError: supabaseError,
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
