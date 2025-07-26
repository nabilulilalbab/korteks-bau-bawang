document.addEventListener("DOMContentLoaded", () => {
  const appContainer = document.getElementById("app-container");
  const loader = document.getElementById("loader");
  const navLinks = document.querySelectorAll(".nav-link");
  const themeToggle = document.getElementById("theme-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  const body = document.body;

  let currentPage = { "anime-terbaru": 1, movie: 1 };
  let scheduleData = null;
  let swiperInstance = null;

  // --- THEME & UI ---
  const applyTheme = (theme) => {
    if (theme === "light") {
      body.classList.add("light-theme");
    } else {
      body.classList.remove("light-theme");
    }
    localStorage.setItem("theme", theme);
  };

  themeToggle.addEventListener("click", () => {
    const currentTheme = body.classList.contains("light-theme")
      ? "dark"
      : "light";
    applyTheme(currentTheme);
  });

  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // --- UTILITIES ---
  const showLoader = () => (loader.style.display = "flex");
  const hideLoader = () => (loader.style.display = "none");

  const setActiveLink = (targetNav) => {
    navLinks.forEach((link) => {
      if (link.dataset.nav === targetNav) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
    sidebar.classList.remove("open");
  };

  const fetchData = async (url) => {
    showLoader();
    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Fetch Error:", error);
      appContainer.innerHTML = `<p class="error">Gagal memuat data. Coba lagi nanti.</p>`;
      return null;
    } finally {
      hideLoader();
    }
  };

  // --- RENDER FUNCTIONS ---
  const renderGrid = (items, type) => {
    if (!items || items.length === 0) return "<p>Tidak ada data ditemukan.</p>";
    const linkType = type === "episode" || type === "watch" ? "watch" : "detail";
    return items
      .map(
        (item) => `
            <a href="#${linkType}/${btoa(item.url || item.url_episode)}" class="anime-card">
                <div class="card-img-container">
                    <img src="${item.cover_hd || item.cover || item.url_cover || item.cover_url || item.thumbnail_url}" alt="${item.judul || item.title}" loading="lazy">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${item.judul || item.title}</h3>
                    ${item.episode ? `<div class="card-meta">Episode: ${item.episode}</div>` : ""}
                    ${item.waktu_rilis ? `<div class="card-meta">Rilis: ${item.waktu_rilis}</div>` : ""}
                    ${item.release_time ? `<div class="card-meta">Waktu Rilis: ${item.release_time}</div>` : ""}
                    ${item.status ? `<div class="card-meta">Status: ${item.status}</div>` : ""}
                    ${item.views ? `<div class="card-meta">Views: ${item.views}</div>` : ""}
                    ${item.type ? `<div class="card-meta">Tipe: ${item.type}</div>` : ""}
                    ${item.genres && item.genres.length > 0 ? `<div class="card-genres">${item.genres.map(g => `<span class="genre-tag">${g}</span>`).join("")}</div>` : ""}
                </div>
                ${item.rating?.score || item.skor ? `<div class="card-info rating"><i class="fa-solid fa-star"></i> ${item.rating?.score || item.skor}</div>` : ""}
            </a>
        `,
      )
      .join("");
  };

  const renderHomePage = async () => {
    const data = await fetchData("/api/home");
    if (!data) return;

    let sliderHTML = "";
    // Defensive check: pastikan data.top10 ada dan merupakan array
    const sliderItems =
      Array.isArray(data.top10) && data.top10.length > 0
        ? data.top10.slice(0, 5)
        : [];

    if (sliderItems.length > 0) {
      const slides = sliderItems
        .map((item) => {
          const detailUrl = `#detail/${btoa(item.url)}`;
          return `
                    <div class="swiper-slide" style="background-image: url('${item.cover_hd || item.cover || item.url_cover || item.cover_url}');">
                        <div class="hero-content">
                            <h1 class="hero-title">${item.judul}</h1>
                            <p class="hero-description">Salah satu anime terpopuler minggu ini. Lihat detail lengkapnya sekarang.</p>
                            <div class="hero-buttons">
                                <a href="${detailUrl}" class="btn hero-btn-primary">
                                    <i class="fa-solid fa-play"></i> Mulai Nonton
                                </a>
                                <a href="${detailUrl}" class="btn hero-btn-secondary">
                                    <i class="fa-solid fa-circle-info"></i> Lihat Detail
                                </a>
                            </div>
                        </div>
                    </div>
                `;
        })
        .join("");

      sliderHTML = `
                <div class="hero-slider swiper">
                    <div class="swiper-wrapper">${slides}</div>
                    <div class="swiper-pagination"></div>
                    <div class="swiper-button-prev"></div>
                    <div class="swiper-button-next"></div>
                </div>
            `;
    }

    if (swiperInstance) {
      swiperInstance.destroy(true, true);
      swiperInstance = null;
    }

    appContainer.innerHTML = `
            ${sliderHTML}
            <section>
                <h2 class="section-title">✨ Rilisan Episode Terbaru</h2>
                <div class="grid-container">${renderGrid(data.new_eps, "anime")}</div>
            </section>
            <section style="margin-top: 2.5rem;">
                <h2 class="section-title">🔥 Top 10 Mingguan</h2>
                <div class="grid-container">${renderGrid(data.top10, "anime")}</div>
            </section>
            <section style="margin-top: 2.5rem;">
                <h2 class="section-title">🎬 Project Movie</h2>
                <div class="grid-container">${renderGrid(data.movies, "anime")}</div>
            </section>
        `;

    if (sliderItems.length > 0) {
      swiperInstance = new Swiper(".hero-slider", {
        loop: true,
        autoplay: { delay: 4000, disableOnInteraction: false },
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
          dynamicBullets: true,
        },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        effect: "fade",
        fadeEffect: { crossFade: true },
      });
    }
  };

  const renderAnimeDetailPage = async (url) => {
    const data = await fetchData(`/api/anime-detail?url=${url}`);
    if (!data) return;

    // Prepare details HTML
    let detailsHtml = '';
    if (data.details && Object.keys(data.details).length > 0) {
        detailsHtml = `
            <div class="detail-section">
                <h2 class="section-title">Detail Informasi</h2>
                <div class="detail-info-grid">
                    ${Object.entries(data.details).map(([key, value]) => `
                        <div class="detail-item">
                            <span class="detail-key">${key}:</span>
                            <span class="detail-value">${value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Prepare recommendations HTML
    let recommendationsHtml = '';
    if (data.recommendations && data.recommendations.length > 0) {
        recommendationsHtml = `
            <div class="detail-section">
                <h2 class="section-title">Rekomendasi Anime Lainnya</h2>
                <div class="grid-container">${renderGrid(data.recommendations, "anime")}</div>
            </div>
        `;
    }

    appContainer.innerHTML = `
            <div class="detail-header">
                <div class="detail-thumbnail">
                    <img src="${data.thumbnail_url}" alt="${data.title}">
                </div>
                <div class="detail-main-info">
                    <h1>${data.title}</h1>
                    <div class="rating"><i class="fa-solid fa-star"></i> ${data.rating.score} (${data.rating.users} pengguna)</div>
                    <div class="genres">
                        ${data.genres.map((g) => `<span class="genre-badge">${g}</span>`).join("")}
                    </div>
                    <p class="synopsis">${data.synopsis}</p>
                </div>
            </div>
            ${detailsHtml}
            <div class="detail-section">
                <h2 class="section-title">Daftar Episode</h2>
                <ul class="episode-list">
                    ${data.episode_list.map((ep) => `<li><a href="#watch/${btoa(ep.url)}">${ep.title}</a></li>`).join("")}
                </ul>
            </div>
            ${recommendationsHtml}
        `;
  };

  const createVideoPlayer = (url) => {
    if (!url) return "<p>Link streaming tidak tersedia.</p>";
    if (url.includes("pixeldrain.com/u/")) url = url.replace("/u/", "/e/");
    return `<iframe src="${url}" allowfullscreen></iframe>`;
  };

  const renderWatchPage = async (url) => {
    const data = await fetchData(`/api/episode-detail?url=${url}`);
    if (!data) return;

    // Prepare navigation HTML
    let navHtml = '';
    if (data.navigation) {
        const { previous_episode_url, all_episodes_url, next_episode_url } = data.navigation;
        navHtml = `
            <div class="episode-navigation">
                ${previous_episode_url ? `<a href="#watch/${btoa(previous_episode_url)}" class="btn nav-btn"><i class="fa-solid fa-chevron-left"></i> Episode Sebelumnya</a>` : ''}
                ${all_episodes_url ? `<a href="#detail/${btoa(all_episodes_url)}" class="btn nav-btn">Semua Episode</a>` : ''}
                ${next_episode_url ? `<a href="#watch/${btoa(next_episode_url)}" class="btn nav-btn">Episode Selanjutnya <i class="fa-solid fa-chevron-right"></i></a>` : ''}
            </div>
        `;
    }

    // Prepare anime info HTML
    let animeInfoHtml = '';
    if (data.anime_info) {
        animeInfoHtml = `
            <div class="detail-section">
                <h2 class="section-title">Informasi Anime</h2>
                <div class="anime-info-box">
                    <h3>${data.anime_info.title}</h3>
                    <p>${data.anime_info.synopsis}</p>
                    <div class="genres">
                        ${data.anime_info.genres.map((g) => `<span class="genre-badge">${g}</span>`).join("")}
                    </div>
                </div>
            </div>
        `;
    }

    // Prepare other episodes HTML
    let otherEpisodesHtml = '';
    if (data.other_episodes && data.other_episodes.length > 0) {
        otherEpisodesHtml = `
            <div class="detail-section">
                <h2 class="section-title">Episode Lainnya</h2>
                <div class="grid-container">${renderGrid(data.other_episodes, "watch")}</div>
            </div>
        `;
    }

    appContainer.innerHTML = `
            <h1 style="margin-bottom: 0.5rem;">${data.title}</h1>
            <p class="release-info">Rilis: ${data.release_info}</p>
            ${navHtml}
            <div class="watch-container">
                <div class="video-player" id="video-player-container">
                    ${data.streaming_servers && data.streaming_servers.length > 0
                        ? createVideoPlayer(data.streaming_servers[0]?.streaming_url)
                        : "<p>Link streaming tidak tersedia untuk episode ini.</p>"
                    }
                </div>
                ${data.streaming_servers && data.streaming_servers.length > 0
                    ? `<h2 class="section-title">Pilih Server</h2>
                       <div class="server-selection">
                           ${data.streaming_servers.map((server) => `<button class="btn server-btn" data-url="${server.streaming_url}">${server.server_name}</button>`).join("")}
                       </div>`
                    : ""
                }
                <div class="download-links">
                    <h2 class="section-title">Link Download</h2>
                    ${Object.entries(data.download_links)
                      .map(
                        ([format, resolutions]) => `
                        <div class="format-group">
                            <h3>${format}</h3>
                            <div class="resolution-group">
                            ${Object.entries(resolutions)
                              .map(
                                ([res, links]) => `
                                <strong>${res}:</strong>
                                ${links.map((link) => `<a href="${link.url}" class="btn" target="_blank">${link.provider}</a>`).join("")}
                            `,
                              )
                              .join("<br>")}
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
            ${animeInfoHtml}
            ${otherEpisodesHtml}
        `;
  };

  const renderListPage = async (type, page) => {
    const data = await fetchData(`/api/${type}?page=${page}`);
    if (!data) return;
    const linkType = "detail";
    appContainer.innerHTML = `
            <h2 class="section-title">${type === "anime-terbaru" ? "Anime Terbaru" : "Daftar Movie"} - Halaman ${page}</h2>
            <div class="grid-container">${renderGrid(data, linkType)}</div>
            <div class="pagination">
                <button class="btn prev-btn" data-type="${type}" ${page === 1 ? "disabled" : ""}>&laquo; Previous</button>
                <span class="page-info" style="margin: 0 1rem;">Halaman ${page}</span>
                <button class="btn next-btn" data-type="${type}">Next &raquo;</button>
            </div>
        `;
  };

  const renderSchedulePage = async () => {
    console.log("Entering renderSchedulePage...");
    if (!scheduleData) {
      console.log("Fetching schedule data...");
      scheduleData = await fetchData("/api/jadwal-rilis");
      console.log("Schedule data fetched:", scheduleData);
    }
    if (!scheduleData) {
        console.log("No schedule data available. Returning.");
        return;
    }
    const days = Object.keys(scheduleData);
    if (days.length === 0) {
        appContainer.innerHTML = `<p>Tidak ada jadwal rilis ditemukan.</p>`;
        console.log("No days found in schedule data.");
        return;
    }
    console.log("Rendering schedule for day:", days[0], scheduleData[days[0]]);
    appContainer.innerHTML = `
            <h2 class="section-title">Jadwal Rilis Anime</h2>
            <div class="schedule-tabs" style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.5rem;">
                ${days.map((day, index) => `<button class="btn tab-btn ${index === 0 ? "active" : ""}" data-day="${day}">${day}</button>`).join("")}
            </div>
            <div id="schedule-content" class="grid-container">
                ${renderGrid(scheduleData[days[0]], "anime")}
            </div>
        `;
  };

  // --- ROUTER & EVENT LISTENERS ---
  const router = async () => {
    const hash = window.location.hash || "#home";
    if (swiperInstance && hash !== "#home") {
      swiperInstance.destroy(true, true);
      swiperInstance = null;
    }

    const [path, param] = hash.substring(1).split("/");
    setActiveLink(path || "home");

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
  };

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
    if (target.matches(".server-btn")) {
      const playerContainer = document.getElementById("video-player-container");
      if (playerContainer)
        playerContainer.innerHTML = createVideoPlayer(target.dataset.url);
    }
    if (target.matches(".tab-btn")) {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      target.classList.add("active");
      const day = target.dataset.day;
      const content = document.getElementById("schedule-content");
      if (content && scheduleData)
        content.innerHTML = renderGrid(scheduleData[day], "anime");
    }
  });

  window.addEventListener("hashchange", router);
  router(); // Initial load
});
