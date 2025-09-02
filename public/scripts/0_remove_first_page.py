import os
from PyPDF2 import PdfReader, PdfWriter

def remove_first_page_from_pdfs_in_current_folder():
    for filename in os.listdir('.'):
        if filename.lower().endswith('.pdf') and os.path.isfile(filename):
            try:
                reader = PdfReader(filename)
                writer = PdfWriter()
                # Skip the first page
                for page in reader.pages[1:]:
                    writer.add_page(page)
                # Overwrite the original file
                with open(filename, 'wb') as f_out:
                    writer.write(f_out)
                print(f"Processed: {filename}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")

remove_first_page_from_pdfs_in_current_folder()
