import requests
from bs4 import BeautifulSoup
import json
import re # Modul untuk regular expression, berguna untuk mencari angka

# Membuat Session object lebih efisien untuk beberapa request
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
})

def get_max_page(url="https://samehadaku.now/anime-terbaru/"):
    """
    Mengunjungi halaman pertama untuk mencari tahu jumlah total halaman.
    Mengembalikan integer jumlah halaman maksimal.
    """
    try:
        print("🔎 Mencari jumlah halaman maksimal...")
        res = session.get(url)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'lxml')
        
        # Mencari tag span yang berisi teks "Page x of y"
        pagination_text_tag = soup.select_one("div.pagination > span:first-child")
        
        if pagination_text_tag:
            # Contoh teks: "Page 1 of 649"
            text = pagination_text_tag.text
            # Mengambil angka terakhir dari teks menggunakan regex
            max_page = int(re.findall(r'\d+', text)[-1])
            print(f"✅ Halaman maksimal ditemukan: {max_page}")
            return max_page
        else:
            print("⚠️ Pagination tidak ditemukan, mengasumsikan hanya ada 1 halaman.")
            return 1
            
    except Exception as e:
        print(f"❌ Gagal mendapatkan halaman maksimal: {e}")
        return 1 # Mengembalikan 1 jika terjadi error

def scrape_anime_page(page_number=1):
    """
    Fungsi untuk men-scrape data anime dari satu halaman spesifik.
    Menerima input nomor halaman, mengembalikan list berisi data anime.
    """
    base_url = "https://samehadaku.now/anime-terbaru/"
    
    if page_number == 1:
        target_url = base_url
    else:
        target_url = f"{base_url}page/{page_number}/"
        
    print(f"⚙️  Sedang men-scrape halaman {page_number}: {target_url}")

    try:
        res = session.get(target_url)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "lxml")
        
        articles = soup.select("div.post-show li")
        page_data = []

        if not articles:
            print(f"⚠️  Tidak ada anime ditemukan di halaman {page_number}.")
            return []

        for article in articles:
            title_tag = article.select_one("h2.entry-title a")
            cover_tag = article.select_one("img.npws")
            spans = article.select("div.dtla > span")

            title = title_tag.text.strip() if title_tag else "N/A"
            anime_url = title_tag["href"] if title_tag else "N/A"
            cover_url = cover_tag["src"] if cover_tag and cover_tag.has_attr("src") else "N/A"
            
            episode_tag = spans[0].find("author") if len(spans) > 0 else None
            episode = episode_tag.text.strip() if episode_tag else "N/A"

            uploader_tag = spans[1].find("author") if len(spans) > 1 else None
            uploader = uploader_tag.text.strip() if uploader_tag else "N/A"

            release_tag = spans[2] if len(spans) > 2 else None
            release_time = release_tag.text.replace("Released on:", "").strip() if release_tag else "N/A"

            page_data.append({
                "judul": title,
                "episode": episode,
                "uploader": uploader,
                "waktu_rilis": release_time,
                "url_episode": anime_url,
                "url_cover": cover_url
            })
        
        return page_data

    except Exception as e:
        print(f"❌ Gagal men-scrape halaman {page_number}: {e}")
        return []

# --- CONTOH PENGGUNAAN ---
if __name__ == "__main__":
    
    # Contoh 1: Hanya ingin tahu ada berapa total halaman
    max_halaman = get_max_page()
    print(f"Total halaman yang tersedia adalah: {max_halaman}")
    
    print("\n" + "="*40 + "\n")

    # Contoh 2: User API meminta data dari halaman 5
    halaman_yang_diminta = 5
    data_halaman_5 = scrape_anime_page(halaman_yang_diminta)
    
    if data_halaman_5:
        print(f"✅ Berhasil mendapatkan {len(data_halaman_5)} data dari halaman {halaman_yang_diminta}")
        print(json.dumps(data_halaman_5, indent=4, ensure_ascii=False))
