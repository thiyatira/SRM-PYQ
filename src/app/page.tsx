import Home from "@/components/Home";
import { CatalogueProvider } from "@/lib/pyq/CatalogueContext";
import { scanPaperFiles } from "@/lib/pyq/catalogue.server";

// Rendered once at build time: the paper list is read from public/data/ then.
export const dynamic = "force-static";

export default function Page() {
  return (
    <CatalogueProvider files={scanPaperFiles()}>
      <Home />
    </CatalogueProvider>
  );
}
