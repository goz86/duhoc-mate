import os
from pypdf import PdfReader

pdf_dir = r"C:\Users\junwi\Downloads\ĐỀ ĐỌC TOPIK II THEO DẠNG-20260528T064124Z-3-001\ĐỀ ĐỌC TOPIK II THEO DẠNG"
pdf_files = [f for f in os.listdir(pdf_dir) if f.startswith("13. ")]
pdf_path = os.path.join(pdf_dir, pdf_files[0])

reader = PdfReader(pdf_path)
print("Total pages:", len(reader.pages))

# Print text of page 7 (index 6)
page = reader.pages[6]
text = page.extract_text()
print("--- Text of Page 7 ---")
print(repr(text))
print("--- Length:", len(text))
