/**
 * SKUY ANIME - Enhanced JavaScript
 * Modern anime streaming platform with cinematic experience
 */

// =========================
// INITIALIZATION & GLOBALS
// =========================

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const appContainer = document.getElementById("app-container");
  const loader = document.getElementById("loader");
  const navLinks = document.querySelectorAll(".nav-link");
  const themeToggle = document.getElementById("theme-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  const mobileOverlay = document.getElementById("mobile-overlay");
  const body = document.body;
  const toastContainer = document.getElementById("toast-container");

  // Application State
  let currentPage = { "anime-terbaru": 1, movie: 1 };
  let scheduleData = null;
  let swiperInstance = null;
  let searchTimeout = null;
  let isLoading = false;

  // =========================
  // UTILITY FUNCTIONS
  // =========================

  /**
   * Show loading indicator with optional custom message
   */
  const showLoader = (message = "Memuat konten anime...") => {
    if (isLoading) return;
    isLoading = true;
    const loaderText = loader.querySelector(".loader-text");
    if (loaderText) loaderText.textContent = message;
    loader.style.display = "flex";
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.opacity = "1";
    }, 10);
  };

  /**
   * Hide loading indicator with smooth transition
   */
  const hideLoader = () => {
    if (!isLoading) return;
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.display = "none";
      isLoading = false;
    }, 300);
  };

  /**
   * Show toast notification
   */
  const showToast = (message, type = "info", duration = 4000) => {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fa-solid fa-${getToastIcon(type)}"></i>
        <span>${message}</span>
      </div>
    `;

    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    // Auto remove
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  };

  /**
   * Get appropriate icon for toast type
   */
  const getToastIcon = (type) => {
    const icons = {
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    return icons[type] || "info-circle";
  };

  /**
   * Set active navigation link with animation
   */
  const setActiveLink = (targetNav) => {
    navLinks.forEach((link) => {
      if (link.dataset.nav === targetNav) {
        link.classList.add("active");
        // Add ripple effect
        createRippleEffect(link);
      } else {
        link.classList.remove("active");
      }
    });
    closeMobileMenu();
  };

  /**
   * Create ripple effect on click
   */
  const createRippleEffect = (element) => {
    const ripple = document.createElement("span");
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = "50%";
    ripple.style.top = "50%";
    ripple.style.transform = "translate(-50%, -50%)";
    ripple.classList.add("ripple");

    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  /**
   * Enhanced fetch with retry logic and error handling
   */
  const fetchData = async (url, retries = 3) => {
    showLoader();

    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        hideLoader();
        return data;
      } catch (error) {
        console.error(`Fetch attempt ${i + 1} failed:`, error);

        if (i === retries - 1) {
          hideLoader();
          showToast(`Gagal memuat data: ${error.message}`, "error");
          appContainer.innerHTML = `
            <div class="error-container">
              <div class="error-content">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <h2>Oops! Terjadi Kesalahan</h2>
                <p>Gagal memuat data. Silakan coba lagi nanti.</p>
                <button class="btn" onclick="location.reload()">
                  <i class="fa-solid fa-refresh"></i>
                  Muat Ulang
                </button>
              </div>
            </div>
          `;
          return null;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  // =========================
  // THEME & UI MANAGEMENT
  // =========================

  /**
   * Apply theme with smooth transition
   */
  const applyTheme = (theme) => {
    body.style.transition = "background-color 0.3s ease, color 0.3s ease";

    if (theme === "light") {
      body.classList.add("light-theme");
    } else {
      body.classList.remove("light-theme");
    }

    localStorage.setItem("theme", theme);
    showToast(
      `Tema ${theme === "light" ? "terang" : "gelap"} diaktifkan`,
      "success",
      2000,
    );
  };

  /**
   * Toggle mobile menu
   */
  const toggleMobileMenu = () => {
    sidebar.classList.toggle("open");
    mobileOverlay.classList.toggle("active");
    body.style.overflow = sidebar.classList.contains("open") ? "hidden" : "";
  };

  /**
   * Initialize sidebar state
   */
  const initializeSidebar = () => {
    // Ensure sidebar is collapsed by default on desktop
    if (window.innerWidth > 768) {
      sidebar.classList.remove("open");
    }

    // Add custom styling for collapsed state
    if (!sidebar.classList.contains("open")) {
      sidebar.style.width = "70px";
    }
  };

  /**
   * Close mobile menu
   */
  const closeMobileMenu = () => {
    sidebar.classList.remove("open");
    mobileOverlay.classList.remove("active");
    body.style.overflow = "";
  };

  // =========================
  // RENDER FUNCTIONS
  // =========================

  /**
   * Enhanced grid rendering with lazy loading and animations
   */
  const renderGrid = (items, type) => {
    if (!items || items.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-content">
            <i class="fa-solid fa-search"></i>
            <h3>Tidak Ada Data</h3>
            <p>Belum ada konten yang tersedia saat ini.</p>
          </div>
        </div>
      `;
    }

    const linkType =
      type === "episode" || type === "watch" ? "watch" : "detail";

    return items
      .map((item, index) => {
        const imageUrl =
          item.cover_hd ||
          item.cover ||
          item.url_cover ||
          item.cover_url ||
          item.thumbnail_url;
        const title = item.judul || item.title;
        const url = item.url || item.url_episode;

        return `
          <article class="anime-card animate-fade-in-up" style="animation-delay: ${index * 0.1}s">
            <a href="#${linkType}/${btoa(url)}" class="card-link">
              <div class="card-img-container">
                <img 
                  src="${imageUrl}" 
                  alt="${title}"
                  loading="lazy"
                  onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMjAyMDIwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2NjY2IiBmb250LXNpemU9IjE4Ij5Ob3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPgo='"
                />
                <div class="card-overlay">
                  <i class="fa-solid fa-play"></i>
                </div>
              </div>
              <div class="card-content">
                <h3 class="card-title" title="${title}">${title}</h3>
                ${item.episode ? `<div class="card-meta"><i class="fa-solid fa-film"></i> ${item.episode}</div>` : ""}
                ${item.waktu_rilis ? `<div class="card-meta"><i class="fa-solid fa-clock"></i> ${item.waktu_rilis}</div>` : ""}
                ${item.release_time ? `<div class="card-meta"><i class="fa-solid fa-calendar"></i> ${item.release_time}</div>` : ""}
                ${item.status ? `<div class="card-meta"><i class="fa-solid fa-info-circle"></i> ${item.status}</div>` : ""}
                ${item.views ? `<div class="card-meta"><i class="fa-solid fa-eye"></i> ${item.views}</div>` : ""}
                ${item.type ? `<div class="card-meta"><i class="fa-solid fa-tag"></i> ${item.type}</div>` : ""}
                ${
                  item.genres && item.genres.length > 0
                    ? `
                  <div class="card-genres">
                    ${item.genres
                      .slice(0, 3)
                      .map((g) => `<span class="genre-tag">${g}</span>`)
                      .join("")}
                    ${item.genres.length > 3 ? `<span class="genre-tag">+${item.genres.length - 3}</span>` : ""}
                  </div>
                `
                    : ""
                }
              </div>
              ${
                item.rating?.score || item.skor
                  ? `
                <div class="card-info rating">
                  <i class="fa-solid fa-star"></i> 
                  ${item.rating?.score || item.skor}
                </div>
              `
                  : ""
              }
            </a>
          </article>
        `;
      })
      .join("");
  };

  /**
   * Enhanced home page with better animations and layout
   */
  const renderHomePage = async () => {
    showLoader("Memuat halaman beranda...");
    const data = await fetchData("/api/home");
    if (!data) return;

    // Destroy existing swiper
    if (swiperInstance) {
      swiperInstance.destroy(true, true);
      swiperInstance = null;
    }

    let heroSection = "";
    const sliderItems =
      Array.isArray(data.top10) && data.top10.length > 0
        ? data.top10.slice(0, 5)
        : [];

    if (sliderItems.length > 0) {
      const slides = sliderItems
        .map((item, index) => {
          const detailUrl = `#detail/${btoa(item.url)}`;
          const imageUrl =
            item.cover_hd || item.cover || item.url_cover || item.cover_url;

          return `
            <div class="swiper-slide">
              <div class="slide-background" style="background-image: url('${imageUrl}');"></div>
              <div class="hero-content">
                <div class="hero-badge">🔥 Trending #${index + 1}</div>
                <h1 class="hero-title">${item.judul}</h1>
                <p class="hero-description">
                  Salah satu anime terpopuler minggu ini dengan rating ${item.rating || "★★★★☆"}.
                  Nikmati pengalaman menonton yang tak terlupakan dengan kualitas HD terbaik.
                </p>
                <div class="hero-stats">
                  <span class="stat-item">
                    <i class="fa-solid fa-star"></i>
                    ${item.rating || "9.0"}
                  </span>
                  <span class="stat-item">
                    <i class="fa-solid fa-eye"></i>
                    ${Math.floor(Math.random() * 100) + 50}K views
                  </span>
                  <span class="stat-item">
                    <i class="fa-solid fa-calendar"></i>
                    2024
                  </span>
                </div>
                <div class="hero-buttons">
                  <a href="${detailUrl}" class="btn hero-btn-primary">
                    <i class="fa-solid fa-play"></i>
                    Mulai Nonton
                  </a>
                  <a href="${detailUrl}" class="btn hero-btn-secondary">
                    <i class="fa-solid fa-info-circle"></i>
                    Info Detail
                  </a>
                  <button class="btn hero-btn-tertiary" onclick="addToWatchlist('${item.url}', '${item.judul}')">
                    <i class="fa-solid fa-bookmark"></i>
                    Watchlist
                  </button>
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      heroSection = `
        <section class="hero-section">
          <div class="hero-slider swiper">
            <div class="swiper-wrapper">${slides}</div>
            <div class="swiper-pagination"></div>
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
          </div>
        </section>
      `;
    }

    // Quick stats section
    const statsSection = `
      <section class="stats-section">
        <div class="stats-container">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fa-solid fa-play-circle"></i>
            </div>
            <div class="stat-content">
              <h3>${data.new_eps?.length || 0}+</h3>
              <p>Episode Baru</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fa-solid fa-fire"></i>
            </div>
            <div class="stat-content">
              <h3>${data.top10?.length || 0}</h3>
              <p>Anime Trending</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fa-solid fa-film"></i>
            </div>
            <div class="stat-content">
              <h3>${data.movies?.length || 0}+</h3>
              <p>Movie Anime</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fa-solid fa-users"></i>
            </div>
            <div class="stat-content">
              <h3>50K+</h3>
              <p>Pengguna Aktif</p>
            </div>
          </div>
        </div>
      </section>
    `;

    appContainer.innerHTML = `
      ${heroSection}
      ${statsSection}
      <section class="content-section">
        <h2 class="section-title">
          <i class="fa-solid fa-sparkles"></i>
          Episode Terbaru Hari Ini
        </h2>
        <div class="grid-container">${renderGrid(data.new_eps, "anime")}</div>
      </section>
      <section class="content-section">
        <h2 class="section-title">
          <i class="fa-solid fa-trophy"></i>
          Top 10 Anime Mingguan
        </h2>
        <div class="grid-container">${renderGrid(data.top10, "anime")}</div>
      </section>
      <section class="content-section">
        <h2 class="section-title">
          <i class="fa-solid fa-clapperboard"></i>
          Movie Anime Terpopuler
        </h2>
        <div class="grid-container">${renderGrid(data.movies, "anime")}</div>
      </section>
    `;

    // Initialize Swiper if slides exist
    if (sliderItems.length > 0) {
      setTimeout(() => {
        // Destroy any existing swiper first
        if (swiperInstance) {
          swiperInstance.destroy(true, true);
        }

        swiperInstance = new Swiper(".hero-slider", {
          loop: true,
          slidesPerView: 1,
          spaceBetween: 0,
          autoplay: {
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
            dynamicBullets: false,
          },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          effect: "fade",
          fadeEffect: {
            crossFade: true,
          },
          speed: 1000,
          on: {
            init: function () {
              console.log("Swiper initialized");
            },
          },
        });
      }, 200);
    }

    hideLoader();
  };

  // =========================
  // WATCHLIST FUNCTIONALITY
  // =========================

  /**
   * Add anime to watchlist
   */
  window.addToWatchlist = (url, title) => {
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");

    if (watchlist.find((item) => item.url === url)) {
      showToast("Anime sudah ada di watchlist!", "warning");
      return;
    }

    watchlist.push({
      url,
      title,
      addedAt: new Date().toISOString(),
    });

    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    showToast(`"${title}" ditambahkan ke watchlist!`, "success");
  };

  // =========================
  // EVENT LISTENERS
  // =========================

  // Theme toggle
  themeToggle.addEventListener("click", () => {
    const currentTheme = body.classList.contains("light-theme")
      ? "dark"
      : "light";
    applyTheme(currentTheme);
  });

  // Mobile menu toggle
  menuToggle.addEventListener("click", toggleMobileMenu);
  mobileOverlay.addEventListener("click", closeMobileMenu);

  // Close mobile menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("open")) {
      closeMobileMenu();
    }
  });

  // Enhanced search functionality
  const searchInput = document.querySelector(".search-bar input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();

      if (query.length > 2) {
        searchTimeout = setTimeout(() => {
          performSearch(query);
        }, 500);
      }
    });
  }

  /**
   * Perform search with debouncing
   */
  const performSearch = async (query) => {
    showLoader(`Mencari "${query}"...`);
    // Implement search functionality here
    setTimeout(() => {
      hideLoader();
      showToast(
        `Hasil pencarian untuk "${query}" akan segera tersedia`,
        "info",
      );
    }, 1000);
  };

  // =========================
  // ROUTER & NAVIGATION
  // =========================

  /**
   * Enhanced router with better error handling and animations
   */
  const router = async () => {
    const hash = window.location.hash || "#home";

    // Cleanup existing swiper
    if (swiperInstance && hash !== "#home") {
      swiperInstance.destroy(true, true);
      swiperInstance = null;
    }

    const [path, param] = hash.substring(1).split("/");
    setActiveLink(path || "home");

    // Add page transition
    appContainer.style.opacity = "0.7";
    appContainer.style.transform = "translateY(20px)";

    try {
      switch (path) {
        case "home":
          await renderHomePage();
          break;
        case "detail":
          await renderAnimeDetailPage(atob(param));
          break;
        case "watch":
          await renderWatchPage(atob(param));
          break;
        case "anime-terbaru":
          await renderListPage("anime-terbaru", currentPage["anime-terbaru"]);
          break;
        case "movie":
          await renderListPage("movie", currentPage.movie);
          break;
        case "jadwal":
          await renderSchedulePage();
          break;
        default:
          await renderHomePage();
      }
    } catch (error) {
      console.error("Router error:", error);
      showToast("Terjadi kesalahan saat memuat halaman", "error");
    }

    // Restore page transition
    setTimeout(() => {
      appContainer.style.opacity = "1";
      appContainer.style.transform = "translateY(0)";
    }, 100);
  };

  // =========================
  // INITIALIZATION
  // =========================

  // Apply saved theme
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);

  // Add smooth transitions
  appContainer.style.transition = "opacity 0.3s ease, transform 0.3s ease";

  // Navigation event listeners
  window.addEventListener("hashchange", router);

  // Initialize sidebar
  initializeSidebar();

  // Handle window resize
  window.addEventListener("resize", initializeSidebar);

  // Initial load
  router();

  // Add some placeholder functions for missing render functions
  window.renderAnimeDetailPage = async (url) => {
    showLoader("Memuat detail anime...");
    setTimeout(() => {
      appContainer.innerHTML = `
        <div class="detail-placeholder">
          <h1>Detail Anime</h1>
          <p>URL: ${url}</p>
          <p>Fitur detail anime sedang dalam pengembangan.</p>
        </div>
      `;
      hideLoader();
    }, 1000);
  };

  window.renderWatchPage = async (url) => {
    showLoader("Memuat player...");
    setTimeout(() => {
      appContainer.innerHTML = `
        <div class="watch-placeholder">
          <h1>Watch Page</h1>
          <p>URL: ${url}</p>
          <p>Fitur streaming sedang dalam pengembangan.</p>
        </div>
      `;
      hideLoader();
    }, 1000);
  };

  window.renderListPage = async (type, page) => {
    showLoader(`Memuat ${type}...`);
    const data = await fetchData(`/api/${type}?page=${page}`);
    if (!data) return;

    appContainer.innerHTML = `
      <section class="list-page">
        <h2 class="section-title">
          ${type === "anime-terbaru" ? "🆕 Anime Terbaru" : "🎬 Movie Anime"} - Halaman ${page}
        </h2>
        <div class="grid-container">${renderGrid(data, "detail")}</div>
        <div class="pagination">
          <button class="btn prev-btn" data-type="${type}" ${page === 1 ? "disabled" : ""}>
            <i class="fa-solid fa-chevron-left"></i> Sebelumnya
          </button>
          <span class="page-info">Halaman ${page}</span>
          <button class="btn next-btn" data-type="${type}">
            Selanjutnya <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </section>
    `;
  };

  window.renderSchedulePage = async () => {
    showLoader("Memuat jadwal rilis...");
    if (!scheduleData) {
      scheduleData = await fetchData("/api/jadwal-rilis");
    }
    if (!scheduleData) return;

    const days = Object.keys(scheduleData);
    if (days.length === 0) {
      appContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-content">
            <i class="fa-solid fa-calendar-xmark"></i>
            <h3>Tidak Ada Jadwal</h3>
            <p>Belum ada jadwal rilis yang tersedia.</p>
          </div>
        </div>
      `;
      return;
    }

    appContainer.innerHTML = `
      <section class="schedule-page">
        <h2 class="section-title">
          <i class="fa-solid fa-calendar-days"></i>
          Jadwal Rilis Anime
        </h2>
        <div class="schedule-tabs">
          ${days
            .map(
              (day, index) => `
            <button class="btn tab-btn ${index === 0 ? "active" : ""}" data-day="${day}">
              ${day.charAt(0).toUpperCase() + day.slice(1)}
            </button>
          `,
            )
            .join("")}
        </div>
        <div id="schedule-content" class="grid-container">
          ${renderGrid(scheduleData[days[0]], "anime")}
        </div>
      </section>
    `;
  };

  // =========================
  // EVENT DELEGATION
  // =========================

  appContainer.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;

    if (target.matches(".next-btn, .prev-btn")) {
      const type = target.dataset.type;
      if (target.matches(".next-btn")) currentPage[type]++;
      if (target.matches(".prev-btn") && currentPage[type] > 1)
        currentPage[type]--;
      router();
    }

    if (target.matches(".tab-btn")) {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      target.classList.add("active");
      const day = target.dataset.day;
      const content = document.getElementById("schedule-content");
      if (content && scheduleData) {
        content.innerHTML = renderGrid(scheduleData[day], "anime");
      }
    }
  });

  console.log(
    "🎌 Korteks Wibu Stream Bau Bawang - Platform loaded successfully!",
  );
  showToast("Selamat datang di Korteks Wibu Stream! 🎌", "success", 3000);
});
