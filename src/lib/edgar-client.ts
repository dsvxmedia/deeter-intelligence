import type { Filing } from "@/types";

const EDGAR = "https://efts.sec.gov";
const SUBMISSIONS = "https://data.sec.gov/submissions";

export async function searchCIK(ticker: string): Promise<string | null> {
  const res = await fetch(
    `${EDGAR}/LATEST/search-index?q=%22${ticker}%22&dateRange=custom&startdt=2020-01-01&forms=10-K,10-Q,8-K&hits.hits._source=period_of_report,display_names,file_date,period_of_report`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const hit = data.hits?.hits?.[0]?._source;
  return hit?.entity_id ?? null;
}

export async function getFilingsByCIK(cik: string): Promise<Filing[]> {
  const paddedCIK = cik.padStart(10, "0");
  const res = await fetch(`${SUBMISSIONS}/CIK${paddedCIK}.json`, {
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
  const cikRes = await fetch(
    `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&forms=10-K,10-Q,8-K&hits.hits.total=1`,
    { next: { revalidate: 3600 } }
  );
  if (!cikRes.ok) throw new Error("EDGAR search failed");
  const cikData = await cikRes.json();

  const entityId = cikData?.hits?.hits?.[0]?._source?.entity_id;
  if (!entityId) throw new Error(`No CIK found for ${ticker}`);

  return getFilingsByCIK(entityId);
}
