const supabaseUrl = "https://ygbnuhwwfkzejtzjxyal.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYm51aHd3Zmt6ZWp0emp4eWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTg4NzgsImV4cCI6MjA4NjIzNDg3OH0.f0LlSKDr7zTORVe0DalLy8rW_85v2sLmJF6bILhHZgI";

const db = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);

/* =====================
   CLAVE PRIVADA
===================== */

const ADMIN_KEY = "akari-isai-2026";

const params = new URLSearchParams(window.location.search);
const key = params.get("key");

if (key !== ADMIN_KEY) {
    document.body.innerHTML =
        "<h2 style='text-align:center;margin-top:50px;'>Acceso no autorizado</h2>";
}


/* =====================
   VARIABLES
===================== */

let invitacionesGlobal = [];
let filtroActivo = "todos";


/* =====================
   CARGAR DATOS
===================== */

async function cargarDatos() {

    const { data, error } = await db
        .from("invitaciones")
        .select("*")
        .order("nombre_familia");

    if (error) {
        console.error(error);
        return;
    }

    invitacionesGlobal = data;

    calcularTotales();
    renderTabla();
}


/* =====================
   CALCULAR TOTALES
===================== */

function calcularTotales() {

    let totalInvitados = 0;
    let totalConfirmados = 0;
    let totalAsistentes = 0;

    invitacionesGlobal.forEach(inv => {

        const pases = Number(inv.pases || 0);
        const confirmados = Number(inv.confirmados || 0);

        totalInvitados += pases;

        if (inv.asistencia === "si") {
            totalConfirmados += confirmados;
            totalAsistentes += confirmados;
        }
    });

    const porcentaje = totalInvitados > 0
        ? Math.round((totalConfirmados / totalInvitados) * 100)
        : 0;

    document.getElementById("total").innerText = totalInvitados;
    document.getElementById("confirmados").innerText = totalConfirmados;
    document.getElementById("asistentes").innerText = totalAsistentes;

    document.getElementById("progress-bar").style.width =
        porcentaje + "%";

    document.getElementById("progress-text").innerText =
        `${totalConfirmados} / ${totalInvitados} confirmados (${porcentaje}%)`;
}


/* =====================
   RENDER TABLA
===================== */

function renderTabla() {

    const tabla = document.getElementById("tabla");
    tabla.innerHTML = "";

    let lista = [...invitacionesGlobal];

    if (filtroActivo === "todos") {

        lista.sort((a, b) => {

            const orden = {
                "si": 1,
                null: 2,
                "no": 3
            };

            const estadoA = a.asistencia ?? null;
            const estadoB = b.asistencia ?? null;

            return orden[estadoA] - orden[estadoB];
        });
    }

    if (filtroActivo === "pendientes") {
        lista = lista
            .filter(inv => inv.asistencia === null)
            .sort((a, b) =>
                Number(b.pases || 0) - Number(a.pases || 0)
            );
    }

    if (filtroActivo === "cancelados") {
        lista = lista.filter(inv => inv.asistencia === "no");
    }

    lista.forEach(inv => {

        const pases = Number(inv.pases || 0);
        const confirmados = Number(inv.confirmados || 0);

        const highlightClass =
            (inv.asistencia !== "si" && pases >= 4)
                ? "pending-highlight"
                : "";

        tabla.innerHTML += `
            <tr class="${highlightClass}">
                <td>${inv.nombre_familia}</td>
                <td>${pases}</td>
                <td>${confirmados}</td>
                <td>${inv.asistencia || "-"}</td>
                <td>${inv.mensaje || ""}</td>
            </tr>
        `;
    });

    actualizarResumenFiltro();
}
function actualizarResumenFiltro() {

    const summary = document.getElementById("filter-summary");
    if (!summary) return;

    if (filtroActivo === "todos") {
        summary.classList.add("hidden");
        return;
    }

    let familias = 0;
    let personas = 0;

    invitacionesGlobal.forEach(inv => {

        const pases = Number(inv.pases || 0);

        if (filtroActivo === "pendientes" && !inv.asistencia){
            familias++;
            personas += pases;
        }

        if (filtroActivo === "cancelados" && inv.asistencia === "no") {
            familias++;
            personas += pases;
        }
    });

    if (filtroActivo === "pendientes") {
        summary.innerHTML =
            `Pendientes: <strong>${familias}</strong> familias (${personas} personas)`;
    }

    if (filtroActivo === "cancelados") {
        summary.innerHTML =
            `Cancelados: <strong>${familias}</strong> familias (${personas} personas)`;
    }

    summary.classList.remove("hidden");
}



/* =====================
   BOTONES FILTRO
===================== */

const btnAll = document.getElementById("filter-all");
const btnPending = document.getElementById("filter-pending");
const btnCancelled = document.getElementById("filter-cancelled");

function activarBotonActivo(boton) {
    document.querySelectorAll(".filter-btn")
        .forEach(btn => btn.classList.remove("active"));

    boton.classList.add("active");
}

btnAll.addEventListener("click", () => {
    filtroActivo = "todos";
    activarBotonActivo(btnAll);
    renderTabla();
});

btnPending.addEventListener("click", () => {
    filtroActivo = "pendientes";
    activarBotonActivo(btnPending);
    renderTabla();
});

btnCancelled.addEventListener("click", () => {
    filtroActivo = "cancelados";
    activarBotonActivo(btnCancelled);
    renderTabla();
});


/* =====================
   INICIAR
===================== */

window.addEventListener("load", () => {

    cargarDatos();

    setInterval(cargarDatos, 30000);

});