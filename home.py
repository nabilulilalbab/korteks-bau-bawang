import requests
from bs4 import BeautifulSoup
import json
import time

def scrape_homepage_from_url(url):
    """
    Mengambil semua informasi penting dari halaman utama Samehadaku,
    termasuk Top 10, Anime Terbaru, dan Project Movie.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    }
    
    print(f"⚙️  Mengambil data dari: {url}")

    try:
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "lxml")

        homepage_data = {}

        # --- 1. Mengambil "Top 10 Minggu Ini" ---
        top_10_list = []
        top_10_container = soup.select_one(".topten-animesu ul")
        if top_10_container:
            for item in top_10_container.select("li"):
                link_tag = item.find("a", class_="series")
                if not link_tag:
                    continue
                
                title = link_tag.select_one(".judul").text.strip()
                rank_tag = link_tag.select_one(".is-topten > b:last-child")
                rank = rank_tag.text.strip() if rank_tag else "N/A"
                score_tag = link_tag.select_one(".rating")
                score = score_tag.text.strip() if score_tag else "N/A"
                cover_url = link_tag.find("img")['src'] if link_tag.find("img") else "N/A"
                anime_url = link_tag['href']
                
                top_10_list.append({
                    "rank": int(rank) if rank.isdigit() else rank,
                    "title": title,
                    "score": score,
                    "anime_url": anime_url,
                    "cover_url": cover_url
                })
        homepage_data['top_10_minggu_ini'] = sorted(top_10_list, key=lambda x: x['rank'] if isinstance(x['rank'], int) else float('inf'))


        # --- 2. Mengambil "Anime Terbaru" ---
        latest_episodes = []
        latest_container = soup.select_one(".post-show ul")
        if latest_container:
            for item in latest_container.select("li"):
                title_tag = item.select_one("h2.entry-title a")
                episode_tag = item.select_one(".dtla span author")
                release_tag = item.select("span")[-1]
                
                latest_episodes.append({
                    "title": title_tag.text.strip() if title_tag else "N/A",
                    "episode": episode_tag.text.strip() if episode_tag else "N/A",
                    "release_time": release_tag.text.replace("Released on:", "").strip(),
                    "url": title_tag['href'] if title_tag else "N/A",
                    "cover_url": item.find("img")['src'] if item.find("img") else "N/A"
                })
        homepage_data['anime_terbaru'] = latest_episodes

        # --- 3. Mengambil "Project Movie" dari Sidebar ---
        movie_projects = []
        movie_container = soup.select_one("#sidebar .widgetseries")
        if movie_container:
            for item in movie_container.select("li"):
                title_tag = item.select_one(".lftinfo h2 a")
                genre_tags = item.select(".lftinfo span a")
                release_tag = item.select(".lftinfo span")[-1]

                movie_projects.append({
                    "title": title_tag.text.strip() if title_tag else "N/A",
                    "url": title_tag['href'] if title_tag else "N/A",
                    "release_date": release_tag.text.strip() if release_tag else "N/A",
                    "genres": [genre.text.strip() for genre in genre_tags],
                    "cover_url": item.find("img")['src'] if item.find("img") else "N/A"
                })
        homepage_data['project_movie'] = movie_projects
        
        return homepage_data

    except Exception as e:
        print(f"❌ Terjadi error: {e}")
        return None

# --- CONTOH PENGGUNAAN ---
if __name__ == "__main__":
    target_url = "https://samehadaku.now/"
    start_time = time.time()
    scraped_data = scrape_homepage_from_url(target_url)
    end_time = time.time()

    if scraped_data:
        print("\n✅ Data halaman utama berhasil di-scrape secara lengkap!")
        print(json.dumps(scraped_data, indent=4, ensure_ascii=False))
        print(f"\n🚀 Selesai dalam {end_time - start_time:.2f} detik")
