import Page from "../../page";
import { buildCatalogue } from "@/lib/pyq/data";
import { scanPaperFiles } from "@/lib/pyq/catalogue.server";

// Same page as "/", prerendered for every semester so it needs no server-side file access.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return buildCatalogue(scanPaperFiles()).semesters.map((s) => ({ semId: String(s.id) }));
}

export default Page;
