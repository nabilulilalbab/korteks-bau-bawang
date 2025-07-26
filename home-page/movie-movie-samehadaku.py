import requests
from bs4 import BeautifulSoup

url = "https://samehadaku.now/"
headers = {
    "User-Agent": "Mozilla/5.0"
}

res = requests.get(url, headers=headers)
soup = BeautifulSoup(res.text, "lxml")

# Temukan div.widgets yang punya h3 "Project Movie Samehadaku"
project_section = None
for section in soup.select("div.widgets"):
    h3 = section.find("h3")
    if h3 and "Project Movie Samehadaku" in h3.text:
        project_section = section
        break

# Ambil movie list hanya dari section ini
project_movies = []
if project_section:
    movie_list = project_section.select("div.widgetseries ul > li")
    
    for li in movie_list:
        # Judul dan URL
        title_el = li.select_one("h2 > a.series")
        title = title_el.text.strip() if title_el else "-"
        url_movie = title_el["href"] if title_el and title_el.has_attr("href") else "-"

        # Cover
        cover_el = li.select_one("img")
        cover = cover_el["src"] if cover_el and cover_el.has_attr("src") else "-"

        # Genre
        genres_span = li.find("span")
        genres = []
        if genres_span:
            genres = [a.text.strip() for a in genres_span.find_all("a")]

        # Tanggal rilis (span terakhir)
        tanggal_span = li.find_all("span")[-1]
        tanggal = tanggal_span.text.strip() if tanggal_span else "-"

        project_movies.append({
            "judul": title,
            "url": url_movie,
            "cover": cover,
            "genres": genres,
            "tanggal": tanggal
        })

# Cetak hasil
if project_movies:
    for i, movie in enumerate(project_movies, 1):
        print(f"{i}. {movie['judul']} ({movie['tanggal']})")
        print(f"   URL   : {movie['url']}")
        print(f"   Cover : {movie['cover']}")
        print(f"   Genre : {', '.join(movie['genres']) if movie['genres'] else '-'}\n")
else:
    print("❌ Gagal menemukan section Project Movie Samehadaku.")

