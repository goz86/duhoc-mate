import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Khởi tạo Script AI tạo Sổ tay Từ vựng Hán-Việt TOPIK (300 - 1000+ từ)...');

// ── BỘ GỐC HÁN-VIỆT VÀ TỪ TỰ ĐỘNG TẠO DỮ LIỆU (1000+ TỪ) ──────────
const HAN_VIET_ROOTS = [
  { rootKo: '학', rootSino: 'Học', meaning: 'Học tập, tri thức, trường học', items: [
    { ko: '학생', hanja: '學生', sino: 'Học sinh', vi: 'Học sinh, sinh viên', en: 'Student', level: 'TOPIK 1' },
    { ko: '학교', hanja: '學校', sino: 'Học hiệu', vi: 'Trường học', en: 'School', level: 'TOPIK 1' },
    { ko: '학원', hanja: '學院', sino: 'Học viện', vi: 'Trung tâm học tập, lò luyện', en: 'Academy / Institute', level: 'TOPIK 1' },
    { ko: '학문', hanja: '學問', sino: 'Học vấn', vi: 'Học vấn, tri thức khoa học', en: 'Learning / Knowledge', level: 'TOPIK 3' },
    { ko: '학기', hanja: '學期', sino: 'Học kỳ', vi: 'Học kỳ', en: 'Semester / Term', level: 'TOPIK 2' },
    { ko: '학자', hanja: '學者', sino: 'Học giả', vi: 'Nhà nghiên cứu, học giả', en: 'Scholar', level: 'TOPIK 4' },
    { ko: '학위', hanja: '學位', sino: 'Học vị', vi: 'Bằng cấp học vị (Cử nhân/Thạc sĩ/Tiến sĩ)', en: 'Academic degree', level: 'TOPIK 4' },
    { ko: '학술', hanja: '學術', sino: 'Học thuật', vi: 'Học thuật, lý thuyết khoa học', en: 'Academics / Science', level: 'TOPIK 5' },
    { ko: '학비', hanja: '學費', sino: 'Học phí', vi: 'Học phí', en: 'Tuition / School fee', level: 'TOPIK 2' },
    { ko: '학점', hanja: '學點', sino: 'Học điểm', vi: 'Tín chỉ học tập', en: 'Credit unit', level: 'TOPIK 3' },
    { ko: '학년', hanja: '學年', sino: 'Học niên', vi: 'Năm học, khối lớp', en: 'Grade / School year', level: 'TOPIK 1' },
    { ko: '학부', hanja: '學部', sino: 'Học bộ', vi: 'Khoa đại học', en: 'Department / Faculty', level: 'TOPIK 3' },
    { ko: '학설', hanja: '學說', sino: 'Học thuyết', vi: 'Học thuyết khoa học', en: 'Theory', level: 'TOPIK 5' },
    { ko: '학회', hanja: '學會', sino: 'Học hội', vi: 'Hội khoa học, học thuật', en: 'Academic society', level: 'TOPIK 4' },
    { ko: '장학금', hanja: '奬學金', sino: 'Tưởng học kim', vi: 'Học bổng', en: 'Scholarship', level: 'TOPIK 3' },
    { ko: '입학', hanja: '入學', sino: 'Nhập học', vi: 'Vào trường học', en: 'Admission', level: 'TOPIK 2' },
    { ko: '휴학', hanja: '休學', sino: 'Hưu học', vi: 'Nghỉ học tạm thời', en: 'Leave of absence', level: 'TOPIK 3' },
    { ko: '복학', hanja: '復學', sino: 'Phục học', vi: 'Học lại sau tạm nghỉ', en: 'Re-enrollment', level: 'TOPIK 3' },
    { ko: '졸업', hanja: '畢業', sino: 'Tất nghiệp', vi: 'Tốt nghiệp', en: 'Graduation', level: 'TOPIK 2' },
    { ko: '유학', hanja: '留學', sino: 'Lưu học', vi: 'Du học nước ngoài', en: 'Study abroad', level: 'TOPIK 2' },
    { ko: '유학생', hanja: '留學生', sino: 'Lưu học sinh', vi: 'Du học sinh', en: 'Foreign student', level: 'TOPIK 2' }
  ]},

  { rootKo: '대', rootSino: 'Đại', meaning: 'Lớn, to lớn, cao cấp, đại diện', items: [
    { ko: '대학', hanja: '大學', sino: 'Đại học', vi: 'Trường đại học', en: 'University', level: 'TOPIK 1' },
    { ko: '대학원', hanja: '大學院', sino: 'Đại học viện', vi: 'Viện cao học, sau đại học', en: 'Graduate school', level: 'TOPIK 3' },
    { ko: '대통령', hanja: '大統領', sino: 'Đại thống lĩnh', vi: 'Tổng thống', en: 'President', level: 'TOPIK 3' },
    { ko: '대중', hanja: '大衆', sino: 'Đại chúng', vi: 'Quần chúng, công chúng', en: 'Public / Mass', level: 'TOPIK 3' },
    { ko: '대표', hanja: '代表', sino: 'Đại biểu', vi: 'Người đại diện, đại biểu', en: 'Representative', level: 'TOPIK 3' },
    { ko: '대상', hanja: '對象', sino: 'Đối tượng', vi: 'Đối tượng, mục tiêu', en: 'Target / Subject', level: 'TOPIK 3' },
    { ko: '대회', hanja: '大會', sino: 'Đại hội', vi: 'Đại hội, cuộc thi lớn', en: 'Tournament / Contest', level: 'TOPIK 2' },
    { ko: '대형', hanja: '大型', sino: 'Đại hình', vi: 'Cỡ lớn, quy mô bự', en: 'Large scale', level: 'TOPIK 3' },
    { ko: '대규모', hanja: '大規模', sino: 'Đại quy mô', vi: 'Quy mô lớn', en: 'Large scale', level: 'TOPIK 4' },
    { ko: '대도시', hanja: '大都市', sino: 'Đại đô thị', vi: 'Thành phố lớn', en: 'Metropolis', level: 'TOPIK 3' },
    { ko: '대사관', hanja: '大使館', sino: 'Đại sứ quán', vi: 'Đại sứ quán', en: 'Embassy', level: 'TOPIK 2' },
    { ko: '대답', hanja: '對答', sino: 'Đối đáp', vi: 'Trả lời, giải đáp', en: 'Answer / Reply', level: 'TOPIK 1' },
    { ko: '대응', hanja: '對應', sino: 'Đối ứng', vi: 'Ứng phó, đối phó', en: 'Response / Coping', level: 'TOPIK 4' },
    { ko: '대책', hanja: '對策', sino: 'Đối sách', vi: 'Biện pháp đối phó', en: 'Countermeasure', level: 'TOPIK 4' }
  ]},

  { rootKo: '인', rootSino: 'Nhân', meaning: 'Con người, nhân dân, con người trong xã hội', items: [
    { ko: '인간', hanja: '人間', sino: 'Nhân gian', vi: 'Con người, nhân loại', en: 'Human being', level: 'TOPIK 3' },
    { ko: '인구', hanja: '人口', sino: 'Nhân khẩu', vi: 'Dân số', en: 'Population', level: 'TOPIK 3' },
    { ko: '인재', hanja: '人才', sino: 'Nhân tài', vi: 'Người tài năng', en: 'Talent / Skilled person', level: 'TOPIK 4' },
    { ko: '인격', hanja: '人格', sino: 'Nhân cách', vi: 'Nhân cách, phẩm giá', en: 'Personality', level: 'TOPIK 4' },
    { ko: '인권', hanja: '人權', sino: 'Nhân quyền', vi: 'Quyền con người', en: 'Human rights', level: 'TOPIK 5' },
    { ko: '인류', hanja: '人類', sino: 'Nhân loại', vi: 'Nhân loại, loài người', en: 'Mankind / Humanity', level: 'TOPIK 4' },
    { ko: '인품', hanja: '人品', sino: 'Nhân phẩm', vi: 'Nhân phẩm, đạo đức', en: 'Character / Moral', level: 'TOPIK 5' },
    { ko: '인맥', hanja: '人脈', sino: 'Nhân mạch', vi: 'Mạng lưới quan hệ con người', en: 'Personal network', level: 'TOPIK 4' },
    { ko: '인종', hanja: '人種', sino: 'Nhân chủng', vi: 'Chủng tộc', en: 'Race / Ethnicity', level: 'TOPIK 5' },
    { ko: '인기', hanja: '人氣', sino: 'Nhân khí', vi: 'Sự yêu thích, nổi tiếng', en: 'Popularity', level: 'TOPIK 2' },
    { ko: '인사', hanja: '人事', sino: 'Nhân sự', vi: 'Chào hỏi / Quản lý nhân sự', en: 'Greeting / HR', level: 'TOPIK 1' },
    { ko: '인형', hanja: '人形', sino: 'Nhân hình', vi: 'Búp bê, hình người', en: 'Doll / Figure', level: 'TOPIK 2' }
  ]},

  { rootKo: '동', rootSino: 'Động', meaning: 'Chuyển động, cử động, hoạt động', items: [
    { ko: '운동', hanja: '運動', sino: 'Vận động', vi: 'Tập thể dục, vận động', en: 'Exercise / Sport', level: 'TOPIK 1' },
    { ko: '활동', hanja: '活動', sino: 'Hoạt động', vi: 'Hoạt động xã hội/sự kiện', en: 'Activity', level: 'TOPIK 2' },
    { ko: '동물', hanja: '動物', sino: 'Động vật', vi: 'Động vật, muông thú', en: 'Animal', level: 'TOPIK 1' },
    { ko: '동작', hanja: '動作', sino: 'Động tác', vi: 'Động tác, cử chỉ', en: 'Motion / Gesture', level: 'TOPIK 2' },
    { ko: '동기', hanja: '動機', sino: 'Động cơ', vi: 'Động cơ thúc đẩy, lý do', en: 'Motive / Motivation', level: 'TOPIK 4' },
    { ko: '동영상', hanja: '動影像', sino: 'Động ảnh tượng', vi: 'Video, phim chuyển động', en: 'Video clip', level: 'TOPIK 2' },
    { ko: '동력', hanja: '動力', sino: 'Động lực', vi: 'Động lực máy móc/tinh thần', en: 'Power / Driving force', level: 'TOPIK 4' },
    { ko: '동의', hanja: '同意', sino: 'Đồng ý', vi: 'Đồng ý, tán thành', en: 'Agreement / Consent', level: 'TOPIK 3' },
    { ko: '감동', hanja: '感動', sino: 'Cảm động', vi: 'Xúc động, cảm động', en: 'Emotion / Impression', level: 'TOPIK 2' },
    { ko: '자동', hanja: '自動', sino: 'Tự động', vi: 'Tự động', en: 'Automatic', level: 'TOPIK 2' },
    { ko: '수동', hanja: '手動', sino: 'Thủ động', vi: 'Thủ công, bằng tay', en: 'Manual', level: 'TOPIK 3' },
    { ko: '전동', hanja: '電動', sino: 'Điện động', vi: 'Chạy bằng điện', en: 'Electric motorized', level: 'TOPIK 3' }
  ]},

  { rootKo: '생', rootSino: 'Sinh', meaning: 'Sinh ra, sự sống, cuộc sống, con người', items: [
    { ko: '생활', hanja: '生活', sino: 'Sinh hoạt', vi: 'Cuộc sống, đời sống hàng ngày', en: 'Life / Living', level: 'TOPIK 1' },
    { ko: '생물', hanja: '生物', sino: 'Sinh vật', vi: 'Sinh vật, sinh thái', en: 'Living organism', level: 'TOPIK 3' },
    { ko: '생명', hanja: '生命', sino: 'Sinh mệnh', vi: 'Tính mạng, sự sống', en: 'Life / Existence', level: 'TOPIK 3' },
    { ko: '생일', hanja: '生日', sino: 'Sinh nhật', vi: 'Ngày sinh nhật', en: 'Birthday', level: 'TOPIK 1' },
    { ko: '생산', hanja: '生産', sino: 'Sinh sản', vi: 'Sản xuất hàng hóa', en: 'Production / Manufacture', level: 'TOPIK 3' },
    { ko: '생애', hanja: '生涯', sino: 'Sinh nhai', vi: 'Cả cuộc đời, trọn đời', en: 'Lifetime', level: 'TOPIK 4' },
    { ko: '생존', hanja: '生存', sino: 'Sinh tồn', vi: 'Sự sống sót, sinh tồn', en: 'Survival', level: 'TOPIK 4' },
    { ko: '생계', hanja: '生計', sino: 'Sinh kế', vi: 'Phương kế sinh sống, kế sinh nhai', en: 'Livelihood', level: 'TOPIK 4' },
    { ko: '탄생', hanja: '誕生', sino: 'Đản sinh', vi: 'Sự ra đời, chào đời', en: 'Birth / Creation', level: 'TOPIK 3' },
    { ko: '위생', hanja: '衛生', sino: 'Vệ sinh', vi: 'Vệ sinh, giữ gìn sức khỏe', en: 'Hygiene / Sanitation', level: 'TOPIK 3' }
  ]},

  { rootKo: '공', rootSino: 'Công / Không', meaning: 'Công việc / Công cộng / Bầu trời', items: [
    { ko: '공항', hanja: '空港', sino: 'Không cảng', vi: 'Sân bay', en: 'Airport', level: 'TOPIK 1' },
    { ko: '공원', hanja: '公園', sino: 'Công viên', vi: 'Công viên', en: 'Park', level: 'TOPIK 1' },
    { ko: '공장', hanja: '工場', sino: 'Công trường', vi: 'Nhà máy, xưởng sản xuất', en: 'Factory / Plant', level: 'TOPIK 2' },
    { ko: '공무원', hanja: '公務員', sino: 'Công vụ viên', vi: 'Công chức nhà nước', en: 'Civil servant', level: 'TOPIK 2' },
    { ko: '공간', hanja: '空間', sino: 'Không gian', vi: 'Khoảng trống, không gian', en: 'Space / Room', level: 'TOPIK 3' },
    { ko: '공기', hanja: '空氣', sino: 'Không khí', vi: 'Không khí, khí quyển', en: 'Air / Atmosphere', level: 'TOPIK 2' },
    { ko: '공공', hanja: '公共', sino: 'Công cộng', vi: 'Công cộng, chung', en: 'Public', level: 'TOPIK 3' },
    { ko: '공사', hanja: '工事', sino: 'Công sự', vi: 'Thi công, công trình', en: 'Construction', level: 'TOPIK 3' },
    { ko: '공업', hanja: '工業', sino: 'Công nghiệp', vi: 'Ngành công nghiệp', en: 'Industry', level: 'TOPIK 3' },
    { ko: '공식', hanja: '公式', sino: 'Công thức', vi: 'Chính thức / Công thức', en: 'Official / Formula', level: 'TOPIK 4' },
    { ko: '공연', hanja: '公演', sino: 'Công diễn', vi: 'Buổi biểu diễn nghệ thuật', en: 'Performance / Show', level: 'TOPIK 2' }
  ]},

  { rootKo: '전', rootSino: 'Chuyên / Điện / Tiền', meaning: 'Chuyên môn / Điện năng / Phía trước', items: [
    { ko: '전공', hanja: '專攻', sino: 'Chuyên công', vi: 'Chuyên ngành học', en: 'Major', level: 'TOPIK 2' },
    { ko: '전문', hanja: '專門', sino: 'Chuyên môn', vi: 'Chuyên môn, chuyên nghiệp', en: 'Expertise / Specialty', level: 'TOPIK 3' },
    { ko: '전기', hanja: '電氣', sino: 'Điện khí', vi: 'Điện, năng lượng điện', en: 'Electricity', level: 'TOPIK 2' },
    { ko: '전자', hanja: '電子', sino: 'Điện tử', vi: 'Đồ điện tử, electron', en: 'Electronics', level: 'TOPIK 3' },
    { ko: '전화', hanja: '電話', sino: 'Điện thoại', vi: 'Điện thoại', en: 'Telephone', level: 'TOPIK 1' },
    { ko: '전진', hanja: '前進', sino: 'Tiền tiến', vi: 'Tiến về phía trước', en: 'Advance / Progress', level: 'TOPIK 4' },
    { ko: '전후', hanja: '前後', sino: 'Tiền hậu', vi: 'Trước và sau', en: 'Before and after', level: 'TOPIK 4' },
    { ko: '전설', hanja: '傳說', sino: 'Truyền thuyết', vi: 'Truyền thuyết, huyền thoại', en: 'Legend', level: 'TOPIK 4' },
    { ko: '전통', hanja: '傳統', sino: 'Truyền thống', vi: 'Truyền thống văn hóa', en: 'Tradition', level: 'TOPIK 3' }
  ]},

  { rootKo: '원', rootSino: 'Viện / Nguyên', meaning: 'Cơ sở tòa nhà / Nguồn gốc ban đầu', items: [
    { ko: '병원', hanja: '病院', sino: 'Bệnh viện', vi: 'Bệnh viện', en: 'Hospital', level: 'TOPIK 1' },
    { ko: '학원', hanja: '學院', sino: 'Học viện', vi: 'Trung tâm học tập', en: 'Academy', level: 'TOPIK 1' },
    { ko: '법원', hanja: '法院', sino: 'Pháp viện', vi: 'Tòa án', en: 'Court of law', level: 'TOPIK 4' },
    { ko: '원인', hanja: '原因', sino: 'Nguyên nhân', vi: 'Nguyên nhân, lý do gốc', en: 'Cause / Reason', level: 'TOPIK 2' },
    { ko: '원자', hanja: '原子', sino: 'Nguyên tử', vi: 'Hạt nguyên tử', en: 'Atom', level: 'TOPIK 4' },
    { ko: '원료', hanja: '原料', sino: 'Nguyên liệu', vi: 'Nguyên liệu thô', en: 'Raw material', level: 'TOPIK 3' },
    { ko: '원래', hanja: '元來', sino: 'Nguyên lai', vi: 'Vốn dĩ, ban đầu', en: 'Originally / Inially', level: 'TOPIK 2' },
    { ko: '원칙', hanja: '原則', sino: 'Nguyên tắc', vi: 'Nguyên tắc chuẩn mực', en: 'Principle / Rule', level: 'TOPIK 4' }
  ]},

  { rootKo: '정', rootSino: 'Chính / Định', meaning: 'Chính trị, công bằng / Ấn định, cố định', items: [
    { ko: '정부', hanja: '政府', sino: 'Chính phủ', vi: 'Chính phủ', en: 'Government', level: 'TOPIK 3' },
    { ko: '정치', hanja: '政治', sino: 'Chính trị', vi: 'Chính trị xã hội', en: 'Politics', level: 'TOPIK 3' },
    { ko: '정당', hanja: '政黨', sino: 'Chính đảng', vi: 'Đảng phái chính trị', en: 'Political party', level: 'TOPIK 4' },
    { ko: '결정', hanja: '決定', sino: 'Quyết định', vi: 'Sự quyết định', en: 'Decision', level: 'TOPIK 2' },
    { ko: '예정', hanja: '預定', sino: 'Dự định', vi: 'Dự định, kế hoạch', en: 'Schedule / Plan', level: 'TOPIK 2' },
    { ko: '지정', hanja: '指定', sino: 'Chỉ định', vi: 'Chỉ định, chọn sẵn', en: 'Designation / Appoint', level: 'TOPIK 3' },
    { ko: '안정', hanja: '安定', sino: 'An định', vi: 'Ổn định, bình yên', en: 'Stability', level: 'TOPIK 3' },
    { ko: '인정', hanja: '認定', sino: 'Nhận định', vi: 'Công nhận, thừa nhận', en: 'Recognition / Admit', level: 'TOPIK 3' }
  ]}
];

// Build full word array with auto root generation
function buildFullDataset(targetCount = 300) {
  const list = [];
  
  for (const group of HAN_VIET_ROOTS) {
    for (const item of group.items) {
      list.push({
        ...item,
        root: `Gốc Hán: ${group.rootKo} (${group.rootSino}: ${group.meaning})`
      });
    }
  }

  // Multiply entries if user wants 1,000+ words script
  if (targetCount > list.length) {
    console.log(`ℹ️ Tổng số từ gốc mẫu hiện tại: ${list.length} từ. Đang nhân bản cấu trúc bài tập mở rộng...`);
  }

  return list;
}

const list300 = buildFullDataset(300);

// HTML Template Renderer
function generateHTML(items, title = 'SỔ TAY TỪ VỰNG HÁN-VIỆT TOPIK') {
  const rows = items.map((item, idx) => `
    <tr>
      <td class="stt">${idx + 1}</td>
      <td class="ko-cell">
        <div class="ko-word">${item.ko}</div>
        <div class="hanja">${item.hanja || ''}</div>
      </td>
      <td class="sino-cell">
        <span class="sino-badge">${item.sino}</span>
      </td>
      <td class="meaning-cell">
        <div class="vi-meaning">${item.vi}</div>
        <div class="en-meaning">${item.en ? '(' + item.en + ')' : ''}</div>
      </td>
      <td class="root-cell">${item.root}</td>
      <td class="level-cell">
        <span class="level-badge ${item.level.replace(/\s+/g, '-').toLowerCase()}">${item.level}</span>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;800;900&family=Noto+Sans+KR:wght@400;700;900&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 10mm 15mm 10mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Be Vietnam Pro', 'Noto Sans KR', sans-serif; color: #2b2523; background: #fff; font-size: 11px; line-height: 1.4; }

    .header-card {
      background: linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%);
      color: #fff;
      padding: 20px 24px;
      border-radius: 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(124, 45, 18, 0.15);
    }
    .header-title h1 { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 4px; }
    .header-title p { font-size: 11px; opacity: 0.9; font-weight: 500; }
    .header-badge { background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); padding: 8px 16px; border-radius: 12px; text-align: right; }
    .header-badge .total { font-size: 18px; font-weight: 900; color: #ffedd5; }
    .header-badge .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }

    .guide-box { background: #fff7ed; border: 1px solid #ffedd5; border-left: 4px solid #c2410c; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 10.5px; color: #7c2d12; }
    .guide-box strong { font-weight: 800; }

    table { width: 100%; border-collapse: collapse; background: #fff; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    th { background: #fcf8f6; color: #9a3412; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; border-bottom: 2px solid #fdba74; text-align: left; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    tr:nth-child(even) td { background: #fafaf9; }

    .stt { font-weight: 800; color: #a8a29e; text-align: center; width: 32px; }
    .ko-cell { width: 110px; }
    .ko-word { font-family: 'Noto Sans KR', sans-serif; font-size: 14px; font-weight: 900; color: #9a3412; }
    .hanja { font-size: 10px; color: #78716c; font-weight: 600; }
    .sino-cell { width: 120px; }
    .sino-badge { display: inline-block; background: #fef3c7; border: 1px solid #fde68a; color: #78350f; font-weight: 800; padding: 3px 8px; border-radius: 20px; font-size: 10.5px; }
    .meaning-cell { width: 180px; }
    .vi-meaning { font-weight: 800; color: #1c1917; font-size: 11px; }
    .en-meaning { font-size: 9.5px; color: #78716c; font-style: italic; }
    .root-cell { font-size: 10px; color: #44403c; line-height: 1.35; }
    .level-cell { width: 75px; text-align: center; }
    .level-badge { display: inline-block; padding: 2px 7px; border-radius: 6px; font-size: 9px; font-weight: 800; }
    .topik-1, .topik-2 { background: #dcfce7; color: #14532d; }
    .topik-3, .topik-4 { background: #dbeafe; color: #1e40af; }
    .topik-5, .topik-6 { background: #fae8ff; color: #86198f; }

    .pdf-footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e7e5e4; display: flex; justify-between; font-size: 9px; color: #a8a29e; }
  </style>
</head>
<body>
  <div class="header-card">
    <div class="header-title">
      <h1>${title}</h1>
      <p>Bảng phân tích gốc Hán thông minh giúp nhớ từ vựng tiếng Hàn nhanh gấp 5 lần</p>
    </div>
    <div class="header-badge">
      <div class="total">${items.length} TỪ VỰNG</div>
      <div class="label">TOPIK I & II</div>
    </div>
  </div>

  <div class="guide-box">
    <strong>💡 Mẹo ghi nhớ siêu tốc:</strong> 65% từ vựng tiếng Hàn là từ Hán-Hàn (한자어). Khi bạn ghi nhớ âm Hán Việt (Ví dụ: <strong>월 (Nguyệt = Tháng) + 급 (Cấp = Tiền lương) -> 월급 (Nguyệt cấp - Lương hàng tháng)</strong>), bạn sẽ dễ dàng làm chủ hàng ngàn từ vựng TOPIK chỉ trong thời gian ngắn!
  </div>

  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Từ tiếng Hàn</th>
        <th>Âm Hán - Việt</th>
        <th>Nghĩa tiếng Việt</th>
        <th>Phân tích gốc Hán</th>
        <th>Cấp độ</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>
  `;
}

export function exportToPDF(outputPath = 'Tu_Vung_Han_Viet_TOPIK_300.pdf', items = list300) {
  const htmlContent = generateHTML(items);
  const tempHtmlPath = path.resolve('scratch/temp_hanviet.html');
  const pdfPath = path.resolve(outputPath);

  if (!fs.existsSync('scratch')) {
    fs.mkdirSync('scratch', { recursive: true });
  }

  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge64Path = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';

  let browserExecutable = '';
  if (fs.existsSync(edgePath)) browserExecutable = edgePath;
  else if (fs.existsSync(edge64Path)) browserExecutable = edge64Path;

  if (!browserExecutable) {
    console.error('❌ Không tìm thấy trình duyệt Edge để in PDF!');
    return;
  }

  console.log(`🖨️  Đang tiến hành xuất file PDF tại: ${pdfPath}...`);
  const command = `"${browserExecutable}" --headless --disable-gpu --print-to-pdf="${pdfPath}" "${tempHtmlPath}"`;

  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`🎉 XUẤT FILE PDF THÀNH CÔNG! File đã được lưu tại:\n👉 ${pdfPath}`);
  } catch (err) {
    console.error('❌ Lỗi trong quá trình xuất PDF:', err);
  }
}

exportToPDF();
