document.addEventListener("DOMContentLoaded", () => {
    // Helper for debouncing
    function debounce(func, wait) {
        let timeout;
        return function () {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // DOM Elements
    const intro = document.getElementById("intro");
    const mainContent = document.getElementById("main-content");
    const video = document.getElementById("bg-video");
    const infoBtn = document.getElementById("info-btn");
    const infoPanel = document.getElementById("info-panel");
    const closeInfo = document.getElementById("close-info");
    const introTitle = document.querySelector(".intro-title");
    const customCursor = document.getElementById('custom-cursor');
    const gallery = document.querySelector(".gallery");

    if (gallery) gallery.classList.add('gallery-initializing');

    // Show title with fade-in
    const showTitle = () => {
        if (introTitle) {
            introTitle.style.transition = "opacity 1.5s ease-in-out";
            introTitle.style.opacity = "1";
        }
    };

    // Hide intro animation
    const hideIntro = () => {
        if (!intro || !mainContent) return;
        intro.style.transition = "opacity 0.8s ease-in-out";
        intro.style.opacity = "0";
        setTimeout(() => {
            intro.style.display = "none";
            mainContent.classList.remove("hidden");
            requestAnimationFrame(() => setTimeout(initializeGallery, 300));
        }, 800);
    };

    // Autoplay video
    const handleVideoAutoplay = () => {
        if (!video) return;
        video.muted = true;
        video.playsInline = true;
        video.play().catch(() => {});
        setTimeout(showTitle, 4000);
    };

    // Custom Cursor Setup
    const setupCustomCursor = () => {
        if (!customCursor) return;

        let ticking = false, lastX = 0, lastY = 0;

        document.addEventListener('mousemove', (e) => {
            lastX = e.clientX;
            lastY = e.clientY;
            if (!ticking) {
                requestAnimationFrame(() => {
                    customCursor.style.left = `${lastX}px`;
                    customCursor.style.top = `${lastY}px`;
                    ticking = false;
                });
                ticking = true;
            }
        });

        setInterval(() => {
            const elementBelow = document.elementFromPoint(lastX, lastY);
            if (elementBelow) {
                const bgColor = window.getComputedStyle(elementBelow).backgroundColor;
                const colorMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (colorMatch) {
                    const [r, g, b] = colorMatch.slice(1).map(Number);
                    document.body.classList.toggle('dark-background', r < 100 && g < 100 && b < 100);
                }
            }
        }, 100);

        document.addEventListener('mouseleave', () => customCursor.style.opacity = '0');
        document.addEventListener('mouseenter', () => customCursor.style.opacity = '1');

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

    // Scroll Gallery Horizontally on Any Scroll
    const setupScrollConversion = () => {
        if (!gallery) return;

        const multiplier = 2;
        let isScrolling = false;
        let targetScrollLeft = gallery.scrollLeft;
        let lastScrollTime = Date.now();
        let isProgrammaticScroll = false;

        // Calculate loop points
        const recalculateLoopPoints = () => {
            const originalItems = document.querySelectorAll('.gallery > .original');
            if (!originalItems.length) return;
            
            // Calculate the width of all original items
            let totalOriginalWidth = 0;
            originalItems.forEach(item => {
                const style = window.getComputedStyle(item);
                const width = parseFloat(style.width) + 
                              parseFloat(style.marginLeft) + 
                              parseFloat(style.marginRight);
                totalOriginalWidth += width;
            });
            
            return totalOriginalWidth;
        };

        // Smooth scroll animation function
        const smoothScroll = () => {
            if (!isScrolling) return;

            const now = Date.now();
            const deltaTime = Math.min(now - lastScrollTime, 100); // Cap to prevent jumps
            lastScrollTime = now;

            // Apply damping based on time delta for smoother experience
            const dampingFactor = Math.min(deltaTime / 16, 1); // Cap at ~60fps
            const diff = targetScrollLeft - gallery.scrollLeft;

            if (Math.abs(diff) < 0.5) {
                gallery.scrollLeft = targetScrollLeft;
                isScrolling = false;
                checkForLoop(); // Check if we're near edge and need to loop
                return;
            }

            gallery.scrollLeft += diff * (0.15 * dampingFactor);
            requestAnimationFrame(smoothScroll);
        };

        // Check if we need to loop and jump to the corresponding position
        const checkForLoop = () => {
            if (isProgrammaticScroll) return; // Prevent infinite recursion
            
            const totalOriginalWidth = recalculateLoopPoints();
            if (!totalOriginalWidth) return;
            
            // Define a threshold for when to loop (adjust as needed)
            const threshold = Math.min(window.innerWidth * 0.3, totalOriginalWidth * 0.2);
            
            // If we're near the beginning and scrolling left
            if (gallery.scrollLeft < threshold) {
                isProgrammaticScroll = true;
                // Jump to one set back from the end
                gallery.scrollLeft += totalOriginalWidth;
                isProgrammaticScroll = false;
            } 
            // If we're near the end and scrolling right
            else if (gallery.scrollLeft > gallery.scrollWidth - gallery.clientWidth - threshold) {
                isProgrammaticScroll = true;
                // Jump to one set forward from the beginning
                gallery.scrollLeft -= totalOriginalWidth;
                isProgrammaticScroll = false;
            }
        };

        const galleryContainer = document.querySelector('.gallery-container') || gallery.parentElement;
        if (!galleryContainer) return;

        // Handle vertical wheel events and convert to horizontal scrolling
        galleryContainer.addEventListener('wheel', (e) => {
            const rect = galleryContainer.getBoundingClientRect();
            const isInGallery =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (!isInGallery) return;

            e.preventDefault();

            if (isProgrammaticScroll) return;

            const scrollAmount = e.deltaY * multiplier;
            const maxScroll = gallery.scrollWidth - gallery.clientWidth;
            targetScrollLeft = Math.max(0, Math.min(gallery.scrollLeft + scrollAmount, maxScroll));

            if (!isScrolling) {
                isScrolling = true;
                requestAnimationFrame(smoothScroll);
            }
        }, { passive: false });

        // Handle horizontal wheel events
        galleryContainer.addEventListener('wheel', (e) => {
            if (e.deltaX === 0) return; // Skip if there's no horizontal scroll component
            
            const rect = galleryContainer.getBoundingClientRect();
            const isInGallery =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (!isInGallery) return;

            e.preventDefault();

            if (isProgrammaticScroll) return;

            const scrollAmount = e.deltaX * multiplier;
            const maxScroll = gallery.scrollWidth - gallery.clientWidth;
            targetScrollLeft = Math.max(0, Math.min(gallery.scrollLeft + scrollAmount, maxScroll));

            if (!isScrolling) {
                isScrolling = true;
                requestAnimationFrame(smoothScroll);
            }
        }, { passive: false });

        // Add scroll event listener to detect when to loop
        gallery.addEventListener('scroll', () => {
            if (!isProgrammaticScroll) {
                checkForLoop();
            }
        });

        // Handle touch events for mobile devices
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartScrollLeft = 0;

        galleryContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartScrollLeft = gallery.scrollLeft;
            
            // Stop any ongoing smooth scrolling
            isScrolling = false;
        }, { passive: true });

        galleryContainer.addEventListener('touchmove', (e) => {
            if (!touchStartX) return;
            
            const touchCurrentX = e.touches[0].clientX;
            const touchCurrentY = e.touches[0].clientY;
            
            // Calculate horizontal and vertical difference
            const diffX = touchStartX - touchCurrentX;
            const diffY = touchStartY - touchCurrentY;
            
            // If horizontal scrolling is more prominent than vertical scrolling
            if (Math.abs(diffX) > Math.abs(diffY)) {
                e.preventDefault();
                
                // Calculate new scroll position
                const newScrollLeft = touchStartScrollLeft + diffX;
                const maxScroll = gallery.scrollWidth - gallery.clientWidth;
                
                // Apply the scroll directly without smooth animation for better touch response
                gallery.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));
            }
        }, { passive: false });

        galleryContainer.addEventListener('touchend', (e) => {
            touchStartX = 0;
            touchStartY = 0;
            
            // Check if we need to loop
            checkForLoop();
        }, { passive: true });

        // Initialize the gallery to a middle position
        const initialPositionSetup = () => {
            const totalOriginalWidth = recalculateLoopPoints();
            if (totalOriginalWidth) {
                isProgrammaticScroll = true;
                gallery.scrollLeft = totalOriginalWidth; // Start at one set in
                isProgrammaticScroll = false;
            }
        };

        // Set initial position after a short delay to ensure gallery is ready
        setTimeout(initialPositionSetup, 300);
    };

    // Image Transitions
    const setupImageTransitions = () => {
        const wrappers = document.querySelectorAll('.image-transition-wrapper.original');
        wrappers.forEach(wrapper => {
            if (!wrapper.dataset.wrapperId) wrapper.dataset.wrapperId = Math.random().toString(36).substr(2, 9);
            const images = wrapper.querySelectorAll('img');
            if (images.length === 0) return;
            let currentIndex = 0;
            images[currentIndex].classList.add('active');

            if (images.length > 1) {
                clearInterval(wrapper._transitionInterval);
                wrapper._transitionInterval = setInterval(() => {
                    images[currentIndex].classList.remove('active');
                    currentIndex = (currentIndex + 1) % images.length;
                    images[currentIndex].classList.add('active');
                }, 1200);
            }
        });
    };

    // Gallery Initialization
    const initializeGallery = () => {
        if (!gallery) return;

        const height = window.innerHeight * 0.75;
        gallery.style.height = `${height}px`;

        document.querySelectorAll('.image, .image-transition-wrapper').forEach(item => {
            item.style.height = `${height}px`;
        });

        setupGallery();
        waitForImages();
    };

    const setupGallery = () => {
        if (!gallery) return;
        gallery.classList.add('gallery-initializing');
        document.querySelectorAll('.gallery > .clone').forEach(el => el.remove());

        const originals = Array.from(gallery.children);
        originals.forEach(item => {
            item.classList.add('original');
            if (!item.dataset.wrapperId && item.classList.contains('image-transition-wrapper')) {
                item.dataset.wrapperId = Math.random().toString(36).substr(2, 9);
            }
        });

        // Create multiple sets of clones to ensure we have enough content for looping
        // More sets = smoother infinite scroll, but more DOM elements
        const createClones = (count) => {
            for (let i = 0; i < count; i++) {
                const fragment = document.createDocumentFragment();
                originals.forEach(item => {
                    const clone = item.cloneNode(true);
                    clone.classList.remove('original');
                    clone.classList.add('clone');
                    if (item.classList.contains('image-transition-wrapper')) {
                        clone.dataset.originalId = item.dataset.wrapperId;
                    }
                    fragment.appendChild(clone);
                });
                gallery.appendChild(fragment);
            }
        };

        // Create enough clones for seamless looping (3 sets is usually sufficient)
        createClones(3);
    };

    const waitForImages = () => {
        if (!gallery) return;
        const images = document.querySelectorAll(".image img, .image-transition-wrapper img");
        let loaded = 0, total = images.length;
        if (total === 0) return activateGallery();

        const imageLoaded = () => {
            loaded++;
            if (loaded === Math.ceil(total * 0.3)) {
                adjustWidth();
                activateGallery();
                forceResize();
            }
        };

        images.forEach((img, i) => {
            img.loading = i < 10 ? "eager" : "lazy";
            if (img.complete) imageLoaded();
            else img.addEventListener("load", imageLoaded);
        });

        setTimeout(() => {
            if (loaded < total) {
                console.log(`Only ${loaded}/${total} images loaded`);
                adjustWidth();
                activateGallery();
                forceResize();
            }
        }, 1500);
    };

    const adjustWidth = () => {
        const staticImages = document.querySelectorAll(".image.static img");
        const transitionWrappers = document.querySelectorAll(".image-transition-wrapper");
        if (staticImages.length === 0 || transitionWrappers.length === 0) return;

        const verticalImage = [...staticImages].find(img => img.naturalHeight > img.naturalWidth);
        if (verticalImage) {
            const width = verticalImage.clientWidth;
            transitionWrappers.forEach(wrapper => wrapper.style.width = `${width}px`);
        }
    };

    const activateGallery = () => {
        if (!gallery) return;
        gallery.classList.remove('gallery-initializing');
        gallery.classList.add('gallery-ready');
        setupScrollConversion();
    };

    const forceResize = () => requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));

    // Info Panel Logic
    const setupInfoPanelClickOutside = () => {
        if (!infoPanel) return;
        document.addEventListener('click', (e) => {
            if (!infoPanel.classList.contains('active')) return;
            if (!infoPanel.contains(e.target) && e.target !== infoBtn) {
                infoPanel.classList.remove('active');
            }
        });
    };

    const initEventHandlers = () => {
        if (intro) {
            intro.addEventListener("click", hideIntro);
            setTimeout(hideIntro, 60000);
        }

        if (infoBtn && infoPanel) {
            infoBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                infoPanel.classList.add("active");
            });
        }

        if (closeInfo && infoPanel) {
            closeInfo.addEventListener("click", () => infoPanel.classList.remove("active"));
        }

        setupInfoPanelClickOutside();

        window.addEventListener("resize", debounce(() => {
            adjustWidth();
            if (gallery) {
                const height = window.innerHeight * 0.75;
                gallery.style.height = `${height}px`;
                document.querySelectorAll('.image, .image-transition-wrapper').forEach(item => {
                    item.style.height = `${height}px`;
                });
            }
        }, 100));

        window.addEventListener("orientationchange", () => setTimeout(initializeGallery, 200));

        if (gallery) document.body.classList.add('has-horizontal-gallery');
    };

    // Main Init
    const init = () => {
        handleVideoAutoplay();
        setupCustomCursor();
        initEventHandlers();
        if (!intro || getComputedStyle(intro).display === 'none') initializeGallery();
        setTimeout(setupImageTransitions, 1500);
    };

    init();

    window.addEventListener('load', () => {
        if (gallery && gallery.classList.contains('gallery-initializing')) {
            console.log("Fallback gallery initialization");
            initializeGallery();
        }
    });
});
