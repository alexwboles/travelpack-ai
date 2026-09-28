# 🧳 TravelPack AI

Smart packing list generator. Answer three questions — trip type, days, weather — and get a complete, categorized packing list with a "don't forget" essentials strip.

**100% local.** No account, no API keys, no network calls. Your trips never leave the browser (saved in localStorage).

## Features

- 6 trip types (beach, city, hiking, business, cruise, road trip) × 5 weather profiles
- 60+ item bank across documents, clothes, toiletries, tech, and extras
- Per-day quantities (underwear, socks, t-shirts scale with trip length)
- "Don't forget" strip highlighting unpacked essentials
- Check-off with live progress bar
- Named saved trips (persisted in localStorage)
- Printable packing list
- Packing tips tailored to trip type and weather

## Run it

Just open `index.html` in a browser — no build step. Or serve locally:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Tests

```bash
bash test/smoke.sh   # 12 checks
bash test/e2e.sh     # 6 flows
```

## How it works

`js/packbank.js` holds the item bank (each item tagged by trip type and weather).
`js/logic.js` filters the bank into categorized groups — pure functions, fully unit-tested in Node.
`js/app.js` wires the UI. An `OPENAI_API_KEY` is never needed; smarter suggestions could optionally
call an LLM, but the local bank covers every case out of the box.

## License

MIT
