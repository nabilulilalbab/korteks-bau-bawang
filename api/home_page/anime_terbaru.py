import requests
from bs4 import BeautifulSoup

def scrape_anime_terbaru():
    url = "https://samehadaku.now/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, "lxml")

    anime_terbaru_list = []

    items = soup.select(".post-show ul li")

    for li in items:
        title_el = li.select_one("h2.entry-title a")
        episode_el = li.select_one("span:contains('Episode')")
        posted_by_el = li.select_one(".author author")
        posted_by_fallback = li.select_one(".author vcard author")
        posted_by = posted_by_el.text.strip() if posted_by_el else (posted_by_fallback.text.strip() if posted_by_fallback else "-")
        released_on = li.select_one("span:contains('Released on')")

        anime = {
            "judul": title_el.text.strip() if title_el else "-",
            "url": title_el["href"] if title_el else "-",
            "cover": li.select_one("img")["src"] if li.select_one("img") else "-",
            "episode": episode_el.text.strip() if episode_el else "-",
            "posted_by": posted_by,
            "rilis": released_on.text.strip().replace("Released on", "").strip() if released_on else "-"
        }

        anime_terbaru_list.append(anime)

    return anime_terbaru_list