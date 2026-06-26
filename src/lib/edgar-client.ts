import type { Filing } from "@/types";

const SUBMISSIONS = "https://data.sec.gov/submissions";

export async function getFilingsByCIK(cik: string): Promise<Filing[]> {
  const paddedCIK = cik.padStart(10, "0");
  const res = await fetch(`${SUBMISSIONS}/CIK${paddedCIK}.json`, {
    headers: { "User-Agent": "deeter-intelligence dsvxmedia@gmail.com" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`EDGAR error ${res.status}`);
  const data = await res.json();

  const recent = data.filings?.recent;
  if (!recent) return [];

  const filings: Filing[] = [];
  const forms = recent.form ?? [];
  const dates = recent.filedAt ?? recent.filingDate ?? [];
  const accessions = recent.accessionNumber ?? [];
  const descriptions = recent.primaryDocument ?? [];

  const targetForms = new Set(["10-K", "10-Q", "8-K"]);

  for (let i = 0; i < forms.length && filings.length < 10; i++) {
    if (!targetForms.has(forms[i])) continue;
    const accNo = accessions[i]?.replace(/-/g, "") ?? "";
    filings.push({
      accessionNo: accessions[i] ?? "",
      filedAt: dates[i] ?? "",
      form: forms[i],
      description: descriptions[i] ?? "",
      linkToHtmlAnnouncement: accNo
        ? `https://www.sec.gov/Archives/edgar/data/${cik}/${accNo}/${descriptions[i]}`
        : undefined,
    });
  }

  return filings;
}

export async function getFilingsByTicker(ticker: string): Promise<Filing[]> {
  const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers: { "User-Agent": "deeter-intelligence dsvxmedia@gmail.com" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error("EDGAR search failed");
  const data = await res.json();

  const entry = Object.values(data as Record<string, { cik_str: number; ticker: string; title: string }>)
    .find((e) => e.ticker === ticker.toUpperCase());

  if (!entry) throw new Error(`No CIK found for ${ticker}`);

  return getFilingsByCIK(String(entry.cik_str));
}
