"use client";

import React, { createContext, useContext, useMemo } from "react";
import { buildCatalogue, type Catalogue, type PaperFiles } from "./data";

const CatalogueContext = createContext<Catalogue | null>(null);

export function CatalogueProvider({ files, children }: { files: PaperFiles; children: React.ReactNode }) {
  const catalogue = useMemo(() => buildCatalogue(files), [files]);
  return <CatalogueContext.Provider value={catalogue}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue(): Catalogue {
  const catalogue = useContext(CatalogueContext);
  if (!catalogue) throw new Error("useCatalogue must be used inside <CatalogueProvider>");
  return catalogue;
}
