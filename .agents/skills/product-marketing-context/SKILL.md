---
name: product-marketing-context
description: "Foundation skill — tạo file context sản phẩm/khách hàng/dịnh vị. Chạy TRƯỚC mọi skill marketing khác. Tự động thu thập thông tin qua 12 section, lưu vào .agents/product-marketing-context.md."
---

# Product Marketing Context (Foundation Skill)

> **Đây là foundation skill** — chạy TRƯỚC mọi skill marketing khác.

## Luồng hoạt động

### Bước 1: Kiểm tra file hiện có

Kiểm tra `.agents/product-marketing-context.md` hoặc `.agents/product-marketing-context.md`.

**Nếu có:** Đọc file, tóm tắt, hỏi user muốn cập nhật section nào.

**Nếu không — đề xuất 2 cách:**
1. **Auto-draft từ codebase:** Đọc README, phân tích source code → draft V1
2. **Thu thập từ đầu:** Hỏi từng section

### Bước 2: Thu thập thông tin

Đi qua từng section — mỗi section hỏi 1-3 câu, KHÔNG hỏi dồn.

### Bước 3: Tạo file

Lưu vào `.agents/product-marketing-context.md`.

## Template

Xem template đầy đủ: gồm 12 section:
1. Tổng quan sản phẩm
2. Tệp khách hàng mục tiêu
3. Chân dung khách hàng (Persona)
4. Nỗi đau & Vấn đề
5. Đối thủ cạnh tranh
6. Khác biệt hóa
7. Rào cản & Anti-persona
8. Động lực chuyển đổi
9. Ngôn ngữ khách hàng
10. Giọng nói thương hiệu
11. Bằng chứng xã hội
12. Mục tiêu

## Checklist chất lượng

- [ ] Đủ 12 section (hoặc ≥8 section chính)
- [ ] Có ngôn ngữ khách hàng thực tế
- [ ] Có anti-persona rõ ràng
- [ ] Có 3 khác biệt hóa cụ thể
- [ ] Có North Star Metric
