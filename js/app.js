

const supabaseUrl = "https://ygbnuhwwfkzejtzjxyal.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYm51aHd3Zmt6ZWp0emp4eWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTg4NzgsImV4cCI6MjA4NjIzNDg3OH0.f0LlSKDr7zTORVe0DalLy8rW_85v2sLmJF6bILhHZgI";

const db = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);
/* =====================
   VARIABLES
===================== */

const weddingDate = new Date("Jul 18, 2026 18:00:00").getTime();
const params = new URLSearchParams(window.location.search);
const guestId = params.get("id");

const hero = document.querySelector(".hero");


/* =====================
   COUNTDOWN
===================== */

function updateCountdown() {
    const countdownEl = document.getElementById("countdown");
    if (!countdownEl) return;

    const now = new Date().getTime();
    const distance = weddingDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    countdownEl.innerHTML = days + " días";
}

setInterval(updateCountdown, 1000);


/* =====================
   SCROLL ANIMATION
===================== */

const elements = document.querySelectorAll(".fade-in");

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
        }
    });
}, { threshold: 0.2 });

elements.forEach(el => observer.observe(el));


/* =====================
   CARGAR INVITADO
===================== */

async function cargarInvitado() {

    const guestName = document.getElementById("guest-name");
    const guestPasses = document.getElementById("guest-passes");
    const confirmedInput = document.getElementById("confirmed-count");
    const attendanceSelect = document.getElementById("attendance");
    const guestCountContainer = document.getElementById("guest-count-container");

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

    guestName.innerText =
        `Bienvenido ${data.nombre_familia}`;

    guestPasses.innerText =
        `Hemos reservado ${data.pases} lugar/es para usted/es`;

    if (confirmedInput) confirmedInput.max = data.pases;

    // Restaurar valores guardados
    if (attendanceSelect && data.asistencia) {
        attendanceSelect.value = data.asistencia;
    }

    if (confirmedInput && data.confirmados) {
        confirmedInput.value = data.confirmados;
        guestCountContainer.classList.remove("hidden");
    }

    // Si ya confirmó
    if (data.asistencia) {
        mostrarConfirmado();
    }
}


/* =====================
   MODAL CONFIRMACION
===================== */

const modal = document.getElementById("confirm-modal");
const acceptConfirm = document.getElementById("accept-confirm");
const cancelConfirm = document.getElementById("cancel-confirm");
const confirmBtn = document.getElementById("confirm-btn");

if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
        modal.classList.add("show");
    });
}

if (cancelConfirm) {
    cancelConfirm.addEventListener("click", () => {
        modal.classList.remove("show");
    });
}

if (acceptConfirm) {

    acceptConfirm.addEventListener("click", async () => {

        modal.classList.remove("show");

        const asistencia = document.getElementById("attendance").value;
        const cantidad = document.getElementById("confirmed-count").value;
        const mensaje = document.getElementById("message").value;

        if (!asistencia) return;

        if (asistencia === "si" && (!cantidad || cantidad <= 0)) return;

        const { error } = await db
            .from("invitaciones")
            .update({
                asistencia: asistencia,
                confirmados: cantidad,
                mensaje: mensaje
            })
            .eq("token", guestId);

        if (!error) {
            mostrarConfirmado();
        }
    });
}


/* =====================
   ESTADO CONFIRMADO
===================== */

function mostrarConfirmado() {

    const confirmationMsg = document.getElementById("confirmation-message");
    const confirmBtn = document.getElementById("confirm-btn");

    if (!confirmationMsg || !confirmBtn) return;

    confirmationMsg.innerText =
        "✨ Gracias por confirmar tu asistencia. Nos vemos en nuestro gran día.";
    confirmationMsg.classList.add("show");

    document.getElementById("attendance").disabled = true;
    document.getElementById("confirmed-count").disabled = true;
    document.getElementById("message").disabled = true;

    confirmBtn.disabled = true;
    confirmBtn.innerText = "Confirmado ✓";
    confirmBtn.classList.add("confirmed");
}


/* =====================
   HERO ANIMATION
===================== */

window.addEventListener("load", () => {

    const heroContent = document.querySelector(".hero-content");

    if (heroContent) {
        setTimeout(() => {
            heroContent.classList.add("show");
        }, 300);
    }

    cargarInvitado();
});


/* =====================
   HERO SCROLL EFFECT
===================== */

window.addEventListener("scroll", () => {

    if (!hero) return;

    if (window.scrollY > 50) {
        hero.classList.add("scrolled");
    } else {
        hero.classList.remove("scrolled");
    }
});


/* =====================
   MOSTRAR / OCULTAR INVITADOS
===================== */

const attendanceSelect = document.getElementById("attendance");
const guestCountContainer = document.getElementById("guest-count-container");
const confirmedCountInput = document.getElementById("confirmed-count");

if (attendanceSelect) {

    attendanceSelect.addEventListener("change", () => {

        if (attendanceSelect.value === "si") {
            guestCountContainer.classList.remove("hidden");
        } else {
            guestCountContainer.classList.add("hidden");
            confirmedCountInput.value = "";
        }

    });

}
const slides = document.querySelectorAll(".carousel-item");
const nextBtn = document.querySelector(".next");
const prevBtn = document.querySelector(".prev");

let index = 0;
let autoSlide;

function showSlide(i) {
    slides.forEach(slide => slide.classList.remove("active"));
    slides[i].classList.add("active");
}

function nextSlide() {
    index = (index + 1) % slides.length;
    showSlide(index);
}

function prevSlide() {
    index = (index - 1 + slides.length) % slides.length;
    showSlide(index);
}

if (nextBtn && prevBtn) {

    nextBtn.addEventListener("click", () => {
        nextSlide();
        resetAutoSlide();
    });

    prevBtn.addEventListener("click", () => {
        prevSlide();
        resetAutoSlide();
    });
}

function startAutoSlide() {
    autoSlide = setInterval(nextSlide, 5000);
}

function resetAutoSlide() {
    clearInterval(autoSlide);
    startAutoSlide();
}

if (slides.length > 0) {
    showSlide(index);
    startAutoSlide();
}


