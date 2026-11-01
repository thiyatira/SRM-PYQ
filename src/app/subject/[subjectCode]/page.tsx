import Page from "../../page";
import { buildCatalogue } from "@/lib/pyq/data";
import { scanPaperFiles } from "@/lib/pyq/catalogue.server";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return buildCatalogue(scanPaperFiles()).allSubjects.map((s) => ({ subjectCode: s.code }));
}

export default Page;
