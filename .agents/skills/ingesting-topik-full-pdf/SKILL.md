---
name: ingesting-topik-full-pdf
description: Use when importing a new official TOPIK II exam into CBT, fixing TOPIK crop images, missing black borders, wrong OCR option order, audio track mapping, or Supabase exam synchronization.
---

# Ingesting TOPIK II Full Exam (Reading & Listening)

## Overview
Quy trình chuẩn hóa toàn bộ để chuyển đổi một kỳ thi TOPIK II chính thức (gồm cả phần Đọc - Reading và Nghe - Listening) từ tài liệu PDF gốc và file âm thanh nguồn thành các câu hỏi tương tác hoàn chỉnh trên website CBT.

Quy trình này đảm bảo:
1. Cơ sở dữ liệu Supabase chứa đầy đủ và chính xác 50 câu hỏi Đọc và 50 câu hỏi Nghe.
2. Mọi câu hỏi đều có ảnh cắt được căn chỉnh đúng quy chuẩn hiển thị của CBT (Cắt rộng chứa đáp án cho câu ngắn, cắt sạch cho câu thông thường, cắt chỉ khung đen cho câu dài).
3. Audio phần nghe được liên kết chính xác cho từng câu hỏi và giới hạn số lần nghe theo cài đặt.
4. Thứ tự đáp án trắc nghiệm dưới web trùng khớp hoàn toàn với thứ tự hiển thị trên ảnh đề thi gốc bằng thuật toán sắp xếp dựa trên tọa độ OCR.

---

## Ingestion Step-by-Step Workflow

```mermaid
graph TD
    A[1. Render PDF to JPG & Normalize Audios] --> B[2. Run Import & AI Parsing DB]
    B --> C[3. Generate Grid Review Images]
    C --> D[4. Write & Execute Reading Crop Script]
    D --> E[5. Write & Execute Listening Crop Script]
    E --> F[6. Sync Clean Image Paths to DB]
    F --> G[7. Run Scrambled Options Repair Script]
    G --> H[8. Run Manual Patch for OCR Failures]
    H --> I[9. Verify CBT Web Interface]
```

### Bước 1: Khởi tạo dữ liệu nguồn & Chuẩn hóa Audio
1. Nếu người dùng đưa folder nguồn, kiểm tra trước bằng `Get-ChildItem -LiteralPath "<folder>" -Force` và xác nhận có:
   - 2 file PDF đề: `...듣기.pdf`, `...읽기.pdf`
   - 1 file PDF đáp án chính thức
   - 51 file `.mp3`
2. Đặt các file PDF đề thi Đọc và Nghe vào các thư mục tương ứng:
   - Đọc: `client/public/topik_exams/ky_XX/reading/`
   - Nghe: `client/public/topik_exams/ky_XX/listening/`
3. Sử dụng thư viện PyMuPDF (`fitz`) để render toàn bộ các trang PDF thành ảnh JPG chất lượng cao (thường ở DPI 220).
4. Đổi tên toàn bộ 51 file âm thanh nghe nguồn (gốc từ NIIED) thành định dạng chuẩn: `track_01.mp3` -> `track_51.mp3` và lưu tại `client/public/topik_exams/ky_XX/listening/`.
   *Chú ý: Track 1 thường là nhạc dạo, các track tiếp theo ứng với từng câu hỏi.*

### Bước 2: Import & Phân tích cấu trúc đề qua AI (Supabase DB)
Tạo script import (ví dụ `import_exam_XX.py`) thực hiện các nhiệm vụ:
1. Khởi tạo/Tìm bản ghi Exam trong bảng `topik_exams` cho Đọc và Nghe.
2. Duyệt qua từng trang ảnh JPG, chạy OCR Space API để lấy văn bản thô.
3. Gửi văn bản OCR qua DeepSeek API (`deepseek-chat`) kèm theo danh sách Đáp án Chính thức (Answer Key) của kỳ thi để cấu trúc hóa thành câu hỏi JSON.
4. Lưu hoặc Cập nhật (patch) câu hỏi vào bảng `topik_exam_questions` trong Supabase.
   - **Tập tin Audio:** Được gán tự động vào trường `passage` của câu hỏi nghe tương ứng (Q1-Q20: track_02 -> track_21; Q21-Q50: các câu hỏi cặp dùng chung track audio).

### Bước 3: Vẽ lưới tọa độ Grid Review
Chạy script vẽ các đường lưới ngang màu đỏ cách nhau 50px (kèm chữ số chỉ tọa độ Y) đè lên các ảnh trang đề thi gốc và lưu vào thư mục `client/scripts/crop_review/topikXX_reading_grid` và `topikXX_listening_grid`.
*Mục đích: Giúp dễ dàng tra cứu tọa độ Y chính xác của các câu hỏi hoặc hình vẽ đáp án.*

### Bước 4: Thực hiện Crop hình ảnh phần Đọc (Reading)
Tạo script `crop_topikXX_reading_clean.py` để thực hiện cắt ảnh Đọc theo 3 quy chuẩn:
1. **Cắt rộng chứa cả đáp án (Q1-Q8, Q25-Q27):** Vì các câu hỏi này rất ngắn, ta tăng giới hạn dưới `y2` để ảnh chứa toàn bộ đề bài + các phương án trắc nghiệm ① ② ③ ④ gốc.
2. **Cắt chỉ lấy khung viền đen (Q42-Q50):** Đây là các câu hỏi dựa trên một đoạn văn chung rất dài ở cuối đề. Ta chỉ crop duy nhất phần đoạn văn nằm bên trong khung viền đen (bỏ qua câu hỏi con và đáp án ở dưới) để UI CBT không bị quá dài và tránh trùng lặp.
3. **Cắt sạch thông thường (Q9-Q41, trừ Q25-Q27):** Loại bỏ hoàn toàn các lựa chọn ① ② ③ ④ để hiển thị chuyên nghiệp dưới dạng các nút bấm tương tác HTML. Cần giới hạn `y2` vừa khít dưới câu hỏi/hộp thoại để tránh dính một phần viền trên của đáp án ① ở mép dưới ảnh.

#### Quy tắc bắt buộc khi crop khung đen phần Đọc
Lỗi thường gặp nhất là ảnh bị mất thanh viền dưới/trên vì thuật toán `tighten_vertical()` co crop theo chữ đen, bỏ qua đường khung mảnh. Khi crop bất kỳ câu nào có khung đen:

1. **Dò đường viền thật bằng pixel trước khi chỉnh tay.** Tìm các dòng ngang có nhiều pixel tối trong vùng nội dung:
   ```python
   from PIL import Image
   import numpy as np

   img = Image.open("client/public/topik_exams/ky_XX/reading/page_YY.jpg").convert("L")
   arr = np.array(img)
   lines = []
   for y in range(200, 2100):
       row = arr[y, 150:1565]
       if (row < 80).sum() > 800:
           lines.append(y)
   ```
2. **`y2` phải nằm sau đường viền dưới thật ít nhất 15-25px.** Nếu line dưới ở `y=1557`, đặt `y2` khoảng `1580`, không đặt `1540`.
3. **Không dùng auto-tighten mù cho khung viền.** Với câu có passage nằm trong khung đen, hoặc tắt co mép cho piece đó, hoặc đặt tọa độ đủ rộng rồi kiểm ảnh bằng mắt.
4. **Không để dính đáp án HTML bên dưới.** Nếu CBT đã hiển thị đáp án bằng nút bấm, crop chỉ giữ passage/câu hỏi, không lấy dòng `① ...` bên dưới.
5. **Luôn regen map sau khi crop:** script phải ghi lại `topikXX_reading_clean_map.json` với `pieces` và `size` mới.

Các nhóm Reading hay cần kiểm kỹ khung dưới: Q15-Q18, Q21-Q24, Q28-Q41, Q42-Q50. Với các nhóm nhiều câu chung passage, chấp nhận duplicate passage cho từng câu để người học nhìn đủ ngữ cảnh.

### Bước 5: Thực hiện Crop hình ảnh phần Nghe (Listening)
Tạo script `crop_topikXX_listening_clean.py` để thực hiện cắt ảnh Nghe sạch:
1. **Q1-Q3 (Câu hỏi hình ảnh/biểu đồ):** Cắt giữ lại toàn bộ nội dung hộp đối thoại và 4 hình vẽ đáp án bên dưới (sử dụng tọa độ Y cố định tra cứu từ ảnh Grid).
2. **Q4-Q6 (Hộp đối thoại đơn lẻ):** Sử dụng thuật toán tự động nhận diện dòng viền hộp thoại (`find_dark_lines`) để crop sạch chỉ chứa phần hướng dẫn + hộp đối thoại (không chứa các phương án trắc nghiệm dạng chữ).
3. **Q7-Q20 (Mỗi trang 2 câu đơn):** Tìm hộp thoại chẵn lẻ trong 2 nửa trang dựa trên logic lọc khoảng cách tối đa giữa các viền ngang.
4. **Q21-Q50 (Mỗi trang 1 hội thoại + 2 câu hỏi):** Định vị phần đáy hộp hội thoại chung, sau đó sử dụng thuật toán tìm text bands để tự động lấy dòng câu hỏi lẻ (Band 0) và dòng câu hỏi chẵn (Band 5) ghép với hội thoại chung.

### Bước 6: Đồng bộ hóa Đường dẫn ảnh vào DB
Viết script `sync_topikXX_clean_paths.py`:
1. Đọc file map JSON của Đọc và Nghe.
2. Sử dụng API Supabase PATCH để cập nhật trường `audio_script` của tất cả 100 câu hỏi trỏ về đường dẫn ảnh clean tương ứng (ví dụ `/topik_exams/ky_XX/clean/reading/q001.jpg`).
3. Chạy script với tham số `--apply` để thực hiện cập nhật lên DB.

### Bước 7: Sắp xếp lại thứ tự đáp án bị xáo trộn (Scrambled Options Repair)
Viết script `fix_options_XX.py` để sắp xếp lại mảng `options` trắc nghiệm trên web cho khớp 100% với layout PDF gốc:
1. Sử dụng kết quả tọa độ của từng dòng đáp án thu được qua OCR Space.
2. Áp dụng thuật toán gom hàng và sắp xếp Trái -> Phải, Trên -> Dưới (layout 1 dòng, 2 dòng, hoặc hàng dọc).
3. Định vị chuỗi văn bản của đáp án đúng cũ trong mảng mới để tính toán lại chỉ số `correct_option` mới một cách toán học: `new_correct = sorted_options.index(old_correct_text) + 1`. Điều này giúp bảo toàn tuyệt đối đáp án đúng chính thức trong DB.
4. Gọi AI sinh giải thích (`explanation`) bằng Tiếng Việt dựa trên đáp án đúng đã xác định.

### Bước 8: Sửa thủ công các câu hỏi lỗi OCR đặc biệt
Các nhóm câu hỏi đặc biệt như sắp xếp thứ tự `(가)-(나)-(다)-(라)` hoặc điền ký hiệu `㉠, ㉡, ㉢, ㉣` thường bị OCR nhận diện sai lệch hoặc bỏ qua hoàn toàn.
Ta cần tạo script vá thủ công (ví dụ `fix_failed_options_XX.py`):
1. Định nghĩa cứng mảng `options` chuẩn theo PDF cho các câu này.
2. Cập nhật `correct_option` và làm sạch các trường `passage`/`question_text` bị rác OCR.
3. Gọi DeepSeek để sinh lời giải thích tiếng Việt tương ứng.

### Bước 9: Xác thực trên Giao diện CBT Web
1. Chạy `npm run dev` để khởi động dự án ở Localhost.
2. Đăng nhập và làm thử đề thi mới để xác nhận hiển thị hình ảnh gọn gàng, trật tự đáp án khớp hoàn toàn với ảnh đề, và âm thanh nghe chính xác.
3. Nếu ảnh giữ nguyên URL nhưng nội dung đã ghi đè, hard refresh trình duyệt vì browser có thể cache ảnh cũ.

### Bước 10: Verification bắt buộc trước khi báo xong
1. Kiểm tra DB đang trỏ đúng ảnh clean:
   ```js
   const { data } = await supabase
     .from('topik_exam_questions')
     .select('question_number,audio_script')
     .eq('exam_id', examId)
     .in('question_number', [/* câu vừa sửa */])
     .order('question_number')
   ```
2. Mở ảnh bằng `view_image` hoặc tạo contact sheet cho các câu vừa sửa. Không chỉ tin vào log `[OK]`.
3. Chạy build/typecheck của client: `npx tsc -b`.
4. Không commit nếu người dùng đã dặn “không commit”.

---

## Common Code Patterns & Algorithms

### 1. Thuật toán sắp xếp trật tự đáp án theo tọa độ OCR
```python
def sort_options_by_coordinates(options_with_coords):
    # Sắp xếp theo trục đứng Y (top) trước
    sorted_by_top = sorted(options_with_coords, key=lambda x: x["top"])
    
    # Nhóm thành các dòng (khoảng cách Y giữa các dòng cách nhau dưới 20 pixels)
    rows = []
    current_row = []
    for item in sorted_by_top:
        if not current_row:
            current_row.append(item)
        else:
            if abs(item["top"] - current_row[0]["top"]) <= 20:
                current_row.append(item)
            else:
                rows.append(current_row)
                current_row = [item]
    if current_row:
        rows.append(current_row)
        
    # Sắp xếp từng dòng theo trục ngang X từ Trái sang Phải
    final_sorted = []
    for row in rows:
        sorted_row = sorted(row, key=lambda x: x["left"])
        final_sorted.extend(sorted_row)
        
    return [x["text"] for x in final_sorted]
```

### 2. Tính toán dịch chuyển chỉ số đáp án đúng
```python
original_correct_text = current_options[current_correct - 1]
try:
    new_correct_index = sorted_options.index(original_correct_text) + 1
except ValueError:
    new_correct_index = current_correct # Fallback nếu không khớp chuỗi
```

### 3. Dò đường viền khung đen để tránh crop cụt
```python
def find_horizontal_frame_lines(image, x1=150, x2=1565, y1=200, y2=2100, threshold=80, min_dark=800):
    gray = np.asarray(image.convert("L"))
    hits = []
    for y in range(y1, min(y2, image.height)):
        if (gray[y, x1:x2] < threshold).sum() > min_dark:
            hits.append(y)
    groups = []
    for y in hits:
        if not groups or y - groups[-1][-1] > 2:
            groups.append([y])
        else:
            groups[-1].append(y)
    return [(g[0], g[-1]) for g in groups]
```

Khi thấy các line như `[(366, 366), (784, 785)]`, crop khung nên bao từ trước line trên đến sau line dưới, ví dụ `y1=300`, `y2=805`.

---

## Critical Rules to Prevent Errors

*   > [!IMPORTANT]
    > **Crop rộng (chứa đáp án) cho câu ngắn:** Với Reading Q1-Q8 và Q25-Q27, **bắt buộc** phải crop chứa cả các đáp án ① ② ③ ④ gốc trong hình để đảm bảo giao diện đầy đủ.
*   > [!IMPORTANT]
    > **Crop chỉ khung viền đen (passage-only) cho câu dài:** Với Reading Q42-Q50, **bắt buộc** chỉ crop phần đoạn văn chung nằm bên trong khung đen lớn (bỏ qua câu hỏi con và đáp án phụ bên ngoài).
*   > [!IMPORTANT]
    > **Co sát viền dưới để tránh dính đáp án ①:** Đối với các câu cắt sạch, cần kiểm tra kỹ toạ độ Y2. Vị trí Y2 tối đa nên cách đáp án ① ít nhất 20px-30px để thuật toán co mép không tự động nhảy xuống dính chữ đáp án.
*   > [!IMPORTANT]
    > **Không được mất viền khung đen:** Với mọi passage/hộp thoại trong khung, phải kiểm line pixel của viền dưới. Nếu ảnh thiếu thanh dưới hoặc thanh trên, sửa tọa độ `y1/y2`, chạy lại crop, và xem ảnh bằng mắt trước khi báo xong.
*   > [!WARNING]
    > **Bảo toàn tính chính xác của đáp án gốc:** Không bao giờ để AI tự quyết định/chọn đáp án đúng khi sắp xếp lại. Phải luôn sử dụng logic khớp chuỗi text thô của đáp án đúng cũ sang vị trí mới để bảo toàn dữ liệu. AI chỉ được dùng để dịch và giải thích (`explanation`) bằng Tiếng Việt.
*   > [!CAUTION]
    > **Lỗi ký tự đặc biệt:** Các câu hỏi chứa ký tự `(가) - (나)` hoặc `㉠` rất hay làm lệch logic OCR và fuzzy matching. Cần tách riêng các câu này để chạy script vá thủ công thay vì để hệ thống tự động sắp xếp.
