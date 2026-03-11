// ============================================================
// SOSATI CORE — Cerebro del sistema de citas
// Seal Services | sosati.app/sealservices/appointment
// ============================================================

const SOSATI = {

  // ── CONFIGURACIÓN ─────────────────────────────────────────
  config: {
    officeName: "Seal Services",
    phone: "(559) 266-6555",
    email: "sealservices@comcast.net",
    locations: [
      { id: "belmont",  label: "Main Office — 3270 E. Belmont Ave, Fresno CA 93702",   tel: "(559) 266-6555" },
      { id: "ventura",  label: "Ventura Blvd — 3259 E. Ventura Blvd, Fresno CA 93702", tel: "(559) 493-5911" },
      { id: "kings",    label: "Kings Canyon — 4244 E Kings Canyon Rd #103, Fresno CA 93702", tel: "(559) 493-5911" }
    ],
    services: [
      { id: "tax",       label: "Impuestos (Tax)",          icon: "📋" },
      { id: "insurance", label: "Aseguranza (Insurance)",   icon: "🛡️" },
      { id: "notary",    label: "Notario (Notary Public)",  icon: "✍️" },
      { id: "dmv",       label: "Registro de Vehículo (DMV)", icon: "🚗" },
      { id: "accounting",label: "Contabilidad",             icon: "📊" },
      { id: "general",   label: "Asesoría General",         icon: "💬" }
    ],
    // Horarios disponibles 10am - 6pm (cada hora)
    timeSlots: [
      "10:00 AM", "11:00 AM", "12:00 PM",
      "1:00 PM",  "2:00 PM",  "3:00 PM",
      "4:00 PM",  "5:00 PM",  "6:00 PM"
    ],
    adminPassword: "sosati2024",  // Fase 2: reemplazar con auth real
    broadcastChannel: "sosati_appointments"
  },

  // ── STORAGE ───────────────────────────────────────────────
  storage: {
    getAll() {
      try {
        return JSON.parse(localStorage.getItem("sosati_appointments") || "[]");
      } catch { return []; }
    },
    save(appointments) {
      localStorage.setItem("sosati_appointments", JSON.stringify(appointments));
    },
    addAppointment(appt) {
      const all = this.getAll();
      all.unshift(appt); // más reciente primero
      this.save(all);
      return appt;
    },
    getByDate(dateStr) {
      return this.getAll().filter(a => a.date === dateStr);
    },
    getById(id) {
      return this.getAll().find(a => a.id === id);
    },
    updateStatus(id, status) {
      const all = this.getAll();
      const idx = all.findIndex(a => a.id === id);
      if (idx !== -1) {
        all[idx].status = status;
        all[idx].updatedAt = new Date().toISOString();
        this.save(all);
        SOSATI.broadcast({ type: "STATUS_UPDATE", id, status });
        return all[idx];
      }
    },
    delete(id) {
      const all = this.getAll().filter(a => a.id !== id);
      this.save(all);
      SOSATI.broadcast({ type: "DELETED", id });
    }
  },

  // ── CITAS ─────────────────────────────────────────────────
  createAppointment(formData) {
    const id = "APT-" + Date.now().toString(36).toUpperCase();
    const appt = {
      id,
      name:      formData.name.trim(),
      phone:     formData.phone.trim(),
      email:     formData.email?.trim() || "",
      service:   formData.service,
      serviceLabel: this.config.services.find(s => s.id === formData.service)?.label || formData.service,
      date:      formData.date,
      time:      formData.time,
      location:  formData.location,
      locationLabel: this.config.locations.find(l => l.id === formData.location)?.label || formData.location,
      notes:     formData.notes?.trim() || "",
      status:    "pending",   // pending | confirmed | completed | cancelled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.storage.addAppointment(appt);
    this.broadcast({ type: "NEW_APPOINTMENT", appointment: appt });
    // Guardar última cita para pantalla de confirmación
    sessionStorage.setItem("sosati_last_appt", JSON.stringify(appt));
    return appt;
  },

  // ── BROADCAST (comunicación entre pantallas) ──────────────
  _channel: null,
  initBroadcast(onMessage) {
    this._channel = new BroadcastChannel(this.config.broadcastChannel);
    this._channel.onmessage = (e) => onMessage(e.data);
  },
  broadcast(data) {
    if (this._channel) this._channel.postMessage(data);
    else {
      const ch = new BroadcastChannel(this.config.broadcastChannel);
      ch.postMessage(data);
      ch.close();
    }
  },

  // ── AUTH ADMIN (simple para MVP) ─────────────────────────
  auth: {
    isLoggedIn() {
      return sessionStorage.getItem("sosati_admin_auth") === "true";
    },
    login(password) {
      if (password === SOSATI.config.adminPassword) {
        sessionStorage.setItem("sosati_admin_auth", "true");
        return true;
      }
      return false;
    },
    logout() {
      sessionStorage.removeItem("sosati_admin_auth");
    }
  },

  // ── HELPERS ───────────────────────────────────────────────
  utils: {
    formatDate(dateStr) {
      if (!dateStr) return "";
      const [y, m, d] = dateStr.split("-");
      const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
      return `${d} ${months[parseInt(m)-1]} ${y}`;
    },
    todayStr() {
      return new Date().toISOString().split("T")[0];
    },
    statusLabel(status) {
      const map = {
        pending:   { text: "Pendiente",  color: "#f59e0b" },
        confirmed: { text: "Confirmada", color: "#10b981" },
        completed: { text: "Completada", color: "#6366f1" },
        cancelled: { text: "Cancelada",  color: "#ef4444" }
      };
      return map[status] || map.pending;
    },
    getAvailableSlots(dateStr, locationId) {
      const taken = SOSATI.storage.getByDate(dateStr)
        .filter(a => a.location === locationId && a.status !== "cancelled")
        .map(a => a.time);
      return SOSATI.config.timeSlots.filter(t => !taken.includes(t));
    }
  }
};

// Exportar para uso en otros archivos
if (typeof module !== "undefined") module.exports = SOSATI;
