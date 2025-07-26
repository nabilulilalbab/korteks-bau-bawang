import requests
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

def fetch_schedule_for_day(session, day):
    """
    Mengambil dan memproses jadwal rilis untuk satu hari spesifik.
    """
    api_url = f"https://samehadaku.now/wp-json/custom/v1/all-schedule?perpage=100&day={day}"
    try:
        res = session.get(api_url)
        res.raise_for_status()
        
        daily_schedule_raw = res.json()
        
        cleaned_schedule = [
            {
                "title": item.get("title", "N/A"),
                "url": item.get("url", "N/A"),
                "cover_url": item.get("featured_img_src", "N/A"),
                "type": item.get("east_type", "N/A"),
                "score": item.get("east_score", "N/A"),
                "genres": item.get("genre", "N/A"),
                "release_time": item.get("east_time", "N/A")
            }
            for item in daily_schedule_raw
        ]
        print(f"  -> Jadwal untuk hari {day.capitalize()} selesai diproses.")
        return day, cleaned_schedule
    except requests.exceptions.RequestException as e:
        print(f"❌ Gagal mengambil jadwal untuk hari {day}: {e}")
        return day, []

def scrape_all_schedules_fast():
    """
    Mengambil jadwal rilis anime untuk semua hari secara bersamaan (concurrent).
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    }
    session = requests.Session()
    session.headers.update(headers)

    days_of_week = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    full_schedule = {}

    print("⚙️  Memulai pengambilan jadwal rilis untuk semua hari secara paralel...")

    with ThreadPoolExecutor(max_workers=7) as executor:
        # Menjadwalkan semua tugas untuk dieksekusi
        future_to_day = {executor.submit(fetch_schedule_for_day, session, day): day for day in days_of_week}
        
        # Mengumpulkan hasil saat tugas selesai
        for future in as_completed(future_to_day):
            day, schedule_data = future.result()
            full_schedule[day.capitalize()] = schedule_data

    # Mengurutkan hasil akhir sesuai urutan hari
    sorted_schedule = {day.capitalize(): full_schedule[day.capitalize()] for day in days_of_week}
    return sorted_schedule

# --- CONTOH PENGGUNAAN ---
if __name__ == "__main__":
    start_time = time.time()
    jadwal_lengkap = scrape_all_schedules_fast()
    end_time = time.time()

    if jadwal_lengkap:
        print("\n✅ Jadwal rilis lengkap berhasil di-scrape!")
        print(json.dumps(jadwal_lengkap, indent=4, ensure_ascii=False))
        print(f"\n🚀 Selesai dalam {end_time - start_time:.2f} detik")
