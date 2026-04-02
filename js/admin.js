// update invitaciones
// set token = encode(gen_random_bytes(6), 'hex')
// where token is null;
// update invitaciones
// set link = 
// 'https://invitacion-boda-isai-akari.vercel.app/?id=' || token;

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
let filtroActivo = "all";
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
    document.getElementById("mensaje-personalizado").value = "";
    document.getElementById("buscar-invitado").value = "";
    guestIdSeleccionado = null;
    showToast("Mensaje enviado ✨");

    cargarDatos(); // refresca
});

/* =====================
   CALCULAR TOTALES
===================== */

function calcularTotales() {

    let totalInvitados = 0;
    let totalConfirmados = 0;
    let totalCancelados = 0;

    invitacionesGlobal.forEach(inv => {

        if (inv.demo) return; // 🔥 IGNORAR DEMO

        const pases = Number(inv.pases || 0);
        const confirmados = Number(inv.confirmados || 0);

        totalInvitados += pases;

        if ((inv.asistencia || "").toLowerCase().trim() === "si") {
            totalConfirmados += confirmados;
        }

        if ((inv.asistencia || "").toLowerCase().trim() === "no") {
            totalCancelados += pases;
        }
    });

    const porcentaje = totalInvitados > 0
        ? Math.round((totalConfirmados / totalInvitados) * 100)
        : 0;

    // 🔥 HEADER
    document.getElementById("stat-total").innerText = totalInvitados;
    document.getElementById("stat-confirmados").innerText = totalConfirmados;
    document.getElementById("stat-cancelados").innerText = totalCancelados;

    // 🔥 PROGRESS
    document.getElementById("progress-bar").style.width = porcentaje + "%";

    document.getElementById("progress-text").innerText =
        `${totalConfirmados} / ${totalInvitados} (${porcentaje}%)`;
}

/* =====================
   FILTRAR LISTA
===================== */

function obtenerListaFiltrada() {

    let lista = invitacionesGlobal.filter(inv => !inv.demo); // 🔥 aquí

    if (filtroActivo === "cancelled") {
        lista = lista.filter(inv =>
            (inv.asistencia || "").toLowerCase().trim() === "no"
        );
    }

    if (filtroActivo === "banquete") {
        lista = lista.filter(inv => inv.tipo_invitado === "banquete");
    }

    if (filtroActivo === "baile") {
        lista = lista.filter(inv => inv.tipo_invitado === "baile");
    }

    if (filtroActivo === "enviados") {
        lista = lista.filter(inv => inv.enviado === true);
    }

    return lista.sort((a, b) =>
        (a.nombre_familia || "").localeCompare(b.nombre_familia || "")
    );
}

let textoBusquedaTabla = "";

function initBuscadorTabla() {

    const input = document.getElementById("buscar-tabla");

    if (!input) return;

    input.addEventListener("input", () => {

        textoBusquedaTabla = input.value.toLowerCase().trim();

        renderTabla(); // 🔥 re-render en vivo
    });
}

/* =====================
   RENDER TABLA
===================== */

function renderTabla() {

    const tabla = document.getElementById("tabla");
    tabla.innerHTML = "";

    const lista = obtenerListaFiltrada().filter(inv => {

        if (!textoBusquedaTabla) return true;

        const busqueda = normalizarTexto(textoBusquedaTabla);

        return (
            normalizarTexto(inv.nombre_familia).includes(busqueda) ||
            normalizarTexto(inv.miembros).includes(busqueda) ||
            normalizarTexto(inv.tipo_invitado).includes(busqueda)
        );
    });

    lista.forEach(inv => {

        const pases = Number(inv.pases || 0);
        const confirmados = Number(inv.confirmados || 0);

        const asistenciaRaw = (inv.asistencia || "").toLowerCase().trim();

        const tipo = (inv.tipo_invitado || "-").toUpperCase();
        let asistencia = (inv.asistencia || "-").toUpperCase();

        let asistenciaClass = "";
        if (asistenciaRaw === "si") asistenciaClass = "asistencia-si";
        if (asistenciaRaw === "no") asistenciaClass = "asistencia-no";

        // 🔥 detectar cancelado
        const isCancelado = asistenciaRaw === "no";

        tabla.innerHTML += `
        <tr class="${isCancelado ? 'cancelado' : ''} ${inv.enviado ? 'enviado' : ''}">
            
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

            <td class="col-nombre">
                ${inv.nombre_familia.toUpperCase()}
            </td>

            <td class="col-miembros">
                ${(inv.miembros || "-").replaceAll("|", "<br>")}
            </td>

            

            <td>
                <input
                    type="number"
                    value="${inv.mesa || ""}"
                    class="input-mesa"
                    onblur="editarMesa('${inv.token}', this.value)"
                >
            </td>

            <td>
                <textarea
                    class="input-detalle"
                    onchange="editarDetalle('${inv.token}', this.value)"
                >${inv.detalle_mesas || ""}</textarea>
            </td>

            <td>${pases}</td>

            <td>${confirmados}</td>

            <td class="${asistenciaClass}">
                ${asistencia}
            </td>

            <td>${inv.mensaje || ""}</td>

            <td>${inv.mensaje_personalizado || ""}</td>

            <td>${tipo}</td>

            <td>
                <button class="delete-btn" onclick="eliminarInvitado('${inv.token}')">
                    🗑️
                </button>
            </td>

        </tr>
        `;
    });
}
/* =====================
   EDITAR MESA
===================== */

async function editarMesa(token, nuevaMesa) {

    await db
        .from("invitaciones")
        .update({ mesa: nuevaMesa })
        .eq("token", token);

    mostrarToast("Mesa actualizada 🍽️");
}

async function editarDetalle(token, texto) {

    await db
        .from("invitaciones")
        .update({ detalle_mesas: texto })
        .eq("token", token);

    mostrarToast("Detalle actualizado ✨");
}
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

function moverSlider(btn) {
    const slider = document.querySelector(".filter-slider");

    const rect = btn.getBoundingClientRect();
    const parentRect = btn.parentElement.getBoundingClientRect();

    slider.style.width = rect.width + "px";
    slider.style.height = rect.height + "px";
    slider.style.left = (rect.left - parentRect.left) + "px";
    slider.style.top = (rect.top - parentRect.top) + "px";
}
function normalizarTexto(texto) {
    return (texto || "")
        .toLowerCase()
        .normalize("NFD") // separa acentos
        .replace(/[\u0300-\u036f]/g, ""); // elimina acentos
}
/* =====================
   FILTROS
===================== */

function initFiltros() {

    const botones = document.querySelectorAll(".filter-btn");

    botones.forEach(btn => {

        btn.addEventListener("click", () => {

            botones.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            filtroActivo = btn.id.replace("filter-", "");

            moverSlider(btn); // 🔥 mover slider

            renderTabla();
        });
    });

    // posicion inicial
    setTimeout(() => {
        const activo = document.querySelector(".filter-btn.active");
        if (activo) moverSlider(activo);
    }, 100);
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
async function initToggleMesas() {

    const switchInput = document.getElementById("toggle-mesas-switch");
    const estadoTexto = document.getElementById("estado-mesas");

    if (!switchInput) return;

    // 🔥 1. OBTENER CONFIG (sin romper si no existe)
    const { data, error } = await db
        .from("configuracion")
        .select("mostrar_mesas")
        .eq("id", 1)
        .maybeSingle(); // 🔥 CAMBIO CLAVE

    if (error) {
        console.error("Error cargando config:", error);
        return;
    }

    // 🔥 2. SI NO EXISTE → CREAR REGISTRO
    if (!data) {
        console.warn("No existe config, creando...");

        const { error: insertError } = await db
            .from("configuracion")
            .insert({ id: 1, mostrar_mesas: true });

        if (insertError) {
            console.error("Error creando config:", insertError);
            return;
        }

        switchInput.checked = true;
        estadoTexto.innerText = "Mesas visibles";
        return;
    }

    // 🔥 3. USAR VALOR REAL
    const estadoActual = data.mostrar_mesas ?? false;

    switchInput.checked = estadoActual;

    estadoTexto.innerText = estadoActual
        ? "Mesas visibles"
        : "Mesas ocultas";

    // 🔥 4. EVENTO
    switchInput.addEventListener("change", async () => {

        const nuevoEstado = switchInput.checked;

        const confirmar = await mostrarConfirmacion(
            nuevoEstado
                ? "¿Mostrar mesas a los invitados?"
                : "¿Ocultar mesas temporalmente?"
        );

        if (!confirmar) {
            switchInput.checked = !nuevoEstado;
            return;
        }

        const { error: updateError } = await db
            .from("configuracion")
            .update({ mostrar_mesas: nuevoEstado })
            .eq("id", 1);

        if (updateError) {
            console.error("Error actualizando:", updateError);
            return;
        }

        estadoTexto.innerText = nuevoEstado
            ? "Mesas visibles"
            : "Mesas ocultas";

        showToast(
            nuevoEstado
                ? "Mesas activadas 👁️"
                : "Mesas ocultas 🙈"
        );
    });
}

function mostrarConfirmacion(texto) {

    return new Promise((resolve) => {

        const modal = document.getElementById("confirm-modal");
        const text = document.getElementById("confirm-text");
        const ok = document.getElementById("accept-btn");
        const cancel = document.getElementById("cancel-btn");

        text.innerText = texto;

        modal.classList.remove("hidden");
        modal.classList.add("active");

        ok.onclick = () => {
            modal.classList.remove("active");
            modal.classList.add("hidden");
            resolve(true);
        };

        cancel.onclick = () => {
            modal.classList.remove("active");
            modal.classList.add("hidden");
            resolve(false);
        };

    });
}

function initCrearInvitado() {

    const tipo = document.getElementById("nuevo-tipo");
    const miembros = document.getElementById("nuevo-miembros");
    const mesa = document.getElementById("nuevo-mesa");
    const detalle = document.getElementById("nuevo-detalle");

    tipo.addEventListener("change", () => {

        const valor = tipo.value;

        if (valor === "banquete") {
            miembros.classList.remove("hidden");
            mesa.classList.remove("hidden");
            detalle.classList.remove("hidden");
        } else if (valor === "baile") {
            miembros.classList.add("hidden");
            mesa.classList.add("hidden");
            detalle.classList.add("hidden");
        }
    });
}
function initFormularioInvitado() {

    const tipo = document.getElementById("nuevo-tipo");
    const campos = document.getElementById("campos-dinamicos");
    const extraBanquete = document.getElementById("extra-banquete");

    if (!tipo) return;

    tipo.addEventListener("change", () => {

        const valor = tipo.value;

        // 🔥 ocultar todo primero
        campos.classList.add("hidden");
        extraBanquete.classList.add("hidden");

        if (!valor) return;

        // 🔥 mostrar base
        campos.classList.remove("hidden");

        // 🔥 lógica por tipo
        if (valor === "banquete") {
            extraBanquete.classList.remove("hidden");
        }
    });
}
document.getElementById("crear-invitado")?.addEventListener("click", async () => {

    const tipo = document.getElementById("nuevo-tipo").value;
    const nombre = document.getElementById("nuevo-nombre").value.trim();
    const pases = Number(document.getElementById("nuevo-pases").value);
    const miembros = document.getElementById("nuevo-miembros").value.trim();
    const mesa = document.getElementById("nuevo-mesa").value;
    const detalle = document.getElementById("nuevo-detalle").value.trim();

    // 🔴 VALIDACIÓN
    if (!tipo || !nombre || !pases) {
        showAlert("Faltan datos obligatorios");
        return;
    }

    // 🔥 TOKEN + LINK
    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const baseURL = "https://invitacion-boda-isai-akari.vercel.app/";

    const nuevo = {
        nombre_familia: nombre,
        pases: pases,
        tipo_invitado: tipo,
        token: token,
        link: `${baseURL}?id=${token}`,

        // 👇 lógica por tipo
        miembros: tipo === "banquete" ? miembros : null,
        mesa: tipo === "banquete" ? mesa : null,
        detalle_mesas: tipo === "banquete" ? detalle : null
    };

    // 🔥 INSERT DIRECTO
    const { error } = await db
        .from("invitaciones")
        .insert(nuevo);

    if (error) {
        console.error(error);
        alert("Error al crear invitado");
        return;
    }

    // ✅ UX PRO
    showToast("Invitado creado ✨");

    limpiarFormularioInvitado();

    cargarDatosSafe();
});
function showAlert(texto) {

    const modal = document.getElementById("alert-modal");
    const text = document.getElementById("alert-text");
    const ok = document.getElementById("alert-ok");

    text.innerText = texto;

    modal.classList.remove("hidden");
    modal.classList.add("active");

    ok.onclick = () => {
        modal.classList.remove("active");
        modal.classList.add("hidden");
    };
}

function limpiarFormularioInvitado() {
    document.getElementById("nuevo-tipo").value = "";
    document.getElementById("nuevo-nombre").value = "";
    document.getElementById("nuevo-pases").value = "";
    document.getElementById("nuevo-miembros").value = "";
    document.getElementById("nuevo-mesa").value = "";
    document.getElementById("nuevo-detalle").value = "";

    document.getElementById("nuevo-miembros").classList.add("hidden");
    document.getElementById("nuevo-mesa").classList.add("hidden");
    document.getElementById("nuevo-detalle").classList.add("hidden");
}
async function eliminarInvitado(token) {

    const confirmar = await mostrarConfirmacion(
        "¿Eliminar este invitado?"
    );

    if (!confirmar) return;

    const { error } = await db
        .from("invitaciones")
        .delete()
        .eq("token", token);

    if (error) {
        console.error(error);
        showAlert("Error al eliminar invitado");
        return;
    }

    showToast("Invitado eliminado 🗑️");

    cargarDatosSafe();
}
function moverSlider(btn) {
    const slider = document.querySelector(".filter-slider");

    const rect = btn.getBoundingClientRect();
    const parentRect = btn.parentElement.getBoundingClientRect();

    slider.style.width = rect.width + "px";
    slider.style.left = (rect.left - parentRect.left) + "px";

    slider.style.top = "50%";
    slider.style.transform = "translateY(-50%)"; // 🔥 centra vertical perfecto
}
/* =====================
   INIT
===================== */

let cargando = false;

async function cargarDatosSafe() {
    if (cargando) return;

    try {
        cargando = true;
        await cargarDatos();
    } catch (err) {
        console.error("Error cargando datos:", err);
    } finally {
        cargando = false;
    }
}

window.addEventListener("load", async () => {

    try {

        // 🔧 INIT UI
        initFiltros();
        initBuscadorInvitados();
        initBuscadorTabla();
        initCrearInvitado();
        initFormularioInvitado();

        // ⚙️ CONFIG
        await initToggleMesas();

        // 📊 PRIMERA CARGA
        await cargarDatosSafe();

        // 🔁 AUTO REFRESH INTELIGENTE
        setInterval(() => {

            const active = document.activeElement;

            const editando =
                active &&
                active.classList &&
                (
                    active.classList.contains("input-mesa") ||
                    active.classList.contains("input-detalle")
                );

            if (!editando) {
                cargarDatosSafe();
            }

        }, 15000);

    } catch (error) {
        console.error("Error inicializando panel:", error);
    }

});

