// ============================================================
// SOSATI CORE — Cerebro del sistema de citas
// Seal Services | sosati.app/sealservices/appointment
// v2.0 — Con Supabase
// ============================================================

const SOSATI = {

  // ── CONFIGURACIÓN ─────────────────────────────────────────
  config: {
    officeName: "Seal Services",
    phone: "(559) 266-6555",
    email: "sealservices@comcast.net",
    apiBase: "",  // vacío = mismo dominio (Railway)
    locations: [
      { id: "belmont",  label: "Main Office — 3270 E. Belmont Ave, Fresno CA 93702",    tel: "(559) 266-6555" },
      { id: "ventura",  label: "Ventura Blvd — 3259 E. Ventura Blvd, Fresno CA 93702",  tel: "(559) 493-5911" },
      { id: "kings",    label: "Kings Canyon — 4244 E Kings Canyon Rd #103, Fresno CA 93702", tel: "(559) 493-5911" }
    ],
    services: [
      { id: "tax",        label: "Impuestos",       icon: "" },
      { id: "accounting", label: "Contabilidad",    icon: "" },
      { id: "dmv",        label: "DMV / Vehículos", icon: "" },
      { id: "insurance",  label: "Aseguranza",      icon: "" },
      { id: "notary",     label: "Notario",         icon: "" },
      { id: "general",    label: "Asesoría General",icon: "" }
    ],
    timeSlots: [
      "10:00 AM", "11:00 AM", "12:00 PM",
      "1:00 PM",  "2:00 PM",  "3:00 PM",
      "4:00 PM",  "5:00 PM",  "6:00 PM"
    ],
    adminPassword: "sosati2024",
    broadcastChannel: "sosati_appointments"
  },

  // ── API (Supabase via server) ──────────────────────────────
  api: {
    async request(method, path, body) {
      const opts = {
        method,
        headers: { "Content-Type": "application/json" }
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(SOSATI.config.apiBase + path, opts);
      return res.json();
    },
    async getAppointments(filters) {
      let path = "/api/appointments";
      const params = new URLSearchParams();
      if (filters?.date)   params.set("date", filters.date);
      if (filters?.status) params.set("status", filters.status);
      if (params.toString()) path += "?" + params.toString();
      return this.request("GET", path);
    },
    async createAppointment(appt) {
      return this.request("POST", "/api/appointments", appt);
    },
    async updateStatus(id, status) {
      return this.request("PATCH", "/api/appointments/" + id, { status });
    },
    async deleteAppointment(id) {
      return this.request("DELETE", "/api/appointments/" + id);
    }
  },

  // ── STORAGE LOCAL (fallback + cache) ──────────────────────
  storage: {
    getAll() {
      try { return JSON.parse(localStorage.getItem("sosati_appointments") || "[]"); }
      catch { return []; }
    },
    save(appointments) {
      localStorage.setItem("sosati_appointments", JSON.stringify(appointments));
    },
    addLocal(appt) {
      const all = this.getAll();
      all.unshift(appt);
      this.save(all);
    },
    getByDate(dateStr) {
      return this.getAll().filter(a => a.date === dateStr);
    }
  },

  // ── CREAR CITA ────────────────────────────────────────────
  async createAppointment(formData) {
    const id = "APT-" + Date.now().toString(36).toUpperCase();
    const appt = {
      id,
      name:           formData.name.trim(),
      phone:          formData.phone.trim(),
      email:          formData.email?.trim() || "",
      service:        formData.service,
      serviceLabel:   this.config.services.find(s => s.id === formData.service)?.label || formData.service,
      date:           formData.date,
      time:           formData.time,
      location:       formData.location,
      locationLabel:  this.config.locations.find(l => l.id === formData.location)?.label || formData.location,
      notes:          formData.notes?.trim() || "",
      status:         "pending",
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString()
    };

    // Guardar en localStorage como cache inmediato
    this.storage.addLocal(appt);
    sessionStorage.setItem("sosati_last_appt", JSON.stringify(appt));

    // Guardar en Supabase (en background)
    try {
      await this.api.createAppointment(appt);
      console.log("Cita guardada en Supabase:", id);
    } catch(err) {
      console.warn("Supabase no disponible, guardado solo local:", err);
    }

    this.broadcast({ type: "NEW_APPOINTMENT", appointment: appt });
    return appt;
  },

  // ── BROADCAST ─────────────────────────────────────────────
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

  // ── AUTH ADMIN ────────────────────────────────────────────
  auth: {
    isLoggedIn() { return sessionStorage.getItem("sosati_admin_auth") === "true"; },
    login(password) {
      if (password === SOSATI.config.adminPassword) {
        sessionStorage.setItem("sosati_admin_auth", "true");
        return true;
      }
      return false;
    },
    logout() { sessionStorage.removeItem("sosati_admin_auth"); }
  },

  // ── HELPERS ───────────────────────────────────────────────
  utils: {
    formatDate(dateStr) {
      if (!dateStr) return "";
      const [y, m, d] = dateStr.split("-");
      const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
      return d + " " + months[parseInt(m)-1] + " " + y;
    },
    todayStr() { return new Date().toISOString().split("T")[0]; },
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

if (typeof module !== "undefined") module.exports = SOSATI;
