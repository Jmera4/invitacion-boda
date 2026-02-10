

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

    guestName.innerText = `Bienvenido ${data.nombre_familia}`;
    guestPasses.innerText = `Hemos reservado ${data.pases} lugares para ustedes`;

    if (confirmedInput) confirmedInput.max = data.pases;

    if (attendanceSelect && data.asistencia) {
        attendanceSelect.value = data.asistencia;
    }

    if (confirmedInput && data.confirmados) {
        confirmedInput.value = data.confirmados;
        guestCountContainer.classList.remove("hidden");
    }

    if (data.asistencia) {
        mostrarConfirmado(data.asistencia);
    }
}


/* =====================
MODAL CONFIRMACION
===================== */

function initModal() {

    const modal = document.getElementById("confirm-modal");
    const modalText = document.getElementById("modal-text");
    const acceptConfirm = document.getElementById("accept-confirm");
    const cancelConfirm = document.getElementById("cancel-confirm");
    const confirmBtn = document.getElementById("confirm-btn");

    if (!modal || !confirmBtn) return;

    confirmBtn.addEventListener("click", () => {

        const asistencia = document.getElementById("attendance").value;
        if (!asistencia) return;

        modalText.innerText =
            asistencia === "si"
                ? "¿Deseas confirmar tu asistencia?"
                : "¿Deseas confirmar que no podrás asistir?";

        modal.classList.add("show");
    });

    cancelConfirm.addEventListener("click", () => {
        modal.classList.remove("show");
    });

    acceptConfirm.addEventListener("click", async () => {

        modal.classList.remove("show");

        const asistencia = document.getElementById("attendance").value;
        const cantidad = document.getElementById("confirmed-count").value;
        const mensaje = document.getElementById("message").value;

        if (!asistencia) return;

        let confirmadosFinal = 0;

        if (asistencia === "si") {
            if (!cantidad || cantidad <= 0) return;
            confirmadosFinal = Number(cantidad);
        }

        const { error } = await db
            .from("invitaciones")
            .update({
                asistencia: asistencia,
                confirmados: confirmadosFinal,
                mensaje: mensaje
            })
            .eq("token", guestId);

        if (!error) {
            mostrarConfirmado(asistencia);
        }
    });
}


/* =====================
ESTADO CONFIRMADO
===================== */

function mostrarConfirmado(asistencia) {

    const confirmationMsg = document.getElementById("confirmation-message");
    const confirmBtn = document.getElementById("confirm-btn");

    if (!confirmationMsg || !confirmBtn) return;

    confirmationMsg.innerText =
        asistencia === "si"
            ? "✨ Gracias por confirmar tu asistencia. Nos vemos en nuestro gran día."
            : "Gracias por avisarnos. Los extrañaremos en nuestro gran día.";

    confirmationMsg.classList.add("show");

    document.getElementById("attendance").disabled = true;
    document.getElementById("confirmed-count").disabled = true;
    document.getElementById("message").disabled = true;

    confirmBtn.disabled = true;
    confirmBtn.innerText = "Confirmado ✓";
    confirmBtn.classList.add("confirmed");
}


/* =====================
CARRUSEL
===================== */

function initCarousel() {

    const slides = document.querySelectorAll(".carousel-item");
    const nextBtn = document.querySelector(".next");
    const prevBtn = document.querySelector(".prev");

    if (!slides.length) return;

    let index = 0;
    let autoSlide;

    slides[0].classList.add("active");

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

    function startAutoSlide() {
        autoSlide = setInterval(nextSlide, 5000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlide);
        startAutoSlide();
    }

    nextBtn?.addEventListener("click", () => {
        nextSlide();
        resetAutoSlide();
    });

    prevBtn?.addEventListener("click", () => {
        prevSlide();
        resetAutoSlide();
    });

    startAutoSlide();
}

/* =====================
COPIAR NUMERO MESA REGALOS
===================== */

const giftNumber = document.getElementById("gift-number");
const feedback = document.getElementById("gift-copy-feedback");

if (giftNumber) {

    giftNumber.addEventListener("click", async () => {

        try {
            await navigator.clipboard.writeText(giftNumber.innerText);

            feedback.innerText = "Copiado ✓";
            feedback.classList.add("show");

            setTimeout(() => {
                feedback.classList.remove("show");
            }, 2000);

        } catch {
            feedback.innerText = "No se pudo copiar";
            feedback.classList.add("show");
        }

    });

}



const giftNumberEl = document.getElementById("gift-number");

if (giftNumberEl) {

    const numeroOriginal =
        giftNumberEl.childNodes[0].textContent.trim();

    giftNumberEl.addEventListener("click", async () => {

        try {
            await navigator.clipboard.writeText(numeroOriginal);

            // Cambiar visualmente
            giftNumberEl.classList.add("copied");
            giftNumberEl.childNodes[0].textContent = "✓ Copiado";

            setTimeout(() => {
                giftNumberEl.childNodes[0].textContent = numeroOriginal;
                giftNumberEl.classList.remove("copied");
            }, 2000);

        } catch (err) {
            console.error("Error copiando:", err);
        }

    });
}

const mapFrame = document.getElementById("map-frame");

const maps = {
    reino: "https://www.google.com/maps?q=Salon+del+Reino+Zacatecas&output=embed",
    recepcion: "https://www.google.com/maps?q=Salon+Los+Olivos+Zacatecas&output=embed"
};

document.querySelectorAll(".timeline-item").forEach(item => {

    item.addEventListener("click", () => {

        const mapKey = item.dataset.map;

        if (mapKey && maps[mapKey]) {
            mapFrame.src = maps[mapKey];
        }

    });

});


/* =====================
INIT GENERAL
===================== */

window.addEventListener("load", () => {

    const heroContent = document.querySelector(".hero-content");

    if (heroContent) {
        setTimeout(() => {
            heroContent.classList.add("show");
        }, 300);
    }

    cargarInvitado();
    initModal();
    initCarousel();
});
