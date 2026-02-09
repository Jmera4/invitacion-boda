const supabaseUrl = "https://ygbnuhwwfkzejtzjxyal.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYm51aHd3Zmt6ZWp0emp4eWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTg4NzgsImV4cCI6MjA4NjIzNDg3OH0.f0LlSKDr7zTORVe0DalLy8rW_85v2sLmJF6bILhHZgI";

const db = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);

/* ===== CLAVE PRIVADA ===== */
const ADMIN_KEY = "akari-isai-2026";

/* ===== VALIDAR ACCESO ===== */

const params = new URLSearchParams(window.location.search);
const key = params.get("key");

if (key !== ADMIN_KEY) {
    document.body.innerHTML = "<h2 style='text-align:center;margin-top:50px;'>Acceso no autorizado</h2>";
}

/* ===== CARGAR DATOS ===== */

async function cargarDatos() {

    const { data, error } = await db
        .from("invitaciones")
        .select("*")
        .order("nombre_familia");

    if (error) {
        console.error(error);
        return;
    }

    let total = data.length;
    let confirmados = 0;
    let asistentes = 0;

    const tabla = document.getElementById("tabla");

    data.forEach(inv => {

        if (inv.asistencia === "si") {
            confirmados++;
            asistentes += Number(inv.confirmados || 0);
        }

        tabla.innerHTML += `
            <tr>
                <td>${inv.nombre_familia}</td>
                <td>${inv.pases}</td>
                <td>${inv.confirmados || 0}</td>
                <td>${inv.asistencia || "-"}</td>
                <td>${inv.mensaje || ""}</td>
            </tr>
        `;
    });

    document.getElementById("total").innerText = total;
    document.getElementById("confirmados").innerText = confirmados;
    document.getElementById("asistentes").innerText = asistentes;
}

cargarDatos();
