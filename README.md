# Elpriset.se

Visar aktuella elpriser i Sverige per timme och elområde (SE1–SE4), hämtat direkt från [elprisetjustnu.se](https://www.elprisetjustnu.se).

## Funktioner

- Spotpris i öre/kWh för aktuell timme
- Prisgraf och timvis översikt för idag och imorgon
- Kostnadskalkylator för vanliga hushållsapparater
- Stöd för alla fyra svenska elområden

## Kom igång

```bash
npm install
npm run dev
```

## Bygga för produktion

```bash
npm run build
```

## Tech

- React + Vite
- Chart.js via react-chartjs-2
- Data från [elprisetjustnu.se API](https://www.elprisetjustnu.se/elpris-api)

---

Byggt av [Produktionen AB](https://produktionen.se)
