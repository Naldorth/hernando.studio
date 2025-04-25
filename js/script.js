document.addEventListener("DOMContentLoaded", () => {
    // Helper function for debouncing
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Elementos del DOM
    const intro = document.getElementById("intro");
    const mainContent = document.getElementById("main-content");
    const video = document.getElementById("bg-video");
    const infoBtn = document.getElementById("info-btn");
    const infoPanel = document.getElementById("info-panel");
    const closeInfo = document.getElementById("close-info");
    const introTitle = document.querySelector(".intro-title");
    const customCursor = document.getElementById('custom-cursor');
    const gallery = document.querySelector(".gallery");
    
    // Add gallery initialization classes
    if (gallery) {
        gallery.classList.add('gallery-initializing');
    }

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
                
                // Delay gallery initialization to let the DOM stabilize
                requestAnimationFrame(() => {
                    setTimeout(initializeGallery, 300);
                });
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

        // Mover el cursor personalizado - optimizado con requestAnimationFrame
        let ticking = false;
        let lastX = 0;
        let lastY = 0;

        document.addEventListener('mousemove', (e) => {
            lastX = e.clientX;
            lastY = e.clientY;

            if (!ticking) {
                requestAnimationFrame(() => {
                    customCursor.style.left = `${lastX}px`;
                    customCursor.style.top = `${lastY}px`;
                    
                    // Detectar si el elemento debajo es oscuro - optimizado
                    // Solo comprobamos esto cada 100ms para mejorar rendimiento
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Throttled element detection
        setInterval(() => {
            const elementBelow = document.elementFromPoint(lastX, lastY);
            if (elementBelow) {
                const bgColor = window.getComputedStyle(elementBelow).backgroundColor;
                const colorMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                
                if (colorMatch) {
                    const r = parseInt(colorMatch[1]);
                    const g = parseInt(colorMatch[2]);
                    const b = parseInt(colorMatch[3]);
                    const isDark = r < 100 && g < 100 && b < 100;
                    
                    document.body.classList.toggle('dark-background', isDark);
                }
            }
        }, 100);

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

    // VERSIÓN MEJORADA DE LAS TRANSICIONES
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
                    
                    // Optimización: solo actualizar clones visibles
                    const viewportHeight = window.innerHeight;
                    const viewportWidth = window.innerWidth;
                    
                    document.querySelectorAll(`.image-transition-wrapper.clone[data-original-id="${wrapper.dataset.wrapperId}"]`).forEach(clone => {
                        const rect = clone.getBoundingClientRect();
                        // Only update if clone is visible (or close to viewport)
                        if (rect.right >= -100 && rect.left <= viewportWidth + 100 && 
                            rect.bottom >= -100 && rect.top <= viewportHeight + 100) {
                            const cloneImages = clone.querySelectorAll('img');
                            cloneImages.forEach(img => img.classList.remove('active'));
                            cloneImages[currentIndex].classList.add('active');
                        }
                    });
                }, 1200);
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
                // Avoid forced reflow by removing display manipulation
                // wrapper.style.display = "none";
                // void wrapper.offsetWidth;
                // wrapper.style.display = "";
            });
        }
    };

    const waitForImages = () => {
        if (!gallery) return;
        
        let images = document.querySelectorAll(".image img, .image-transition-wrapper img");
        let loaded = 0;
        let totalImages = images.length;
        
        if (totalImages === 0) {
            activateGallery();
            return;
        }
        
        // Activate gallery after just 30% of images load
        const minLoadThreshold = Math.ceil(totalImages * 0.3);
        let galleryActivated = false;
        
        const imageLoaded = () => {
            loaded++;
            // Activate gallery early once minimum threshold is reached
            if (!galleryActivated && loaded >= minLoadThreshold) {
                galleryActivated = true;
                adjustWidth();
                activateGallery();
                forceResize();
            }
        };
        
        images.forEach((img, index) => {
            // Prioritize loading the first few visible images
            if (index < 10) {
                img.loading = "eager";
            } else {
                img.loading = "lazy";
            }
            
            if (img.complete) {
                imageLoaded();
            } else {
                img.addEventListener("load", imageLoaded);
                img.addEventListener("error", imageLoaded);
            }
        });
        
        // Safety timeout reduced to 1.5 seconds
        setTimeout(() => {
            if (!galleryActivated) {
                console.log(`Only ${loaded}/${totalImages} images loaded, activating gallery anyway`);
                galleryActivated = true;
                adjustWidth();
                activateGallery();
                forceResize();
            }
        }, 1500);
    };

    const activateGallery = () => {
        if (!gallery) return;
        
        // Make sure the gallery has the correct height now that images are loaded
        const galleryHeight = window.innerHeight * 0.75; // 75vh
        gallery.style.height = `${galleryHeight}px`;
        
        // Remove initializing class and add ready class
        gallery.classList.remove('gallery-initializing');
        gallery.classList.add('gallery-ready');
    };

    const forceResize = () => {
        // Use a single resize with requestAnimationFrame
        requestAnimationFrame(() => {
            window.dispatchEvent(new Event("resize"));
        });
    };

    // VERSIÓN MEJORADA DE LA GALERÍA CON LAZY LOADING
    const setupGallery = () => {
        if (!gallery) return;

        // Keep gallery hidden during setup
        gallery.classList.add('gallery-initializing');

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

        // Create clones in batches
        const createClones = (count, startIndex = 0) => {
            const fragment = document.createDocumentFragment();
            
            for (let i = startIndex; i < startIndex + count; i++) {
                originals.forEach(item => {
                    const clone = item.cloneNode(true);
                    clone.classList.remove('original');
                    clone.classList.add('clone');
                    
                    if (item.classList.contains('image-transition-wrapper')) {
                        clone.dataset.originalId = item.dataset.wrapperId;
                        const activeIndex = Array.from(item.querySelectorAll('img')).findIndex(img => img.classList.contains('active'));
                        clone.querySelectorAll('img').forEach((img, idx) => {
                            img.classList.toggle('active', idx === activeIndex);
                        });
                    }
                    
                    fragment.appendChild(clone);
                });
            }
            
            gallery.appendChild(fragment);
        };
        
        // Create initial set of clones immediately (reduced count)
        createClones(5);
        
        // Create remaining clones after gallery is visible in batches
        let batchIndex = 5;
        const createRemainingClones = () => {
            if (batchIndex < 20) {
                requestAnimationFrame(() => {
                    createClones(3, batchIndex);
                    batchIndex += 3;
                    setTimeout(createRemainingClones, 100);
                });
            }
        };
        
        setTimeout(createRemainingClones, 800);

        // Optimized Drag and Scroll with passive events
        let isDragging = false;
        let startX;
        let scrollLeft;
        let lastX;
        let animationFrame;

        gallery.addEventListener("mousedown", (e) => {
            isDragging = true;
            startX = e.pageX - gallery.offsetLeft;
            scrollLeft = gallery.scrollLeft;
            gallery.style.cursor = 'grabbing';
            lastX = e.pageX;
            cancelAnimationFrame(animationFrame);
        }, { passive: true });

        gallery.addEventListener("mouseleave", () => {
            isDragging = false;
            gallery.style.cursor = 'grab';
        }, { passive: true });

        gallery.addEventListener("mouseup", () => {
            isDragging = false;
            gallery.style.cursor = 'grab';
        }, { passive: true });

        gallery.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            lastX = e.pageX;
            
            // Use requestAnimationFrame for smoother scrolling
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(() => {
                const x = lastX - gallery.offsetLeft;
                const walk = (x - startX) * 2;
                gallery.scrollLeft = scrollLeft - walk;
            });
        }, { passive: true });
    };

    // New function to initialize gallery with proper dimensions
    const initializeGallery = () => {
        if (!gallery) return;
        
        // Set initial dimensions explicitly based on viewport
        const galleryContainerHeight = window.innerHeight;
        const galleryHeight = galleryContainerHeight * 0.75; // 75vh
        
        const galleryContainer = document.querySelector('.gallery-container');
        if (galleryContainer) {
            galleryContainer.style.height = `${galleryContainerHeight}px`;
        }
        
        gallery.style.height = `${galleryHeight}px`;
        
        // Setup gallery structure
        setupGallery();
        
        // Make sure images are properly sized
        document.querySelectorAll('.image, .image-transition-wrapper').forEach(item => {
            item.style.height = `${galleryHeight}px`;
        });
        
        // Force layout recalculation
        forceResize();
        
        // Wait for images and continue initialization
        waitForImages();
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

        // Debounced resize handler
        window.addEventListener("resize", debounce(() => {
            adjustWidth();
            
            // Update gallery height on resize
            if (gallery) {
                const galleryHeight = window.innerHeight * 0.75; // 75vh
                gallery.style.height = `${galleryHeight}px`;
                
                document.querySelectorAll('.image, .image-transition-wrapper').forEach(item => {
                    item.style.height = `${galleryHeight}px`;
                });
            }
        }, 100));
        
        // Handle orientation change events specifically
        window.addEventListener("orientationchange", () => {
            setTimeout(() => {
                initializeGallery();
            }, 200);
        });
    };

    // Main init function to ensure proper sequence
    const init = () => {
        handleVideoAutoplay();
        setupCustomCursor();
        initEventHandlers();
        
        // If intro is not present or hidden, initialize gallery immediately
        if (!intro || getComputedStyle(intro).display === 'none') {
            initializeGallery();
        }
        
        // Set up transitions after everything else - with delay
        setTimeout(setupImageTransitions, 1500);
    };

    // Start initialization
    init();
    
    // Fallback initialization after the window load event
    window.addEventListener('load', () => {
        // Re-initialize if gallery isn't visible yet
        if (gallery && gallery.classList.contains('gallery-initializing')) {
            console.log("Fallback gallery initialization");
            initializeGallery();
        }
    });
});

// Optimized global mousemove event handler
(function() {
    let ticking = false;
    let lastX = 0;
    let lastY = 0;
    
    document.addEventListener('mousemove', (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        
        if (!ticking) {
            requestAnimationFrame(() => {
                const customCursor = document.getElementById('custom-cursor');
                if (customCursor) {
                    customCursor.style.left = `${lastX}px`;
                    customCursor.style.top = `${lastY}px`;
                }
                
                const fallbackCursor = document.getElementById('cursor-fallback');
                if (fallbackCursor) {
                    fallbackCursor.style.left = `${lastX}px`;
                    fallbackCursor.style.top = `${lastY}px`;
                }
                
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
})();