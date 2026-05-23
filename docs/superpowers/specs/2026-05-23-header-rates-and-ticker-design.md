# Spec: Header Exchange Rates, Weather & Sub-Header Activity Ticker

Integrated layout adjustments to display real-time Korea-VND exchange rates, Seoul weather in the header (only on Bulletin Board tab), update translations, and display a rotating Activity Ticker of recent posts next to the navigation bar.

## 1. Overview
The user wants to streamline the Landing Page header layout:
- Move weather and exchange rates to the top header on the same line as the logo. These will be fetched directly from real-time APIs on the client side.
- Limit visibility of the rates & weather chips to the **Bảng tin** (Bulletin Board) tab to maintain a distraction-free study layout.
- Integrate an **Activity Ticker** displaying titles of the latest community posts on the same line as the main navigation tabs (`Phòng học`, `Bảng tin`, `Tính lương`).
- Rename "Bảng hỗ trợ cuộc sống Hàn Quốc" to "Bảng tin hỗ trợ đời sống Hàn Quốc" for better fit.

---

## 2. Technical Design

### A. Real-Time API Fetching (LandingPage.tsx)
Two real-time endpoints will be polled or fetched on component mount:
- **Exchange rate**: `https://open.er-api.com/v6/latest/KRW`.
  - Formula correction: `vndRate` is the rate of 1 Won in VND. Therefore, `1,000 Won ≈ 1000 * vndRate` VND.
- **Weather**: `https://wttr.in/Seoul?format=j1`.
  - Read `temp_C` and the first `weatherDesc` value.

### B. Header Component Layout
In `LandingPage.tsx`, when `showHelpBoard` is true:
- Render the weather and exchange rate chips inside the header controls layout, next to the KST Clock.
- Maintain responsive design (hide or stack neatly on mobile screens).

### C. Activity Ticker Component
We will build/integrate the rotating ticker in `LandingPage.tsx`:
- Fetch the latest 15 posts from `help_posts` table via Supabase client.
- If Supabase client is not enabled or returns empty, fallback to the `SAMPLE_POSTS` array.
- Rotates messages using phase transition states (`in`, `show`, `out`) via `setTimeout` phase rotations (`0.35s` in, `2.20s` show, `0.35s` out).
- Clicking a ticker post switches active tab to **Bảng tin** and sets the expanded post ID so the user is scrolled to and sees the details.

### D. CSS Classes (index.css)
Add transition styles for the ticker:
- `.activity-ticker`
- `.ticker-inner`
- `.ticker-in`, `.ticker-show`, `.ticker-out`
- `.ticker-clickable`

### E. Translations (i18n.ts)
Update `'help.title'` in `vi` object:
- From: `'Bảng hỗ trợ cuộc sống Hàn Quốc'`
- To: `'Bảng tin hỗ trợ đời sống Hàn Quốc'`

---

## 3. Verification Plan

### Automated Build Verification
- Compile code using `npm run build` in `client/` directory to ensure no syntax/type errors.

### Manual Verification
- Verify weather and exchange rate fetch correctly on `Bảng tin` tab, and disappear on `Phòng học` tab.
- Verify exchange rate correctly displays ~17,800₫ or similar actual rate (Formula: `1000 * rate`).
- Verify activity ticker rotates between latest posts next to navigation tabs.
- Verify clicking on a post in the ticker expands that post in the bulletin board list.
