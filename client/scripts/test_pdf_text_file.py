import os
from pypdf import PdfReader

pdf_dir = r"C:\Users\junwi\Downloads\ĐỀ ĐỌC TOPIK II THEO DẠNG-20260528T064124Z-3-001\ĐỀ ĐỌC TOPIK II THEO DẠNG"
pdf_files = [f for f in os.listdir(pdf_dir) if f.startswith("13. ")]
pdf_path = os.path.join(pdf_dir, pdf_files[0])

reader = PdfReader(pdf_path)
page = reader.pages[6]
text = page.extract_text()

with open("client/scripts/extracted_text.txt", "w", encoding="utf-8") as f:
    f.write(text)

print("Saved text to client/scripts/extracted_text.txt, length:", len(text))
