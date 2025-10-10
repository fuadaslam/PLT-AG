/**
 * Enhanced Header & Footer JavaScript
 * PLT AG Website
 */

(function () {
  "use strict";

  // ======================================
  // Header Functionality
  // ======================================

  /**
   * Header scroll effect
   */
  const header = document.getElementById("header");
  if (header) {
    const headerScrolled = () => {
      if (window.scrollY > 100) {
        header.classList.add("header-scrolled");
      } else {
        header.classList.remove("header-scrolled");
      }
    };
    window.addEventListener("scroll", headerScrolled);
    window.addEventListener("load", headerScrolled);
  }

  /**
   * Mobile navigation toggle
   */
  const mobileNavToggle = document.querySelector(".mobile-nav-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  const mobileNavOverlay = document.querySelector(".mobile-nav-overlay");
  const mobileNavClose = document.querySelector(".mobile-nav-close");

  const toggleMobileNav = () => {
    if (mobileNav && mobileNavOverlay) {
      mobileNav.classList.toggle("active");
      mobileNavOverlay.classList.toggle("active");
      document.body.style.overflow = mobileNav.classList.contains("active")
        ? "hidden"
        : "";
    }
  };

  const closeMobileNav = () => {
    if (mobileNav && mobileNavOverlay) {
      mobileNav.classList.remove("active");
      mobileNavOverlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  };

  if (mobileNavToggle) {
    mobileNavToggle.addEventListener("click", toggleMobileNav);
  }

  if (mobileNavClose) {
    mobileNavClose.addEventListener("click", closeMobileNav);
  }

  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener("click", closeMobileNav);
  }

  // Close mobile nav on link click
  const mobileNavLinks = document.querySelectorAll(".mobile-nav-list a");
  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileNav && mobileNav.classList.contains("active")) {
        closeMobileNav();
      }
    });
  });

  // Close mobile nav on escape key
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      mobileNav &&
      mobileNav.classList.contains("active")
    ) {
      closeMobileNav();
    }
  });

  /**
   * Active page highlighting
   */
  const setActiveNavLinks = () => {
    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";
    const currentHash = window.location.hash;

    // Desktop navigation
    const desktopNavLinks = document.querySelectorAll(".nav-menu .nav-link");
    desktopNavLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href) {
        // Check for exact page match
        if (href.includes(currentPage)) {
          link.classList.add("active");
        }
        // Check for hash match
        else if (currentHash && href.includes(currentHash)) {
          link.classList.add("active");
        }
        // Handle index.html as home
        else if (
          (currentPage === "" || currentPage === "index.html") &&
          href.includes("index.html")
        ) {
          link.classList.add("active");
        }
      }
    });

    // Mobile navigation
    const mobileNavLinks = document.querySelectorAll(".mobile-nav-list a");
    mobileNavLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href) {
        if (
          href.includes(currentPage) ||
          (currentHash && href.includes(currentHash)) ||
          ((currentPage === "" || currentPage === "index.html") &&
            href.includes("index.html"))
        ) {
          link.classList.add("active");
        }
      }
    });
  };

  // Set active links on page load
  window.addEventListener("load", setActiveNavLinks);

  // Update active links on hash change
  window.addEventListener("hashchange", setActiveNavLinks);

  /**
   * Smooth scroll for anchor links
   */
  const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
  smoothScrollLinks.forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href && href !== "#" && href !== "#!") {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerHeight = header ? header.offsetHeight : 0;
          const targetPosition = target.offsetTop - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });

          // Update URL hash
          if (history.pushState) {
            history.pushState(null, null, href);
          } else {
            window.location.hash = href;
          }

          // Close mobile nav if open
          closeMobileNav();
        }
      }
    });
  });

  // ======================================
  // Footer Functionality
  // ======================================

  /**
   * Set current year in footer
   */
  const setCurrentYear = () => {
    const yearElement = document.getElementById("currentYear");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  };
  window.addEventListener("load", setCurrentYear);

  /**
   * Back to top button
   */
  const backToTop = document.getElementById("backToTop");

  const toggleBackToTop = () => {
    if (backToTop) {
      if (window.scrollY > 300) {
        backToTop.classList.add("show");
      } else {
        backToTop.classList.remove("show");
      }
    }
  };

  window.addEventListener("scroll", toggleBackToTop);
  window.addEventListener("load", toggleBackToTop);

  if (backToTop) {
    backToTop.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  /**
   * Animate footer elements on scroll
   */
  const animateFooterElements = () => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    const footerElements = document.querySelectorAll(
      ".footer-about, .footer-links, .footer-contact"
    );
    footerElements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = "all 0.6s ease";
      observer.observe(el);
    });
  };

  window.addEventListener("load", animateFooterElements);

  /**
   * Social links tracking (optional - for analytics)
   */
  const trackSocialClick = (platform) => {
    // Add your analytics tracking code here
    console.log(`Social link clicked: ${platform}`);

    // Example: Google Analytics tracking
    if (typeof gtag !== "undefined") {
      gtag("event", "social_click", {
        event_category: "engagement",
        event_label: platform,
      });
    }
  };

  const socialLinks = document.querySelectorAll(
    ".footer-social-links a, .mobile-social-links a"
  );
  socialLinks.forEach((link) => {
    link.addEventListener("click", function () {
      const platform = this.classList.contains("facebook")
        ? "Facebook"
        : this.classList.contains("instagram")
        ? "Instagram"
        : this.classList.contains("youtube")
        ? "YouTube"
        : this.classList.contains("whatsapp")
        ? "WhatsApp"
        : "Unknown";
      trackSocialClick(platform);
    });
  });

  // ======================================
  // Utility Functions
  // ======================================

  /**
   * Debounce function for performance
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Check if element is in viewport
   */
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Handle resize events
   */
  const handleResize = debounce(() => {
    // Close mobile nav on resize to desktop
    if (
      window.innerWidth > 991 &&
      mobileNav &&
      mobileNav.classList.contains("active")
    ) {
      closeMobileNav();
    }
  }, 250);

  window.addEventListener("resize", handleResize);

  // ======================================
  // Accessibility Enhancements
  // ======================================

  /**
   * Trap focus in mobile navigation when open
   */
  const trapFocus = (element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    element.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    });
  };

  if (mobileNav) {
    trapFocus(mobileNav);
  }

  /**
   * Announce page changes to screen readers
   */
  const announcePageChange = (message) => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // ======================================
  // Performance Optimization
  // ======================================

  /**
   * Lazy load footer images
   */
  const lazyLoadImages = () => {
    const images = document.querySelectorAll("img[data-src]");
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  };

  window.addEventListener("load", lazyLoadImages);

  // ======================================
  // Error Handling
  // ======================================

  /**
   * Global error handler
   */
  window.addEventListener("error", (e) => {
    console.error("An error occurred:", e.error);
    // Optionally send error to logging service
  });

  /**
   * Console welcome message
   */
  console.log(
    "%c🌱 PLT AG - Plant Labz Tech %c\n" +
      "Innovative Agricultural Solutions\n" +
      "Visit: https://plantlabztech.com",
    "color: #4CAF50; font-size: 20px; font-weight: bold;",
    "color: #666; font-size: 12px;"
  );
})();
