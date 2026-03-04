from pypdf import PdfReader, PdfWriter
import os

for filename in os.listdir("."):
    if filename.lower().endswith(".pdf"):
        reader = PdfReader(filename)

        # Skip PDFs with only one page
        if len(reader.pages) <= 1:
            print(f"Skipping {filename} (only one page)")
            continue

        writer = PdfWriter()

        # Add all pages except the first
        for page in reader.pages[1:]:
            writer.add_page(page)

        output_name = f"no_first_page_{filename}"
        with open(output_name, "wb") as f:
            writer.write(f)

        print(f"Processed: {filename} → {output_name}")
