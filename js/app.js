

const supabaseUrl = "https://ygbnuhwwfkzejtzjxyal.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYm51aHd3Zmt6ZWp0emp4eWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTg4NzgsImV4cCI6MjA4NjIzNDg3OH0.f0LlSKDr7zTORVe0DalLy8rW_85v2sLmJF6bILhHZgI";

const db = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);
/* =====================
   VARIABLES
===================== */

const weddingDate = new Date("Jul 18, 2026 12:00:00").getTime();
const params = new URLSearchParams(window.location.search);
const guestId = params.get("id");

/* =====================
   COUNTDOWN
===================== */

function updateCountdown() {
    const now = new Date().getTime();
    const distance = weddingDate - now;

    if (distance <= 0) return;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);

    document.getElementById("days").innerText = days;
    document.getElementById("hours").innerText = hours;
    document.getElementById("minutes").innerText = minutes;
}


setInterval(updateCountdown, 1000);

/* =====================
   SCROLL ANIMATION
===================== */

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting)
            entry.target.classList.add("visible");
    });
}, { threshold: 0.2 });

document.querySelectorAll(".fade-in")
    .forEach(el => observer.observe(el));

/* =====================
   MOSTRAR INPUT PERSONAS
===================== */

function actualizarVistaAsistencia() {

    const select = document.getElementById("attendance");
    const container = document.getElementById("guest-count-container");
    const input = document.getElementById("confirmed-count");

    if (!select || !container) return;

    if (select.value === "si") {
        container.classList.remove("hidden");
    } else {
        container.classList.add("hidden");
        input.value = "";
    }
}

/* =====================
   TIPO INVITADO
===================== */

function aplicarTipoInvitado(tipo) {

    const itinerario = document.getElementById("timeline-section");
    const mesaCard = document.getElementById("guest-table-card");
    const badge = document.getElementById("baile-badge");
    const titulo = document.getElementById("evento-titulo");
    const hora = document.getElementById("evento-hora");
    const discurso = document.getElementById("discurso-section");

    if (tipo === "baile") {
        itinerario?.classList.add("hidden");
        mesaCard?.classList.add("hidden");
        badge?.classList.remove("hidden");
        discurso?.classList.add("hidden");
        titulo.innerText = "Baile";
        hora.innerText = "18:30 PM"; // 👈 aquí tu cambio

    } else {
        itinerario?.classList.remove("hidden");
        badge?.classList.add("hidden");
        discurso?.classList.remove("hidden");
        titulo.innerText = "Recepción";
        hora.innerText = "16:00 PM"; // 👈 aseguras consistencia
    }
}

/* =====================
   CARGAR INVITADO
===================== */
function generarTextoPases(tipo, pases) {

    const esPlural = pases > 1;
    const palabra = tipo === "baile"
        ? (esPlural ? "pases" : "pase")
        : (esPlural ? "lugares" : "lugar");

    const destinatario = esPlural ? "ustedes" : "ti";

    return `Hemos reservado ${pases} ${palabra} para ${destinatario}`;
}
async function cargarInvitado() {

    const guestName = document.getElementById("guest-name");
    const guestPasses = document.getElementById("guest-passes");
    const mensajePersonalizado = document.getElementById("mensaje-personalizado");
    const confirmedInput = document.getElementById("confirmed-count");
    const attendanceSelect = document.getElementById("attendance");
    const detalleMesas = document.getElementById("detalle-mesas");
    const mesaNormal = document.getElementById("evento-hora"); // o donde muestras mesa

    if (!guestId || !guestName) return;

    const { data, error } = await db
        .from("invitaciones")
        .select("*")
        .eq("token", guestId)
        .single();

    if (error || !data) {
        guestName.innerText = "Invitación no válida";
        return;
    }

    if (data.mensaje_personalizado && mensajePersonalizado) {
        mensajePersonalizado.innerHTML = `
            <strong>💌 Un mensaje para ti:</strong><br><br>
            ${data.mensaje_personalizado}
        `;
        mensajePersonalizado.classList.remove("hidden");
    }
    if (data.detalle_mesas && detalleMesas) {

        detalleMesas.innerHTML = data.detalle_mesas.replaceAll("|", "<br>");
        detalleMesas.classList.remove("hidden");

        // ocultar mesa normal
        if (mesaNormal) {
            mesaNormal.style.display = "none";
        }

    }

    const pases = Number(data.pases || 0);

    guestName.innerText =
        pases === 1
            ? `Bienvenid@ ${data.nombre_familia}`
            : `Bienvenidos ${data.nombre_familia}`;

    guestPasses.innerText =
    generarTextoPases(data.tipo_invitado?.toLowerCase(), pases);

    /* ===== MESA ===== */

    const tableCard = document.getElementById("guest-table-card");
    const tableNumber = document.getElementById("guest-table-number");

    if (data.mesa && data.tipo_invitado?.toLowerCase() === "banquete") {
        tableNumber.innerText = data.mesa;
        tableCard.classList.remove("hidden");

setTimeout(() => {
    tableCard.classList.add("show");
}, 150);

    }

    aplicarTipoInvitado(data.tipo_invitado);

    if (data.tipo_invitado === "baile") {
        guestPasses.innerText =
            "Te esperamos para celebrar con nosotros en la fiesta 🎉";
    }

    if (confirmedInput) confirmedInput.max = pases;

    if (attendanceSelect && data.asistencia)
        attendanceSelect.value = data.asistencia;

    if (confirmedInput && data.confirmados)
        confirmedInput.value = data.confirmados;

    actualizarVistaAsistencia();

    if (data.asistencia)
        mostrarConfirmado(data.asistencia);
}

/* =====================
   MODAL CONFIRMACION
===================== */

function initModal() {

    const modal = document.getElementById("confirm-modal");
    const modalText = document.getElementById("modal-text");
    const accept = document.getElementById("accept-confirm");
    const cancel = document.getElementById("cancel-confirm");
    const btn = document.getElementById("confirm-btn");

    if (!modal || !btn) return;

    btn.addEventListener("click", () => {

        const asistencia = document.getElementById("attendance").value;
        const cantidad = Number(document.getElementById("confirmed-count").value);
        const max = Number(document.getElementById("confirmed-count").max);

        if (!asistencia) return;

        /* VALIDACION ANTES DEL MODAL */

        if (asistencia === "si") {

            if (!cantidad || cantidad <= 0) return;

            if (cantidad > max) {

                modalText.innerText =
                    `Esta invitación tiene ${max} pases asignados.\n\nPor favor verifica el número de asistentes.`;

                accept.style.display = "none";
                cancel.innerText = "Entendido";

                modal.classList.add("show");
                return;
            }
        }

        accept.style.display = "";
        cancel.innerText = "Cancelar";

        modalText.innerText =
            asistencia === "si"
                ? "¿Deseas confirmar tu asistencia?"
                : "¿Deseas confirmar que no podrás asistir?";

        modal.classList.add("show");
    });

    cancel.addEventListener("click", () =>
        modal.classList.remove("show")
    );

    accept.addEventListener("click", async () => {

        modal.classList.remove("show");

        const asistencia = document.getElementById("attendance").value;
        const cantidad = Number(document.getElementById("confirmed-count").value);
        const mensaje = document.getElementById("message").value;

        const confirmadosFinal =
            asistencia === "si" ? cantidad : 0;

        const { error } = await db
            .from("invitaciones")
            .update({
                asistencia,
                confirmados: confirmadosFinal,
                mensaje
            })
            .eq("token", guestId);

        if (!error)
            mostrarConfirmado(asistencia);
    });
}

/* =====================
   ESTADO CONFIRMADO
===================== */

function mostrarConfirmado(asistencia) {

    const msg = document.getElementById("confirmation-message");
    const btn = document.getElementById("confirm-btn");

    msg.innerText =
        asistencia === "si"
            ? "✨ Gracias por confirmar tu asistencia. Nos vemos en nuestro gran día."
            : "Gracias por avisarnos. Los extrañaremos en nuestro gran día.";

    msg.classList.add("show");

    ["attendance","confirmed-count","message"]
        .forEach(id => document.getElementById(id).disabled = true);

    btn.disabled = true;
    btn.innerText = "Confirmado ✓";
    btn.classList.add("confirmed");
}

/* =====================
   CARRUSEL
===================== */



/* =====================
   COPIAR MESA REGALOS
===================== */

function initCopyElements() {

    const elements = document.querySelectorAll(".gift-number");

    elements.forEach(el => {

        const icon = el.querySelector(".copy-icon");

        el.addEventListener("click", async () => {

            const text =
                el.childNodes[0].textContent.trim();

            try {
                await navigator.clipboard.writeText(text);

                icon.classList.add("copied");

                setTimeout(() => {
                    icon.textContent = "✔";
                    icon.classList.remove("copied");
                    icon.classList.add("success");
                }, 150);

                setTimeout(() => {
                    icon.textContent = "📋";
                    icon.classList.remove("success");
                }, 1150);

            } catch (err) {
                console.error("Error copiando:", err);
            }

        });

    });
}


/* =====================
INIT
===================== */

window.addEventListener("load", () => {

    document.querySelector(".hero-content")
        ?.classList.add("show");

    cargarInvitado();
    initModal();
    initCopyElements();

    document.getElementById("attendance")
        ?.addEventListener("change", actualizarVistaAsistencia);
});

const infoLink = document.getElementById("info-link");

if (infoLink && guestId) {
    infoLink.href = `info.html?id=${guestId}`;
}

function initCarouselPremium() {

    const track = document.querySelector(".carousel-track");
    let cards = Array.from(document.querySelectorAll(".carousel-card"));

    if (!cards.length) return;

    const original = [...cards];

    // 🔥 TRIPLICAR (clave para loop real)
    // triplicado
    original.forEach(card => track.appendChild(card.cloneNode(true)));
    original.forEach(card => track.appendChild(card.cloneNode(true)));

    cards = Array.from(document.querySelectorAll(".carousel-card"));

    let index = original.length; // 👈 empezamos en el bloque del medio

    function update() {

        const gap = parseInt(getComputedStyle(track).gap) || 0;
        const cardWidth = cards[0].offsetWidth + gap;
        const containerWidth = track.parentElement.offsetWidth;

        const offset =
            (index * cardWidth) - (containerWidth / 2) + (cardWidth / 2);

        track.style.transform = `translateX(-${offset}px)`;

        cards.forEach((card, i) => {
            card.classList.remove("active", "near");

            if (i === index) {
                card.classList.add("active");
            } else if (i === index - 1 || i === index + 1) {
                card.classList.add("near");
            }
        });
    }

    function next() {

        const middleEnd = original.length * 2;

        // 🔥 PRE-CORRECCIÓN (antes del movimiento)
        if (index >= middleEnd - 1) {

            track.style.transition = "none";

            index -= original.length;
            update();

            // forzar repaint
            track.offsetHeight;

            track.style.transition = "transform 1s cubic-bezier(0.22,1,0.36,1)";
        }

        // ahora sí avanzas normal
        index++;
        update();
    }

    // autoplay
    setInterval(next, 2600);

    // INIT
    window.addEventListener("load", () => {
        setTimeout(() => {
            track.style.transition = "none";
            update();

            requestAnimationFrame(() => {
                track.style.transition = "transform 1s cubic-bezier(0.22,1,0.36,1)";
            });
        }, 100);
    });

    window.addEventListener("resize", update);
}

initCarouselPremium();

function initRSVPFlow() {

    const steps = document.querySelectorAll(".step");
    let current = 0;

    function goToStep(i) {
        steps[current].classList.remove("active");
        current = i;
        steps[current].classList.add("active");
    }

    // botones continuar
    document.querySelectorAll(".next-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            goToStep(current + 1);
        });
    });

    // opciones SI/NO
    const options = document.querySelectorAll(".option-btn");

    options.forEach(btn => {
        btn.addEventListener("click", () => {

            options.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            document.getElementById("attendance").value =
                btn.dataset.value;

            if (btn.dataset.value === "no") {
                goToStep(3); // saltar personas
            } else {
                goToStep(2);
            }
        });
    });
}

initRSVPFlow();

// PRUEBAS
