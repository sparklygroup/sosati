// SOSATI — Express Server
// Seal Services Appointment System

const express = require("express");
const path    = require("path");
const app     = express();
const PORT    = process.env.PORT || 8080;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Rutas principales
app.get("/",            (req, res) => res.sendFile(path.join(__dirname, "sosati-appointment.html")));
app.get("/appointment", (req, res) => res.sendFile(path.join(__dirname, "sosati-appointment.html")));
app.get("/confirm",     (req, res) => res.sendFile(path.join(__dirname, "sosati-confirm.html")));
app.get("/admin",       (req, res) => res.sendFile(path.join(__dirname, "sosati-admin.html")));

app.listen(PORT, () => {
  console.log(`SOSATI corriendo en puerto ${PORT}`);
});
