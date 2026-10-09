#!/usr/bin/env python3
"""Shton filma të rinj (të verifikuar) në katalogun e Filma12HD.
Përdorimi: python3 add_movies.py new_movies.json
new_movies.json: [{title_al,title_orig,year,duration,studio,genres,quality,video_url,poster_url,desc}]
Vetëm filmat me video+poster të verifikuar shtohen. ID-të vazhdojnë m22, m23...
"""
import json, os, re, sys, urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data", "movies.json")
POSTERS = os.path.join(BASE, "img", "posters")

def check_url(url, want_image=False, timeout=25):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Range": "bytes=0-1023"},
                                     method="HEAD")
        with urllib.request.urlopen(req, timeout=timeout) as r:
            code = r.status
            ct = r.headers.get("Content-Type", "")
            if want_image and not ct.startswith("image/"):
                return False, f"content-type {ct}"
            return (200 <= code < 400), f"HTTP {code}"
    except Exception as e:
        # HEAD mund të refuzohet; provo GET të shkurtër
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Range": "bytes=0-4095"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                ct = r.headers.get("Content-Type", "")
                if want_image and not ct.startswith("image/"):
                    return False, f"content-type {ct}"
                return True, f"HTTP {r.status} (GET)"
        except Exception as e2:
            return False, str(e2)[:90]

def check_embed(url):
    """Për embed-e (vidmoly/abyssplayer): faqja duhet të ekzistojë dhe të përmbajë video."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=25) as r:
            html = r.read(60000).decode("utf-8", errors="replace").lower()
            if r.status >= 400:
                return False, f"HTTP {r.status}"
            markers = ["mp4", "m3u8", "<video", "source src", "player", "embed"]
            if any(m in html for m in markers):
                return True, f"HTTP {r.status} + video markers"
            return False, f"HTTP {r.status} pa video markers"
    except Exception as e:
        return False, str(e)[:90]

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "new_movies.json"
    cands = json.load(open(src, encoding="utf-8"))
    movies = json.load(open(DATA, encoding="utf-8"))
    have = {m["title_al"].lower() for m in movies}
    n = len(movies)
    added, skipped = [], []
    for c in cands:
        t = c["title_al"].strip()
        if t.lower() in have:
            skipped.append((t, "ekziston")); continue
        vurl = c["video_url"]
        is_file = bool(re.search(r"\.(mp4|mkv)(\?|#|$)", vurl, re.I))
        ok_v, why_v = check_url(vurl) if is_file else check_embed(vurl)
        if not ok_v:
            skipped.append((t, f"video: {why_v}")); continue
        ok_p, why_p = check_url(c["poster_url"], want_image=True)
        if not ok_p:
            skipped.append((t, f"poster: {why_p}")); continue
        # shkarko posterin
        n += 1
        mid = f"m{n:02d}"
        dest = os.path.join(POSTERS, f"{mid}.jpg")
        req = urllib.request.Request(c["poster_url"], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=40) as r, open(dest, "wb") as f:
            f.write(r.read())
        if os.path.getsize(dest) < 4000:
            os.remove(dest); n -= 1
            skipped.append((t, "poster shumë i vogël")); continue
        movies.append({
            "id": mid,
            "title_al": t,
            "title_orig": c.get("title_orig", ""),
            "year": c.get("year", ""),
            "duration": c.get("duration", ""),
            "studio": c.get("studio", ""),
            "genres": c.get("genres", ["Animuar"]),
            "type": "film",
            "quality": c.get("quality", "FULL HD"),
            "dub": "Dubluar në shqip",
            "poster": f"img/posters/{mid}.jpg",
            "videos": [vurl],
            "desc": c.get("desc", ""),
            "published": "2026-10-09",
            "source_url": "",
        })
        have.add(t.lower())
        added.append((mid, t, why_v))
        print(f"+ {mid} {t} | video: {why_v} | poster: {why_p}")
    json.dump(movies, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\nSHTUAR: {len(added)} | KAPËRCYER: {len(skipped)}")
    for t, why in skipped:
        print(f"- {t}: {why}")

if __name__ == "__main__":
    main()
