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
let guestIdSeleccionado = null;
const baseURL = window.location.origin.includes("127.0.0.1")
    ? "https://invitacion-boda-isai-akari.vercel.app/"
    : window.location.origin + "/";

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

        if (ordenEstado[estadoA] !== ordenEstado[estadoB]) {
            return ordenEstado[estadoA] - ordenEstado[estadoB];
        }

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
        console.error("Error:", error);
        return;
    }

    invitacionesGlobal = data || [];

    calcularTotales();
    renderTabla();
}

/* =====================
   GUARDAR MENSAJE
===================== */

document.getElementById("guardar-mensaje")?.addEventListener("click", async () => {

    const mensaje = document.getElementById("mensaje-personalizado").value.trim();

    if (!guestIdSeleccionado) {
        alert("Selecciona un invitado");
        return;
    }

    if (!mensaje) {
        alert("Escribe un mensaje");
        return;
    }

    const { error } = await db
        .from("invitaciones")
        .update({ mensaje_personalizado: mensaje })
        .eq("token", guestIdSeleccionado);

    if (error) {
        console.error(error);
        alert("Error al guardar");
        return;
    }

    showToast("Mensaje enviado ✨");

    cargarDatos(); // refresca
});

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

    document.getElementById("progress-bar").style.width = porcentaje + "%";

    document.getElementById("progress-text").innerText =
        `${totalConfirmados} / ${totalInvitados} (${porcentaje}%)`;
}

/* =====================
   FILTRAR LISTA
===================== */

function obtenerListaFiltrada() {

    let lista = [...invitacionesGlobal];

    if (filtroActivo === "pendientes") {
        return lista.filter(inv => !inv.asistencia);
    }

    if (filtroActivo === "cancelados") {
        return lista.filter(inv => inv.asistencia === "no");
    }

    if (filtroActivo === "banquete") {
        return lista.filter(inv => inv.tipo_invitado === "banquete");
    }

    if (filtroActivo === "baile") {
        return lista.filter(inv => inv.tipo_invitado === "baile");
    }

    if (filtroActivo === "enviados") {
        return lista.filter(inv => inv.enviado === true);
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

        const tipo = (inv.tipo_invitado || "-").toUpperCase();
        const asistencia = (inv.asistencia || "-").toUpperCase();

        tabla.innerHTML += `
        <tr class="${highlightClass} ${inv.enviado ? 'enviado' : ''}">
            <td>
                <input type="checkbox"
                    ${inv.enviado ? "checked" : ""}
                    onchange="toggleEnviado('${inv.token}', this.checked)">
            </td>

            <td>
                <button class="copy-btn" onclick="copiarLink('${inv.token}')">
                    📋
                </button>
            </td>

            <td class="col-nombre">${inv.nombre_familia.toUpperCase()}</td>
            <td class="col-miembros">${inv.miembros || "-"}</td>
            <td>${tipo}</td>
            <td>${inv.mesa || "-"}</td>
            <td>${pases}</td>
            <td>${confirmados}</td>
            <td>${asistencia}</td>
            <td>${inv.mensaje || ""}</td>
            <td>${inv.mensaje_personalizado || ""}</td>
        </tr>
        `;
    });
}

/* =====================
   SELECCIONAR INVITADO
===================== */

// function seleccionarInvitado(token, nombre) {

//     guestIdSeleccionado = token;

//     const invitado = invitacionesGlobal.find(i => i.token === token);

//     document.getElementById("mensaje-personalizado").value =
//         invitado?.mensaje_personalizado || "";

//     alert("Editando: " + nombre);
// }

/* =====================
   BUSCADOR
===================== */

function initBuscadorInvitados() {

    const input = document.getElementById("buscar-invitado");
    const resultados = document.getElementById("resultados-busqueda");

    if (!input || !resultados) return;

    input.addEventListener("input", () => {

        const valor = input.value.toLowerCase().trim();

        resultados.innerHTML = "";

        if (!valor) {
            resultados.classList.add("hidden");
            return;
        }

        const filtrados = invitacionesGlobal.filter(inv =>
            inv.nombre_familia.toLowerCase().includes(valor)
        );

        if (!filtrados.length) {
            resultados.classList.add("hidden");
            return;
        }

        resultados.classList.remove("hidden");

        filtrados.forEach(inv => {

            const div = document.createElement("div");
            div.className = "resultado-item";
            div.innerText = `${inv.nombre_familia} · ${inv.miembros || ""}`;

            div.onclick = () => {

                guestIdSeleccionado = inv.token;

                input.value = inv.nombre_familia;

                document.getElementById("mensaje-personalizado").value =
                    inv.mensaje_personalizado || "";

                resultados.classList.add("hidden");
            };

            resultados.appendChild(div);
        });
    });

    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !resultados.contains(e.target)) {
            resultados.classList.add("hidden");
        }
    });
}

/* =====================
   FILTROS
===================== */

function initFiltros() {

    document.querySelectorAll(".filter-btn").forEach(btn => {

        btn.addEventListener("click", () => {

            document.querySelectorAll(".filter-btn")
                .forEach(b => b.classList.remove("active"));

            btn.classList.add("active");

            filtroActivo = btn.id.replace("filter-", "");
            renderTabla();
        });
    });
}
function showToast(texto = "Mensaje guardado ✨") {

    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.innerText = texto;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}
function copiarLink(token) {

    const link = `${baseURL}?id=${token}`;

    navigator.clipboard.writeText(link);

    mostrarToast("Link copiado ✨");
}
async function toggleEnviado(token, estado) {

    await db
        .from("invitaciones")
        .update({ enviado: estado })
        .eq("token", token);

    mostrarToast(
        estado ? "Marcado como enviado ✅" : "Desmarcado ❌"
    );
}
function mostrarToast(texto) {

    const toast = document.getElementById("toast");

    toast.innerText = texto;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

/* =====================
   INIT
===================== */

window.addEventListener("load", () => {

    initFiltros();
    initBuscadorInvitados();
    cargarDatos();

    setInterval(cargarDatos, 15000);
});

