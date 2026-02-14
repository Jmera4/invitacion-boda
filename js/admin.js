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
   VARIABLES GLOBALES
===================== */

let invitacionesGlobal = [];
let filtroActivo = "todos";

/* =====================
   ORDENAR INVITADOS
===================== */

function ordenarInvitados(lista) {

    const ordenEstado = {
        "si": 1,
        null: 2,
        undefined: 2,
        "no": 3
    };

    return lista.sort((a, b) => {

        const estadoA = a.asistencia ?? null;
        const estadoB = b.asistencia ?? null;

        // Confirmados arriba
        if (ordenEstado[estadoA] !== ordenEstado[estadoB]) {
            return ordenEstado[estadoA] - ordenEstado[estadoB];
        }

        // Dentro del mismo estado ordenar por mesa
        const mesaA = Number(a.mesa || 999);
        const mesaB = Number(b.mesa || 999);

        return mesaA - mesaB;
    });
}

/* =====================
   CARGAR DATOS
===================== */

async function cargarDatos() {

    const { data, error } = await db
        .from("invitaciones")
        .select("*")
        .order("nombre_familia");

    if (error) {
        console.error("Error cargando datos:", error);
        return;
    }

    invitacionesGlobal = data || [];

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
   FILTRAR LISTA
===================== */

function obtenerListaFiltrada() {

    let lista = [...invitacionesGlobal];

    if (filtroActivo === "pendientes") {
        return lista
            .filter(inv => !inv.asistencia)
            .sort((a, b) =>
                Number(b.pases || 0) - Number(a.pases || 0)
            );
    }

    if (filtroActivo === "cancelados") {
        return ordenarInvitados(
            lista.filter(inv => inv.asistencia === "no")
        );
    }

    if (filtroActivo === "banquete") {
        return ordenarInvitados(
            lista.filter(inv => inv.tipo_invitado === "banquete")
        );
    }

    if (filtroActivo === "baile") {
        return ordenarInvitados(
            lista.filter(inv => inv.tipo_invitado === "baile")
        );
    }

    return ordenarInvitados(lista);
}

/* =====================
   RENDER TABLA
===================== */

function renderTabla() {

    const tabla = document.getElementById("tabla");
    tabla.innerHTML = "";

    const lista = obtenerListaFiltrada();

    lista.forEach(inv => {

        const pases = Number(inv.pases || 0);
        const confirmados = Number(inv.confirmados || 0);

        const highlightClass =
            (!inv.asistencia && pases >= 4)
                ? "pending-highlight"
                : "";

        tabla.innerHTML += `
            <tr class="${highlightClass}">
                <td>${inv.nombre_familia}</td>
                <td>${inv.tipo_invitado || "-"}</td>
                <td>${inv.mesa || "-"}</td>
                <td>${pases}</td>
                <td>${confirmados}</td>
                <td>${inv.asistencia || "-"}</td>
                <td>${inv.mensaje || ""}</td>
            </tr>
        `;
    });

    actualizarResumenFiltro();
}

/* =====================
   RESUMEN FILTRO
===================== */

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

        if (filtroActivo === "pendientes" && !inv.asistencia) {
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

function initFiltros() {

    const btnAll = document.getElementById("filter-all");
    const btnPending = document.getElementById("filter-pending");
    const btnCancelled = document.getElementById("filter-cancelled");
    const btnBanquete = document.getElementById("filter-banquete");
    const btnBaile = document.getElementById("filter-baile");

    function activar(btn) {
        document.querySelectorAll(".filter-btn")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");
    }

    btnAll?.addEventListener("click", () => {
        filtroActivo = "todos";
        activar(btnAll);
        renderTabla();
    });

    btnPending?.addEventListener("click", () => {
        filtroActivo = "pendientes";
        activar(btnPending);
        renderTabla();
    });

    btnCancelled?.addEventListener("click", () => {
        filtroActivo = "cancelados";
        activar(btnCancelled);
        renderTabla();
    });

    btnBanquete?.addEventListener("click", () => {
        filtroActivo = "banquete";
        activar(btnBanquete);
        renderTabla();
    });

    btnBaile?.addEventListener("click", () => {
        filtroActivo = "baile";
        activar(btnBaile);
        renderTabla();
    });
}

/* =====================
   INIT
===================== */

window.addEventListener("load", () => {

    initFiltros();
    cargarDatos();

    setInterval(cargarDatos, 30000);
});