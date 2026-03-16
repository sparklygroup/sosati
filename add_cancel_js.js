const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-appointment.html', 'utf8');

const cancelJS = `
      var _foundAppt = null;

      function showCancelForm() {
        document.getElementById("cancel-form").style.display = "block";
        document.getElementById("cancel-result").style.display = "none";
        document.getElementById("cancel-phone").value = "";
        document.getElementById("cancel-search-btn").textContent = "Buscar mi cita";
        document.getElementById("cancel-form").scrollIntoView({ behavior: "smooth", block: "center" });
      }

      function hideCancelForm() {
        document.getElementById("cancel-form").style.display = "none";
        document.getElementById("cancel-phone").value = "";
        document.getElementById("cancel-result").style.display = "none";
        _foundAppt = null;
      }

      async function searchAndCancel() {
        var phone = document.getElementById("cancel-phone").value.trim().replace(/\\D/g,"");
        if (!phone || phone.length < 7) { showToast("Ingresa tu numero de telefono", "error"); return; }
        var btn = document.getElementById("cancel-search-btn");
        btn.textContent = "Buscando...";
        btn.disabled = true;
        try {
          var resp = await fetch("/api/appointments");
          var data = await resp.json();
          var all = data.appointments || [];
          var matches = all.filter(function(a){
            return a.phone && a.phone.replace(/\\D/g,"").includes(phone) && a.status !== "cancelled";
          });
          if (!matches.length) {
            document.getElementById("cancel-result").style.display = "block";
            document.getElementById("cancel-result").innerHTML = '<div style="background:#fef3c7;border-radius:8px;padding:12px;font-size:13px;color:#92400e">No encontramos citas activas con ese numero. Llama al <a href="tel:5592666555" style="color:var(--brand);font-weight:600">(559) 266-6555</a></div>';
            btn.textContent = "Buscar mi cita"; btn.disabled = false;
            return;
          }
          _foundAppt = matches[0];
          var SVC = { tax:"Impuestos", accounting:"Contabilidad", dmv:"DMV", insurance:"Aseguranza", notary:"Notario", general:"Asesoria" };
          var DAYS = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
          var d = new Date(_foundAppt.date + "T12:00:00");
          var dateStr = DAYS[d.getDay()] + " " + d.getDate() + "/" + (d.getMonth()+1);
          document.getElementById("cancel-result").style.display = "block";
          document.getElementById("cancel-result").innerHTML =
            '<div style="background:#fff;border-radius:8px;padding:12px;border:1.5px solid var(--brand);margin-bottom:10px">' +
              '<div style="font-size:12px;color:var(--gray-400);margin-bottom:4px">Cita encontrada</div>' +
              '<div style="font-size:15px;font-weight:700;color:var(--brand)">' + _foundAppt.name + '</div>' +
              '<div style="font-size:13px;color:var(--gray-600);margin-top:2px">' + (SVC[_foundAppt.service] || _foundAppt.service) + ' · ' + dateStr + ' · ' + _foundAppt.time + '</div>' +
              '<div style="font-size:12px;color:var(--gray-400);margin-top:2px">' + (_foundAppt.locationLabel || '') + '</div>' +
            '</div>' +
            '<button onclick="confirmCancelAppt()" style="width:100%;background:var(--brand);border:none;border-radius:99px;padding:12px;font-family:var(--font-body);font-size:13px;font-weight:600;color:#fff;cursor:pointer">Confirmar cancelacion</button>';
          btn.textContent = "Buscar mi cita"; btn.disabled = false;
        } catch(e) {
          showToast("Error al buscar. Llama al (559) 266-6555", "error");
          btn.textContent = "Buscar mi cita"; btn.disabled = false;
        }
      }

      async function confirmCancelAppt() {
        if (!_foundAppt) return;
        try {
          var resp = await fetch("/api/appointments/" + _foundAppt.id, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "cancelled" })
          });
          var result = await resp.json();
          if (result.success) {
            hideCancelForm();
            showToast("Cita cancelada correctamente", "success");
            _foundAppt = null;
          } else {
            showToast("Error al cancelar. Llama al (559) 266-6555", "error");
          }
        } catch(e) {
          showToast("Error al cancelar. Llama al (559) 266-6555", "error");
        }
      }
`;

// Insert before closing script tag
const lastScript = c.lastIndexOf('</script>');
c = c.substring(0, lastScript) + cancelJS + c.substring(lastScript);

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-appointment.html', c);
console.log('OK - functions added:', c.includes('searchAndCancel') ? 'YES' : 'NO');
