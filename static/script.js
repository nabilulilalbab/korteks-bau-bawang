
document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    const loader = document.getElementById('loader');
    const navLinks = document.querySelectorAll('.nav-link');

    let currentPage = { anime: 1, movie: 1 };
    let scheduleData = null; // Cache untuk data jadwal

    // --- UTILITIES ---
    const showLoader = () => loader.style.display = 'flex';
    const hideLoader = () => loader.style.display = 'none';

    const setActiveLink = (hash) => {
        navLinks.forEach(link => {
            const linkHash = link.getAttribute('href').split('/')[0];
            if (linkHash === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };

    const fetchData = async (url) => {
        showLoader();
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Fetch Error:', error);
            appContainer.innerHTML = `<p class="error">Gagal memuat data. Server mungkin sibuk atau link tidak valid. Coba lagi nanti.</p>`;
            return null;
        } finally {
            hideLoader();
        }
    };

    // --- RENDER FUNCTIONS ---
    const renderGrid = (items, type) => {
        if (!items || items.length === 0) return '<p>Tidak ada data ditemukan.</p>';
        const linkType = type === 'episode' ? 'watch' : 'detail';
        return items.map(item => `
            <a href="#${linkType}/${btoa(item.url)}" class="anime-card">
                <img src="${item.cover || item.url_cover || item.cover_url}" alt="${item.judul || item.title}" loading="lazy">
                <div class="card-title">${item.judul || item.title}</div>
                ${item.episode ? `<div class="card-info">${item.episode}</div>` : ''}
                ${item.rating || item.skor ? `<div class="card-info" style="left: auto; right: 8px;"><i class="fa-solid fa-star"></i> ${item.rating?.score || item.skor}</div>` : ''}
            </a>
        `).join('');
    };

    const renderHomePage = async () => {
        const data = await fetchData('/api/home');
        if (!data) return;

        appContainer.innerHTML = `
            <section>
                <h2 class="section-title">Top 10 Mingguan</h2>
                <div class="grid-container">${renderGrid(data.top10, 'anime')}</div>
            </section>
            <section style="margin-top: 2rem;">
                <h2 class="section-title">Episode Terbaru</h2>
                <div class="grid-container">${renderGrid(data.new_eps, 'episode')}</div>
            </section>
            <section style="margin-top: 2rem;">
                <h2 class="section-title">Project Movie</h2>
                <div class="grid-container">${renderGrid(data.movies, 'anime')}</div>
            </section>
        `;
    };

    const renderAnimeDetailPage = async (url) => {
        const data = await fetchData(`/api/anime-detail?url=${url}`);
        if (!data) return;

        appContainer.innerHTML = `
            <div class="detail-container">
                <div class="detail-thumbnail">
                    <img src="${data.thumbnail_url}" alt="${data.title}">
                </div>
                <div class="detail-info">
                    <h1>${data.title}</h1>
                    <div class="genres">
                        ${data.genres.map(g => `<span class="genre-badge">${g}</span>`).join('')}
                    </div>
                    <p class="synopsis">${data.synopsis}</p>
                    <div class="rating"><i class="fa-solid fa-star"></i> ${data.rating.score} (${data.rating.users})</div>
                </div>
            </div>
            <div class="episode-list">
                <h2 class="section-title">Daftar Episode</h2>
                <ul>
                    ${data.episode_list.map(ep => `
                        <li><a href="#watch/${btoa(ep.url)}">${ep.title} - ${ep.release_date}</a></li>
                    `).join('')}
                </ul>
            </div>
        `;
    };

    // --- Smart Video Player Logic ---
    const createVideoPlayer = (url) => {
        if (!url) return '<p>Link streaming tidak tersedia.</p>';
        
        if (url.endsWith('.mp4')) {
            return `<video controls autoplay src="${url}" style="width: 100%; height: 100%;"></video>`;
        }
        
        if (url.includes('pixeldrain.com/u/')) {
            url = url.replace('pixeldrain.com/u/', 'pixeldrain.com/e/');
        }

        return `<iframe src="${url}" allowfullscreen></iframe>`;
    };

    const renderWatchPage = async (url) => {
        const data = await fetchData(`/api/episode-detail?url=${url}`);
        if (!data) return;

        appContainer.innerHTML = `
            <h1 style="margin-bottom: 1rem;">${data.title}</h1>
            <div class="watch-container">
                <div class="video-player" id="video-player-container">
                    ${createVideoPlayer(data.streaming_servers[0]?.streaming_url)}
                </div>
                <div class="server-selection">
                    <h2 class="section-title">Pilih Server</h2>
                    ${data.streaming_servers.map(server => `
                        <button class="btn server-btn" data-url="${server.streaming_url}">${server.server_name}</button>
                    `).join('')}
                </div>
                 <div class="download-links">
                    <h2 class="section-title">Link Download</h2>
                    ${Object.entries(data.download_links).map(([format, resolutions]) => `
                        <div class="format-group">
                            <h3>${format}</h3>
                            <div class="resolution-group">
                            ${Object.entries(resolutions).map(([res, links]) => `
                                <strong>${res}:</strong>
                                ${links.map(link => `<a href="${link.url}" class="btn" target="_blank">${link.provider}</a>`).join('')}
                            `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };
    
    const renderListPage = async (type, page) => {
        const data = await fetchData(`/api/${type}?page=${page}`);
        if(!data) return;

        const linkType = type === 'anime-terbaru' ? 'episode' : 'anime';
        appContainer.innerHTML = `
            <h2 class="section-title">${type === 'anime-terbaru' ? 'Anime Terbaru' : 'Daftar Movie'} - Halaman ${page}</h2>
            <div class="grid-container">${renderGrid(data, linkType)}</div>
            <div class="pagination">
                <button class="btn prev-btn" data-type="${type}" ${page === 1 ? 'disabled' : ''}>&laquo; Previous</button>
                <span class="page-info">Halaman ${page}</span>
                <button class="btn next-btn" data-type="${type}">Next &raquo;</button>
            </div>
        `;
    };

    const renderSchedulePage = async () => {
        if (!scheduleData) {
            scheduleData = await fetchData('/api/jadwal-rilis');
        }
        if(!scheduleData) return;

        const days = Object.keys(scheduleData);
        appContainer.innerHTML = `
            <h2 class="section-title">Jadwal Rilis Anime</h2>
            <div class="schedule-tabs">
                ${days.map((day, index) => `<button class="btn tab-btn ${index === 0 ? 'active' : ''}" data-day="${day}">${day}</button>`).join('')}
            </div>
            <div id="schedule-content" class="grid-container">
                ${renderGrid(scheduleData[days[0]], 'anime')}
            </div>
        `;
    };

    // --- ROUTER & EVENT LISTENERS ---
    const router = async () => {
        const hash = window.location.hash || '#home';
        const [path, param] = hash.substring(1).split('/');
        
        setActiveLink(hash.startsWith('#/watch') ? '#/watch' : hash.split('/')[0]);

        switch (path) {
            case 'home': await renderHomePage(); break;
            case 'detail': await renderAnimeDetailPage(atob(param)); break;
            case 'watch': await renderWatchPage(atob(param)); break;
            case 'anime-terbaru': await renderListPage('anime-terbaru', currentPage.anime); break;
            case 'movie': await renderListPage('movie', currentPage.movie); break;
            case 'jadwal': await renderSchedulePage(); break;
            default: appContainer.innerHTML = '<h2>Halaman tidak ditemukan</h2>';
        }
    };

    appContainer.addEventListener('click', e => {
        const target = e.target;
        if (target.classList.contains('next-btn') || target.classList.contains('prev-btn')) {
            const type = target.dataset.type;
            if (target.classList.contains('next-btn')) currentPage[type]++;
            if (target.classList.contains('prev-btn') && currentPage[type] > 1) currentPage[type]--;
            router();
        }
        if (target.classList.contains('server-btn')) {
            const playerContainer = document.getElementById('video-player-container');
            if(playerContainer) playerContainer.innerHTML = createVideoPlayer(target.dataset.url);
        }
        if (target.classList.contains('tab-btn')) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            target.classList.add('active');
            const day = target.dataset.day;
            const content = document.getElementById('schedule-content');
            if(content && scheduleData) content.innerHTML = renderGrid(scheduleData[day], 'anime');
        }
    });

    window.addEventListener('hashchange', router);
    router(); // Initial load
});
