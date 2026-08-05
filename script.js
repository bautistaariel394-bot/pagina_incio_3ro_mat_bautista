document.addEventListener('DOMContentLoaded', () => {

    // --- ESPACIO DINÁMICO DEBAJO DEL HEADER ---
    // El header (barra naranja + logo + menú) puede cambiar de alto según
    // el logo real, la fuente cargada o el ancho de pantalla. En vez de dejar
    // un margen fijo en el CSS (que se desajusta y "tapa" el carrusel),
    // lo medimos en vivo y lo aplicamos como variable CSS.
    const barraAcento = document.querySelector('.barra-acento');
    const header = document.querySelector('.header-superior');

    let midiendo = false;
    function ajustarEspacioHeader() {
        if (!header || midiendo) return;
        midiendo = true;

        // Solo mide el header en su estado "grande" (sin la clase .scroll),
        // que es el que necesita el carrusel al cargar la página.
        const estabaComprimido = header.classList.contains('scroll');
        if (estabaComprimido) header.classList.remove('scroll');

        const altoTotal = (barraAcento ? barraAcento.offsetHeight : 0) + header.offsetHeight;
        document.documentElement.style.setProperty('--espacio-header', altoTotal + 'px');

        if (estabaComprimido) header.classList.add('scroll');
        midiendo = false;
    }

    ajustarEspacioHeader();
    window.addEventListener('load', ajustarEspacioHeader); // por si el logo tarda en cargar
    window.addEventListener('resize', ajustarEspacioHeader);

    // ResizeObserver: recalcula ante CUALQUIER cambio de tamaño del header
    // (logo que carga con otro tamaño, fuente que se intercambia, texto que
    // se envuelve a 2 líneas en pantallas angostas, etc.), sin depender de
    // que se dispare 'load' o 'resize'.
    if (header && 'ResizeObserver' in window) {
        new ResizeObserver(ajustarEspacioHeader).observe(header);
    }


    // --- CARRUSEL: autoplay + flechas + indicadores ---
    const contenedorCarrusel = document.querySelector('.carrusel-contenedor');
    const slides = document.querySelectorAll('.slide');
    const indicadores = document.querySelectorAll('.indicador');
    const btnAnterior = document.querySelector('.control-anterior');
    const btnSiguiente = document.querySelector('.control-siguiente');
    const DURACION_MS = 4000;

    let indiceActual = 0;
    let temporizador = null;

    function irASlide(nuevoIndice) {
        if (slides.length === 0) return;

        slides[indiceActual].classList.remove('activo');
        slides[indiceActual].setAttribute('aria-hidden', 'true');
        indicadores[indiceActual].classList.remove('activo');
        indicadores[indiceActual].setAttribute('aria-selected', 'false');

        indiceActual = (nuevoIndice + slides.length) % slides.length;

        slides[indiceActual].classList.add('activo');
        slides[indiceActual].setAttribute('aria-hidden', 'false');
        indicadores[indiceActual].classList.add('activo');
        indicadores[indiceActual].setAttribute('aria-selected', 'true');

        reiniciarBarraProgreso(indicadores[indiceActual]);
    }

    function reiniciarBarraProgreso(indicadorActivo) {
        // Forzamos un reflow para poder reiniciar la animación CSS de la
        // barra de progreso cada vez que cambia el slide (manual o automático).
        const barra = indicadorActivo.querySelector('.barra-progreso');
        barra.style.animation = 'none';
        void barra.offsetWidth;
        barra.style.animation = '';
    }

    function siguienteSlide() {
        irASlide(indiceActual + 1);
    }

    function iniciarAutoplay() {
        detenerAutoplay();
        temporizador = setInterval(siguienteSlide, DURACION_MS);
        contenedorCarrusel.classList.remove('pausado');
    }

    function detenerAutoplay() {
        clearInterval(temporizador);
        temporizador = null;
    }

    function irManualmente(nuevoIndice) {
        irASlide(nuevoIndice);
        iniciarAutoplay(); // reinicia el conteo de 4s tras una acción manual
    }

    if (slides.length > 0) {
        btnSiguiente.addEventListener('click', () => irManualmente(indiceActual + 1));
        btnAnterior.addEventListener('click', () => irManualmente(indiceActual - 1));

        indicadores.forEach((indicador, i) => {
            indicador.addEventListener('click', () => irManualmente(i));
        });

        reiniciarBarraProgreso(indicadores[indiceActual]);
        iniciarAutoplay();
    }


    // --- MODALES: Catálogo (JPG) y Ficha de Perfume ---
    const modalCatalogo = document.getElementById('modalCatalogo');
    const btnVerCatalogo = document.getElementById('btnVerCatalogo');

    const modalPerfume = document.getElementById('modalPerfume');
    const modalPerfumeVideo = document.getElementById('modalPerfumeVideo');
    const modalPerfumeEtiqueta = document.getElementById('modalPerfumeEtiqueta');
    const modalPerfumeMarca = document.getElementById('modalPerfumeMarca');
    const modalPerfumeTitulo = document.getElementById('modalPerfumeTitulo');
    const modalPerfumeDescripcion = document.getElementById('modalPerfumeDescripcion');
    const modalPerfumePrecio = document.getElementById('modalPerfumePrecio');
    const tarjetasPerfume = document.querySelectorAll('.tarjeta-video');

    function abrirModal(modal) {
        modal.classList.add('abierto');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function cerrarModal(modal) {
        modal.classList.remove('abierto');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        // Si es la ficha de perfume, detenemos y liberamos el video para que
        // no siga sonando/renderizando de fondo tras cerrar.
        if (modal === modalPerfume) {
            modalPerfumeVideo.pause();
            modalPerfumeVideo.removeAttribute('src');
            modalPerfumeVideo.load();
        }
    }

    // Abrir catálogo en JPG
    if (btnVerCatalogo && modalCatalogo) {
        btnVerCatalogo.addEventListener('click', () => abrirModal(modalCatalogo));
    }

    // Abrir ficha de cada perfume con su video, descripción y precio
    tarjetasPerfume.forEach(tarjeta => {
        function abrirFichaPerfume() {
            const { video, marca, titulo, etiqueta, precio, descripcion } = tarjeta.dataset;

            modalPerfumeVideo.setAttribute('src', video);
            modalPerfumeEtiqueta.textContent = etiqueta || '';
            modalPerfumeMarca.textContent = marca || '';
            modalPerfumeTitulo.textContent = titulo || '';
            modalPerfumeDescripcion.textContent = descripcion || '';
            modalPerfumePrecio.textContent = precio || '';

            abrirModal(modalPerfume);
            modalPerfumeVideo.play();
        }

        tarjeta.addEventListener('click', abrirFichaPerfume);
        tarjeta.addEventListener('keydown', (evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                abrirFichaPerfume();
            }
        });
    });

    // Cerrar modales: botón "x", clic fuera de la caja, o tecla Escape
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.querySelector('.modal-cerrar').addEventListener('click', () => cerrarModal(overlay));
        overlay.addEventListener('click', (evento) => {
            if (evento.target === overlay) cerrarModal(overlay);
        });
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.abierto').forEach(cerrarModal);
        }
    });


    // --- NAVBAR SCROLL ---
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scroll');
        } else {
            navbar.classList.remove('scroll');
        }
    });


    // --- MARCAR ENLACE ACTIVO EN EL MENÚ ---
    const enlacesMenu = document.querySelectorAll('.enlace-menu');
    const secciones = document.querySelectorAll('main, section[id]');

    window.addEventListener('scroll', () => {
        let seccionActualId = '';

        secciones.forEach(seccion => {
            const topSeccion = seccion.offsetTop;
            if (window.pageYOffset >= (topSeccion - 140)) {
                seccionActualId = seccion.getAttribute('id');
            }
        });

        enlacesMenu.forEach(enlace => {
            enlace.classList.remove('activo');
            if (enlace.getAttribute('href').slice(1) === seccionActualId) {
                enlace.classList.add('activo');
            }
        });
    });
});