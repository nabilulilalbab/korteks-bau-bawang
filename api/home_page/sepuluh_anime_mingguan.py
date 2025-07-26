import requests
from bs4 import BeautifulSoup

def scrape_top_10_anime():
    url = "https://samehadaku.now/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, "lxml")

    top_anime_list = []

    top10_block = soup.select_one(".topten-animesu")
    if top10_block:
        for li in top10_block.select("li"):
            title = li.select_one(".judul")
            rating = li.select_one(".rating")
            link = li.select_one("a.series")
            img = li.select_one("img")

            anime_data = {
                "judul": title.text.strip() if title else "-",
                "rating": rating.text.strip() if rating else "-",
                "url": link['href'] if link else "-",
                "cover": img['src'] if img and img.has_attr("src") else "-"
            }

            top_anime_list.append(anime_data)

    return top_anime_list