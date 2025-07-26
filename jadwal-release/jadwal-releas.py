import requests
import json
import time

def scrape_all_schedules():
    """
    Fungsi untuk mengambil jadwal rilis anime untuk semua hari dalam seminggu
    langsung dari API Samehadaku.
    """
    # URL endpoint API untuk jadwal rilis
    api_url_template = "https://samehadaku.now/wp-json/custom/v1/all-schedule?perpage=100&day={day}"
    
    # Header untuk request
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    }

    # Daftar hari dalam format yang diterima oleh API
    days_of_week = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    
    # Dictionary untuk menampung semua jadwal
    full_schedule = {}

    print("⚙️  Memulai pengambilan jadwal rilis untuk semua hari...")

    try:
        # Loop untuk setiap hari
        for day in days_of_week:
            # Membuat URL API untuk hari yang spesifik
            target_url = api_url_template.format(day=day)
            
            print(f"  -> Mengambil jadwal untuk hari: {day.capitalize()}")
            
            # Melakukan request ke API
            res = requests.get(target_url, headers=headers)
            res.raise_for_status()
            
            # Mengambil data JSON dari response
            daily_schedule_raw = res.json()
            
            # Membersihkan dan memformat data
            cleaned_schedule = []
            for item in daily_schedule_raw:
                cleaned_schedule.append({
                    "title": item.get("title", "N/A"),
                    "url": item.get("url", "N/A"),
                    "cover_url": item.get("featured_img_src", "N/A"),
                    "type": item.get("east_type", "N/A"),
                    "score": item.get("east_score", "N/A"),
                    "genres": item.get("genre", "N/A"),
                    "release_time": item.get("east_time", "N/A")
                })

            # Menambahkan jadwal harian ke dictionary utama
            full_schedule[day.capitalize()] = cleaned_schedule
            
            # Memberi jeda singkat agar tidak membebani server
            time.sleep(0.01)

        return full_schedule

    except requests.exceptions.RequestException as e:
        print(f"❌ Gagal melakukan request: {e}")
        return None
    except Exception as e:
        print(f"❌ Terjadi error saat parsing: {e}")
        return None

# --- CONTOH PENGGUNAAN ---
if __name__ == "__main__":
    jadwal_lengkap = scrape_all_schedules()

    if jadwal_lengkap:
        print("\n✅ Jadwal rilis lengkap berhasil di-scrape!")
        # Mencetak hasil dalam format JSON yang rapi
        print(json.dumps(jadwal_lengkap, indent=4, ensure_ascii=False))
