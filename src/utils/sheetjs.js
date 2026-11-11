// utils/sheetjs.js
// Lazy-loads SheetJS (xlsx) from the Cloudflare CDN at runtime — same pattern
// the app uses for Razorpay / Leaflet. Avoids adding a build-time dependency.
// Used by the Bus Routes bulk-import feature to parse .xlsx/.xls/.csv files and
// to generate the sample template + error report, entirely in the browser.

let loadingPromise = null;

export function loadSheetJS() {
  if (typeof window !== "undefined" && window.XLSX) return Promise.resolve(window.XLSX);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-sheetjs="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.XLSX));
      existing.addEventListener("error", () => reject(new Error("Failed to load spreadsheet library")));
      if (window.XLSX) resolve(window.XLSX);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.async = true;
    s.dataset.sheetjs = "1";
    s.onload = () => {
      if (window.XLSX) resolve(window.XLSX);
      else reject(new Error("Spreadsheet library did not initialise"));
    };
    s.onerror = () => { loadingPromise = null; reject(new Error("Failed to load spreadsheet library")); };
    document.head.appendChild(s);
  });
  return loadingPromise;
}
