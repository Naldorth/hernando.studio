document.addEventListener("DOMContentLoaded", () => {
    // Elementos del DOM
    const intro = document.getElementById("intro");
    const mainContent = document.getElementById("main-content");
    const video = document.getElementById("bg-video");
    const infoBtn = document.getElementById("info-btn");
    const infoPanel = document.getElementById("info-panel");
    const closeInfo = document.getElementById("close-info");
    const introTitle = document.querySelector(".intro-title");
    const customCursor = document.getElementById('custom-cursor');

    // Función para mostrar el título con fade-in
    const showTitle = () => {
        if (introTitle) {
            introTitle.style.transition = "opacity 1.5s ease-in-out";
            introTitle.style.opacity = "1";
        }
    };

    // Función para ocultar el intro
    const hideIntro = () => {
        if (intro && mainContent) {
            intro.style.transition = "opacity 0.8s ease-in-out";
            intro.style.opacity = "0";
            setTimeout(() => {
                intro.style.display = "none";
                mainContent.classList.remove("hidden");
            }, 800);
        }
    };

    // Función para manejar el autoplay del video
    const handleVideoAutoplay = () => {
        if (!video) return;
        
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay prevented:", error);
            });
        }

        // Mostrar título después de 4 segundos
        setTimeout(showTitle, 4000);
    };

    // Función para el cursor personalizado
    const setupCustomCursor = () => {
        if (!customCursor) return;

        // Mover el cursor personalizado
        document.addEventListener('mousemove', (e) => {
            customCursor.style.left = `${e.clientX}px`;
            customCursor.style.top = `${e.clientY}px`;
            
            // Detectar si el elemento debajo es oscuro
            const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
            if (elementBelow) {
                const bgColor = window.getComputedStyle(elementBelow).backgroundColor;
                const colorMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                
                if (colorMatch) {
                    const r = parseInt(colorMatch[1]);
                    const g = parseInt(colorMatch[2]);
                    const b = parseInt(colorMatch[3]);
                    const isDark = r < 100 && g < 100 && b < 100;
                    
                    if (isDark) {
                        document.body.classList.add('dark-background');
                    } else {
                        document.body.classList.remove('dark-background');
                    }
                }
            }
        });

        // Ocultar cursor personalizado cuando no se necesita
        document.addEventListener('mouseleave', () => {
            customCursor.style.opacity = '0';
        });

        document.addEventListener('mouseenter', () => {
            customCursor.style.opacity = '1';
        });

        // Escalar cursor sobre elementos interactivos
        const interactiveElements = document.querySelectorAll('button, a, .image, .image-transition-wrapper');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                customCursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
            });
            el.addEventListener('mouseleave', () => {
                customCursor.style.transform = 'translate(-50%, -50%) scale(1)';
            });
        });
    };

    // NUEVA VERSIÓN MEJORADA DE LAS TRANSICIONES
    const setupImageTransitions = () => {
        const wrappers = document.querySelectorAll('.image-transition-wrapper.original');
        
        wrappers.forEach(wrapper => {
            if (!wrapper.dataset.wrapperId) {
                wrapper.dataset.wrapperId = Math.random().toString(36).substr(2, 9);
            }

            const images = wrapper.querySelectorAll('img');
            if (images.length === 0) return;

            let currentIndex = 0;
            images[currentIndex].classList.add('active');

            if (images.length > 1) {
                // Limpiamos intervalo anterior si existe
                if (wrapper._transitionInterval) {
                    clearInterval(wrapper._transitionInterval);
                }

                wrapper._transitionInterval = setInterval(() => {
                    images[currentIndex].classList.remove('active');
                    currentIndex = (currentIndex + 1) % images.length;
                    images[currentIndex].classList.add('active');
                    
                    // Sincronizar clones
                    const clones = document.querySelectorAll(`.image-transition-wrapper.clone[data-original-id="${wrapper.dataset.wrapperId}"]`);
                    clones.forEach(clone => {
                        const cloneImages = clone.querySelectorAll('img');
                        cloneImages.forEach(img => img.classList.remove('active'));
                        cloneImages[currentIndex].classList.add('active');
                    });
                }, 1000); // Cambiado a 3 segundos para mejor experiencia
            }
        });
    };

    const adjustWidth = () => {
        let staticImages = document.querySelectorAll(".image.static img");
        let transitionWrappers = document.querySelectorAll(".image-transition-wrapper");

        if (staticImages.length === 0 || transitionWrappers.length === 0) return;

        let verticalImage = null;

        for (let img of staticImages) {
            if (img.naturalHeight > img.naturalWidth) {
                verticalImage = img;
                break;
            }
        }

        if (verticalImage) {
            let width = verticalImage.clientWidth;

            transitionWrappers.forEach(wrapper => {
                wrapper.style.width = `${width}px`;
                wrapper.style.display = "none";
                void wrapper.offsetWidth;
                wrapper.style.display = "";
            });
        }
    };

    const waitForImages = () => {
        let images = document.querySelectorAll(".image.static img");
        let loaded = 0;

        const checkAllLoaded = () => {
            if (loaded === images.length) {
                adjustWidth();
                forceResize();
            }
        };

        images.forEach(img => {
            if (img.complete) {
                loaded++;
                checkAllLoaded();
            } else {
                img.addEventListener("load", () => {
                    loaded++;
                    checkAllLoaded();
                });
            }
        });

        if (loaded === images.length) {
            adjustWidth();
            forceResize();
        }
    };

    const forceResize = () => {
        setTimeout(() => {
            window.dispatchEvent(new Event("resize"));
        }, 50);
    };

    // NUEVA VERSIÓN MEJORADA DE LA GALERÍA
    const setupGallery = () => {
        const gallery = document.querySelector(".gallery");
        if (!gallery) return;

        // Limpiar clones antiguos
        document.querySelectorAll('.gallery > .clone').forEach(el => el.remove());

        // Marcar originales
        const originals = Array.from(gallery.children);
        originals.forEach(item => {
            item.classList.add('original');
            if (item.classList.contains('image-transition-wrapper') && !item.dataset.wrapperId) {
                item.dataset.wrapperId = Math.random().toString(36).substr(2, 9);
            }
        });

        // Crear clones (5 copias para efecto infinito)
        for (let i = 0; i < 5; i++) {
            originals.forEach(item => {
                const clone = item.cloneNode(true);
                clone.classList.remove('original');
                clone.classList.add('clone');
                
                if (item.classList.contains('image-transition-wrapper')) {
                    clone.dataset.originalId = item.dataset.wrapperId;
                    // Sincronizar imagen activa inicial
                    const activeIndex = Array.from(item.querySelectorAll('img')).findIndex(img => img.classList.contains('active'));
                    clone.querySelectorAll('img').forEach((img, idx) => {
                        img.classList.toggle('active', idx === activeIndex);
                    });
                }
                
                gallery.appendChild(clone);
            });
        }

        // Drag and Scroll (manteniendo tu código original)
        let isDragging = false;
        let startX;
        let scrollLeft;

        gallery.addEventListener("mousedown", (e) => {
            isDragging = true;
            startX = e.pageX - gallery.offsetLeft;
            scrollLeft = gallery.scrollLeft;
            gallery.style.cursor = 'grabbing';
        });

        gallery.addEventListener("mouseleave", () => {
            isDragging = false;
            gallery.style.cursor = 'grab';
        });

        gallery.addEventListener("mouseup", () => {
            isDragging = false;
            gallery.style.cursor = 'grab';
        });

        gallery.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - gallery.offsetLeft;
            const walk = (x - startX) * 2;
            gallery.scrollLeft = scrollLeft - walk;
        });
    };

    const initEventHandlers = () => {
        if (intro) {
            intro.addEventListener("click", hideIntro);
            setTimeout(hideIntro, 60000);
        }

        if (infoBtn && infoPanel) {
            infoBtn.addEventListener("click", () => {
                infoPanel.classList.add("active");
            });
        }

        if (closeInfo && infoPanel) {
            closeInfo.addEventListener("click", () => {
                infoPanel.classList.remove("active");
            });
        }

        window.addEventListener("load", waitForImages);
        window.addEventListener("resize", adjustWidth);
    };

    // Inicialización
    handleVideoAutoplay();
    initEventHandlers();
    setupGallery();
    waitForImages();
    setupCustomCursor(); // Inicializar el cursor personalizado
    
    // Iniciar transiciones después de que todo esté listo
    setTimeout(() => {
        setupImageTransitions();
    }, 1000);
});

document.addEventListener('mousemove', (e) => {
    customCursor.style.left = `${e.clientX}px`;
    customCursor.style.top = `${e.clientY}px`;

    // Mover el cursor de respaldo (fallback)
    const fallbackCursor = document.getElementById('cursor-fallback');
    fallbackCursor.style.left = `${e.clientX}px`;
    fallbackCursor.style.top = `${e.clientY}px`;
});