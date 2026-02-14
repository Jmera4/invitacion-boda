

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

    if (tipo === "baile") {
        itinerario?.classList.add("hidden");
        mesaCard?.classList.add("hidden");
    } else {
        itinerario?.classList.remove("hidden");
    }
}

/* =====================
   CARGAR INVITADO
===================== */

async function cargarInvitado() {

    const guestName = document.getElementById("guest-name");
    const guestPasses = document.getElementById("guest-passes");
    const confirmedInput = document.getElementById("confirmed-count");
    const attendanceSelect = document.getElementById("attendance");

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

    const pases = Number(data.pases || 0);

    guestName.innerText =
        pases === 1
            ? `Bienvenid@ ${data.nombre_familia}`
            : `Bienvenidos ${data.nombre_familia}`;

    guestPasses.innerText =
        `Hemos reservado ${pases} lugares para ustedes`;

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

function initCarousel() {

    const slides = document.querySelectorAll(".carousel-item");
    if (!slides.length) return;

    const nextBtn = document.querySelector(".next");
    const prevBtn = document.querySelector(".prev");

    let index = 0;

    function show(i) {
        slides.forEach(s => s.classList.remove("active"));
        slides[i].classList.add("active");
    }

    function next() {
        index = (index + 1) % slides.length;
        show(index);
    }

    function prev() {
        index = (index - 1 + slides.length) % slides.length;
        show(index);
    }

    show(0);
    let autoSlide = setInterval(next, 5000);

    nextBtn?.addEventListener("click", () => {
        next();
        clearInterval(autoSlide);
        autoSlide = setInterval(next, 5000);
    });

    prevBtn?.addEventListener("click", () => {
        prev();
        clearInterval(autoSlide);
        autoSlide = setInterval(next, 5000);
    });
}

/* =====================
   COPIAR MESA REGALOS
===================== */

function initGiftCopy() {

    const giftNumber = document.getElementById("gift-number");
    if (!giftNumber) return;

    const icon = giftNumber.querySelector(".copy-icon");

    giftNumber.addEventListener("click", async () => {

        const numero =
            giftNumber.childNodes[0].textContent.trim();

        try {
            await navigator.clipboard.writeText(numero);

            // animación salida icono
            icon.classList.add("copied");

            setTimeout(() => {
                icon.textContent = "✔";
                icon.classList.remove("copied");
                icon.classList.add("success");
            }, 150);

            // regresar al icono original
            setTimeout(() => {
                icon.textContent = "📋";
                icon.classList.remove("success");
            }, 1150);

        } catch (err) {
            console.error("Error copiando:", err);
        }
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
    initCarousel();
    initGiftCopy();

    document.getElementById("attendance")
        ?.addEventListener("change", actualizarVistaAsistencia);
});