import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import fitz  # PyMuPDF

# Create output directory
output_dir = Path("first_page_images")
output_dir.mkdir(exist_ok=True)

# Get all PDF files in current directory
pdf_files = [f for f in os.listdir('.') if f.lower().endswith('.pdf') and os.path.isfile(f)]

for pdf_file in pdf_files:
    try:
        # Open PDF and render first page as image using PyMuPDF
        doc = fitz.open(pdf_file)
        if doc.page_count < 1:
            print(f"No pages found in {pdf_file}")
            continue
        page = doc.load_page(0)  # 0 is the first page (0-based index)
        # Render at 2x resolution for better quality
        zoom = 2
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        # Prepare to draw text
        # Try to use a truetype font, fallback to default if not available
        try:
            font = ImageFont.truetype("arial.ttf", size=int(img.height * 0.04))
        except:
            font = ImageFont.load_default()

        # Text to embed (filename)
        text = pdf_file
        # Calculate text size and position using font.getbbox or font.getsize
        try:
            # Pillow >= 8.0.0
            bbox = font.getbbox(text)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        except AttributeError:
            # Older Pillow
            text_width, text_height = font.getsize(text)
        x = (img.width - text_width) // 2
        y = (img.height - text_height) // 2

        # Draw a semi-transparent rectangle behind text for readability
        rect_margin = 20
        rect_x0 = x - rect_margin
        rect_y0 = y - rect_margin
        rect_x1 = x + text_width + rect_margin
        rect_y1 = y + text_height + rect_margin
        overlay = Image.new('RGBA', img.size, (255,255,255,0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.rectangle([rect_x0, rect_y0, rect_x1, rect_y1], fill=(0,0,0,128))
        img = img.convert('RGBA')
        img = Image.alpha_composite(img, overlay)

        # Draw the text (white)
        draw = ImageDraw.Draw(img)
        draw.text((x, y), text, font=font, fill=(255,255,255,255))

        # Save image to output directory
        out_path = output_dir / (Path(pdf_file).stem + "_firstpage.png")
        img.convert('RGB').save(out_path)
        print(f"Saved: {out_path}")
    except Exception as e:
        print(f"Error processing {pdf_file}: {e}")
