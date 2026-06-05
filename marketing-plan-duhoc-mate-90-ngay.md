# Kế Hoạch Fullstack Marketing — Duhoc Mate 🎯

> **Giai đoạn:** Growth — sản phẩm đã đầy đủ core features, cần user growth
> **Thời gian:** 90 ngày (06 — 09/2026)
> **Thị trường:** Du học sinh Việt Nam tại Hàn Quốc (≈80,000+ người)
> **Target:** 500 active users, 50 rooms/ngày
> **Ngân sách:** Bootstrap (≈0-5tr/tháng), Organic-first

---

## Phần 1 — Chiến lược tổng thể

### Tóm tắt

| Hạng mục | Nội dung |
|----------|----------|
| Sản phẩm | Duhoc Mate — nền tảng học tập online đồng bộ cho du học sinh |
| USP chính | "Study together" với 7+ tính năng đồng bộ + TOPIK AI tích hợp |
| Tình trạng code | 40+ commit gần đây — active dev, camera, voice, TOPIK, PDF sync |
| Thị trường | Du học sinh Việt tại Hàn + du học sinh sắp đi |
| Giai đoạn | Growth — core đã đủ, cần user và community |
| Ngân sách | 0-5tr/tháng, organic-heavy |

### Phân tích SWOT

| | Tích cực | Tiêu cực |
|---|---------|---------|
| **Nội bộ** | **Strengths:** UI Cozy Cream đẹp nhất phân khúc, 7 stage đồng bộ (YouTube Jukebox, PDF sync, Pomodoro, TOPIK AI, Video call, Whiteboard, Music), Voice chat WebRTC + Camera, Community forum + Idea board + Template marketplace, i18n (VN mặc định), Google Auth, Friend system | **Weaknesses:** Chưa có user base, chưa mobile app, chưa monetize, marketing 0 đồng, server còn basic |
| **Bên ngoài** | **Opportunities:** 80K+ du học sinh VN tại Hàn, TikTok/FB Groups rất active, mùa hè → vào kỳ mới, nhu cầu TOPIK tăng mạnh, "study with me" đang là trend toàn cầu | **Threats:** Lissenly (global, UI cũng đẹp), StudyStream (scale lớn), Group FB thay thế miễn phí, Discord servers |

### Competitive Moat

| Đối thủ | Điểm mạnh | Khai thác điểm yếu |
|---------|----------|-------------------|
| **Lissenly** | UI Cozy, global, có user | **Không VN, không TOPIK, không camera/voice** |
| **StudyStream** | Nhiều room, global scale | **Không cá nhân hoá, giao diện lạnh, không có tính năng VN** |
| **Group FB** | 100K+ member | **Không đồng bộ thời gian thực, không có study tools** |
| **Discord** | Tuỳ biến cao, bot | **Không thân thiện với người mới, UX phức tạp** |

**Moat cần xây:**
- **TOPIK AI tích hợp** — không app study together nào có
- **Cozy Cream UI** — "chữa lành" sau giờ học/làm mệt
- **VN Community lock-in** — càng đông càng khó rời
- **All-in-one** — không cần mở nhiều tab

### Customer Insight

| Yếu tố | Mô tả |
|--------|-------|
| Nỗi đau lớn nhất | Cô đơn ở phòng trọ Hàn — học một mình không vô, dễ lướt TikTok |
| Mong muốn thầm kín | "Có bạn học cùng qua cam là vui rồi — khỏi cần gặp mặt" |
| Rào cản | "App mới, sợ không có ai trong phòng" |
| Trigger | Tối CN buồn, mùa thi TOPIK, đầu kỳ mới, mới sang Hàn |
| Kênh tin tưởng | Group FB "Du học sinh Hàn Quốc", bạn bè rủ, TikTok | 

---

## Phần 2 — SAVE Framework

### Solution

| Câu hỏi | Trả lời |
|---------|---------|
| Khách đang gặp vấn đề gì? | Học một mình ở phòng trọ → mất tập trung, cô đơn, procrastinate |
| Giải quyết thế nào? | Phòng học online đồng bộ: cam thấy mặt nhau + YouTube Jukebox + TOPIK AI + Pomodoro cùng room |
| Kết quả họ nhận được? | Tập trung hơn 2-3x, có bạn đồng hành, cải thiện TOPIK |
| Timeline thấy kết quả? | Ngay lần đầu — thấy người thật qua camera là có động lực |

### Access

| Kênh | Vai trò | Priority |
|------|---------|----------|
| **TikTok organic** ⭐ | TOFU — viral reach | **🔥 CAO NHẤT** |
| **Facebook Groups** ⭐ | TOFU+MOFU — cộng đồng du học | **🔥 CAO** |
| **Facebook Ads** | MOFU+BOFU — targeting đúng | 🟡 Trung bình (khi có budget) |
| **Zalo OA** | Retention | 🟢 Trung bình |
| **Blog/SEO** | MOFU | 🟢 Thấp (dài hạn) |
| **Bạn bè giới thiệu** | Viral growth | **🔥 QUAN TRỌNG** |

### Value

- **Free** — so với Lissenly $5-10/th, Focusmate $20/th
- Giá trị: tiết kiệm 5-10K won/cà phê thư viện + 2-4h procrastination/ngày
- ROI: 1 phút tạo room = 2-3h học tập trung

### Education

| Stage | Nội dung | Goal |
|-------|----------|------|
| Chưa biết vấn đề | "Học một mình ở Hàn Quốc: lợi hay hại?" | Nhận ra nỗi đau |
| Biết vấn đề | "5 app study together cho du học sinh" | Biết có giải pháp |
| Đang cân nhắc | Review Duhoc Mate vs Lissenly | Chọn Duhoc Mate |
| Sẵn sàng hành động | "Cách tạo phòng + invite bạn trong 30s" | Hành động ngay |

---

## Phần 3 — Kế hoạch nội dung

### Content Pillar

| Pillar | % | Mục đích | Ví dụ cụ thể cho Duhoc Mate |
|--------|---|----------|---------------------------|
| **Giáo dục** 📚 | 35% | SEO, value, trust | "Cách học TOPIK 4 trong 3 tháng", "Mẹo tập trung khi học cho du học sinh" |
| **Cảm hứng** ✨ | 25% | Engagement, share | "Một ngày học cùng Duhoc Mate", "Từ cô đơn đến có bạn học — câu chuyện của mình" |
| **Giải trí** 🎬 | 20% | Viral, reach | Trend TikTok "POV: bạn du học sinh 22h vẫn cày TOPIK", meme du học |
| **Bán hàng** 🛒 | 15% | Conversion | "Tính năng mới: TOPIK Grammar Lab", "Học cùng người thật qua video call" |
| **Cộng đồng** 🤝 | 5% | Retention | User spotlight, Q&A, challenge "học cùng nhau 7 ngày" |

### Content Matrix (30+ ý tưởng)

| Pillar → Format ↓ | Giáo dục | Cảm hứng | Giải trí | Bán hàng |
|------------------|---------|---------|---------|---------|
| **Hướng dẫn** | "Setup phòng học đầu tiên" | — | — | "Cách dùng TOPIK AI flashcards" |
| **Cảm hứng** | "Hành trình TOPIK 3→4" | "Góc học tập trên Duhoc Mate" | "Vừa học vừa nghe nhạc cùng bạn" | "100+ bạn đang học cùng nhau" |
| **Phân tích** | "Tại sao học 1 mình kém hiệu quả?" | — | — | "Duhoc Mate có gì mà Lissenly không có?" |
| **Ngược đời** | "Học NHIỀU hơn KHÔNG phải là cách" | — | — | "Study together không chỉ để học" |
| **Danh sách** | "7 app học tập cho du học sinh" | "5 lý do nên học cùng nhau" | "7 cung bậc khi học TOPIK" | "10 tính năng bạn chưa biết" |

### Viral Content Ideas (TikTok-first)

1. **POV trend:** "POV: bạn du học sinh ở Hàn không có bạn học → discover Duhoc Mate → có người học cùng qua cam"
2. **Before/After:** "Học 1 mình vs Học cùng Duhoc Mate — focus level khác hẳn"
3. **TOPIK humor:** "Cảm giác khi làm được câu đọc hiểu TOPIK nhờ học cùng bạn"
4. **Cozy aesthetic:** ASMR study room — tiếng gõ bàn phím + nhạc Lofi + cam thấy người học
5. **Challenge:** "Học cùng nhau 7 ngày liên tục — ai trụ được?"
6. **Transition:** "App study together của dân Việt tại Hàn — giao diện như này đây"
7. **UGC từ user:** User tự quay đang học trên app → repost

### Content Repurposing: 1 video → 7+ pieces

| STT | Format | Platform |
|-----|--------|----------|
| 1 | Video gốc 3-5 phút (full) | YouTube |
| 2 | Clip 15s hook | TikTok, Reels |
| 3 | Clip 30s tip chính | TikTok |
| 4 | Clip 15s kết quả | TikTok |
| 5 | Carousel 5 slide | Facebook, Instagram |
| 6 | Blog 800 từ | Website SEO |
| 7 | Email newsletter | Email list |

---

## Phần 4 — Kênh & Ngân sách

### Channel Mix

| Kênh | Funnel | Budget | KPI | Content/week |
|------|--------|--------|-----|-------------|
| **TikTok** 🎵 | TOFU | 0đ | View >500, follower growth | 3-4 video |
| **FB Groups** 👥 | TOFU+MOFU | 0đ | Click >50, engagement | 5-7 post |
| **Zalo OA** 💬 | Retention | 0đ | Read rate >60% | 2 broadcast/tuần |
| **Facebook Ads** 💰 | MOFU+BOFU | 1-3tr (nếu có) | CPMess <30K | 2-3 creative test |
| **Blog SEO** 📝 | MOFU | 0đ (tự viết) | Organic traffic | 1 bài/tuần |
| **Discord/Telegram** | Community | 0đ | Member growth | Engagement daily |

### Budget Allocation

| Giai đoạn | Ads | Content | UGC/KOL | Tool | Dự phòng |
|-----------|-----|---------|---------|------|---------|
| Tháng 1 (test) | 0đ | 80% | 0% | 10% | 10% |
| Tháng 2 (scale) | 1-2tr | 50% | 20% | 15% | 5% |
| Tháng 3 (optimize) | 2-3tr | 40% | 30% | 15% | 5% |

**Chiến thuật chi tiêu thông minh:**
- **KOL/KOC:** Không trả tiền mặt — tặng premium access + exclusive features
- **Ads:** Chỉ chạy khi organic content có signal (CTR >3%, engagement >5%)
- **Content:** Batch sản xuất 1 tuần/lần để tối ưu thời gian

---

## Phần 5 — KPI & Performance

### Reverse KPI (target: 500 daily active users)

```
500 DAU
  × 80% vào room = 400 users in room
  / 8 users/room trung bình = 50 rooms/ngày

Cần: 10,000 visitors/tháng
  × 5% signup rate = 500 signups/tháng
  × 70% activation (tạo room) = 350 active/tháng
  × 1.4 viral coefficient (invite bạn) → 500

Phân bổ traffic:
  70% organic (TikTok + FB Groups)
  20% direct/share
  10% search (SEO)
```

### KPI 3 Kịch Bản

| Metric | Pessimistic | **Base** ✅ | Optimistic |
|--------|-------------|-----------|------------|
| **Daily Active Users** | <100 | **500** | 2,000 |
| **Rooms/ngày** | <10 | **50** | 200 |
| **TikTok Followers** | <500 | **2,000** | 10,000 |
| **TikTok Views/video** | <200 | **1,000** | 10,000+ |
| **Signups/tháng** | <100 | **500** | 2,000 |
| **D7 Retention** | <15% | **25%** | 40% |
| **D30 Retention** | <5% | **12%** | 25% |
| **Viral Coefficient** | <0.3 | **1.2** | 2.5 |
| **Nam** | Phản hồi | Xử lý < 24h, escalate | ✅ **CRITICAL** |

### KPI Milestones

| Tháng | TikTok | Signups | DAU | Retention D7 |
|-------|--------|---------|-----|------------|
| Tháng 1 | 200 follows | 100 | 50 | 20% |
| Tháng 2 | 1,000 follows | 250 | 200 | 25% |
| Tháng 3 | 2,000 follows | 500 | 500 | 25%+ |

---

## Phần 6 — Risk Matrix

| Rủi ro | XS | Ảnh hưởng | Mức | Xử lý |
|--------|----|----------|-----|-------|
| **Room trống → user rời** 🔴 | Cao | Cao | **CRITICAL** | Seed rooms: tạo 10 room chủ đề (TOPIK, Lofi, Hàn ngữ, ...) có fake activity + bot tự động bật nhạc |
| **TikTok không reach** | Cao | TB | **HIGH** | Đa dạng format, test 3-4 trend/tuần, không phụ thuộc 1 platform |
| **Bug/UX không tốt** | TB | Cao | **HIGH** | Feedback form trong app, fix trong 24h, onboarding mượt |
| **User không invite bạn** | Cao | TB | **HIGH** | Gamification: streak, rank, invite reward (premium tính năng) |
| **Server cost** | TB | TB | **MEDIUM** | Supabase free tier, optimize Socket.io, monitor usage |
| **Đối thủ copy** | TB | TB | **MEDIUM** | Moat = cộng đồng + VN — không copy được culture |
| **Thiếu content** | Cao | TB | **MEDIUM** | Batch content 1 tuần/lần, content matrix sẵn, repurpose 1→7 |

---

## Phần 7 — Timeline 90 Ngày

### Roadmap Weekly

| Tuần | Phase | Content | Growth | Product |
|------|-------|---------|--------|---------|
| **W1** | 🚀 Setup | Tạo TikTok + FB Groups, content matrix, 5 seed rooms | — | Onboarding tối ưu, share link feature |
| **W2** | 🚀 Launch | 4 TikTok, 7 FB post, invite friends | Post FB Groups "du học sinh Hàn Quốc" | Invite modal, friend code highlight |
| **W3** | 📈 Growth | Viral challenge "học cùng nhau", UGC call | 50 users | Room discovery page |
| **W4** | 📈 Optimize | A/B content, phân tích data | 100 users | Feedback loop, fix critical UX |
| **W5** | 📈 Scale | Batch content tháng 2, collab micro KOL | 150 users | Tính năng mới (dựa trên feedback) |
| **W6** | 🤝 Community | Discord/Telegram server, user spotlight | 200 users | Community features |
| **W7** | 🤝 Community | Challenge "học 7 ngày liên tục" | 250 users | Streak system |
| **W8** | 🚀 Scale | UGC campaign, referral program | 300 users | Referral tracking |
| **W9** | 📊 Measure | Phân tích D7/D30 retention, optimize | 350 users | Retention features |
| **W10** | 🎯 Retention | Email/Zalo re-engagement | 400 users | Push notification |
| **W11** | 🎯 Monetize test | MVP monetization (TOPIK premium) | 450 users | Premium features |
| **W12** | 🎉 Milestone | Tổng kết, plan Q4 | **500 users** | ✅ KPI hit |

### Key Milestones

| Mốc | Thời gian | Điều kiện thành công |
|-----|----------|-------------------|
| **MVP launch** | W2 | 50 users đăng ký, 10 rooms/ngày |
| **Growth** | W6 | 200 users, 20 rooms, retention >20% |
| **Scale** | W9 | 350 users, viral coefficient >1.0 |
| **Target** | 🎯 W12 | **500 users, 50 rooms, retention >25%** |

---

## Action Items Ngay Lập Tức 🔥

### Tuần này (04-07/06/2026)

**Day 1-2: Setup**
- [ ] Tạo TikTok account "duhocmate" — bio + link landing
- [ ] Tham gia 5 FB Groups mục tiêu:
  - "Du học sinh Hàn Quốc"
  - "Hội du học sinh Việt Nam tại Hàn"
  - "Luyện thi TOPIK"
  - "Học tiếng Hàn mỗi ngày"
  - "Hội chia sẻ kinh nghiệm du học"
- [ ] Tạo 10 seed rooms với chủ đề + music sẵn
- [ ] Tối ưu landing page: CTA "Tạo phòng miễn phí" nổi bật, screenshot tính năng

**Day 3-5: First Batch Content**
- [ ] Quay 4 TikTok đầu tiên (POV trend + 2 tips + 1 tính năng)
- [ ] Viết 5 FB posts cho Groups (câu chuyện + value + CTA)
- [ ] Thiết lập Zalo OA "Duhoc Mate"

**Day 6-7: Launch**
- [ ] Đăng TikTok đầu tiên
- [ ] Post FB Groups
- [ ] Invite bạn bè, kêu gọi share
- [ ] Track: views, signups, room creation

---

## Tài liệu tham khảo

- **Context sản phẩm:** `.agents/product-marketing-context.md`
- **Skills:** `.agents/skills/`
  - `00-ke-hoach-mkt` — marketing plan master
  - `01-lich-noi-dung` — content calendar
  - `02-brief-chien-dich` — campaign brief
  - `05-copy-quang-cao` — ad copy
  - `08-nghien-cuu-doi-thu` — competitor research
  - `09-insight-khach-hang` — customer insight

---

> **Kế hoạch được tạo bởi skill `00-ke-hoach-mkt` từ [ai-business-skills](https://github.com/minhnv0807/ai-business-skills)**
> **Adapted cho OpenClaw + Duhoc Mate project**
