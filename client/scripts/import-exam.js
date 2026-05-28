/**
 * TOPIK Exam Batch Importer Script
 * -------------------------------------------------------------
 * Tập lệnh tự động hóa việc trích xuất đề thi TOPIK từ file văn bản thô
 * (copy từ PDF đề chính thức), dịch nghĩa tiếng Việt, sinh giải thích
 * và đẩy trực tiếp vào cơ sở dữ liệu Supabase của bạn.
 * 
 * Cách sử dụng:
 * 1. Dán nội dung text copy từ đề PDF vào file `exam-input.txt` cùng thư mục.
 * 2. Cấu hình VITE_DEEPSEEK_API_KEY trong file `client/.env`
 * 3. Chạy lệnh: `node client/scripts/import-exam.js`
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── 1. ĐỌC CẤU HÌNH TỪ .ENV ──────────────────────────────────────
const envPath = path.resolve(__dirname, '../.env');
const inputPath = path.resolve(__dirname, './exam-input.txt');

if (!fs.existsSync(envPath)) {
  console.error('❌ Không tìm thấy tệp client/.env để cấu hình kết nối database.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const deepseekKey = envContent.match(/VITE_DEEPSEEK_API_KEY=(.*)/)?.[1]?.trim();

console.log('🔌 Đang khởi tạo kết nối database...');
console.log(`- Supabase URL: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Lỗi: Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong file .env');
  process.exit(1);
}

if (!deepseekKey) {
  console.error('❌ Lỗi: Thiếu cấu hình VITE_DEEPSEEK_API_KEY trong file .env để gọi AI phân tích.');
  console.error('👉 Vui lòng mở file client/.env và thêm dòng: VITE_DEEPSEEK_API_KEY=sk-xxxx...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── 2. ĐỌC FILE ĐỀ THI ĐẦU VÀO ────────────────────────────────────
if (!fs.existsSync(inputPath)) {
  fs.writeFileSync(inputPath, `--- HƯỚNG DẪN DÁN ĐỀ THI ---
Dán nội dung text bạn copy từ file PDF đề thi chính thức vào đây.
Nên dán khoảng 5 - 15 câu mỗi lần chạy để đảm bảo AI phân tích chi tiết và chính xác nhất.

Ví dụ đề thi Đọc:
[1~2] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.
1. 책을 ( ) 갑자기 고등학교 친구를 만났다.
① 빌리거나 ② 빌리더니 ③ 빌리는 길에 ④ 빌리는 데다가

Ví dụ đề thi Nghe:
[1~2] 다음을 듣고 알맞은 행동을 고르십시오.
1. 남자: 수미 씨, 이 미용실은 손님이 참 많네요.
여자: 네, 머리를 아주 잘하거든요. 저기 빈 자리가 있으니 앉아서 기다리세요.
① 자리에 앉아서 기다린다.
② 미용실 예약을 확인한다.
③ 남자에게 머리를 깎아 준다.
④ 다른 미용실로 이동한다.
`, 'utf8');
  console.log(`📝 Đã tự động tạo tệp mẫu [exam-input.txt] tại: ${inputPath}`);
  console.log('👉 Vui lòng mở tệp đó, dán đề thi bạn muốn nạp vào và chạy lại lệnh.');
  process.exit(0);
}

const rawText = fs.readFileSync(inputPath, 'utf8');
if (rawText.includes('--- HƯỚNG DẪN DÁN ĐỀ THI ---') || !rawText.trim()) {
  console.error('❌ Tệp exam-input.txt chưa chứa dữ liệu đề thi thật của bạn.');
  console.error('👉 Hãy dán văn bản đề thi từ file PDF vào tệp exam-input.txt rồi chạy lại.');
  process.exit(1);
}

// ─── 3. TIẾN HÀNH GỌI AI PHÂN TÍCH VÀ CẤU TRÚC HÓA ────────────────
async function parseExamWithAi(text) {
  console.log('🧠 AI đang phân tích dữ liệu đề thi thô. Quá trình này mất khoảng 15-30 giây...');
  
  const systemPrompt = `Bạn là một chuyên gia khảo thí tiếng Hàn chuyên nghiệp chuyên biên soạn và phân tích cấu trúc đề thi TOPIK quốc tế cho Viện Giáo dục Quốc tế Quốc gia Hàn Quốc (NIIED).
Nhiệm vụ của bạn là nhận vào văn bản thô đề thi TOPIK và phân tích thành một đối tượng JSON duy nhất chứa cấu trúc đề thi và chi tiết các câu hỏi.

YÊU CẦU ĐỘ CHÍNH XÁC TUYỆT ĐỐI:
1. Tìm và xác định chính xác đáp án đúng cho mỗi câu trắc nghiệm.
2. Dịch nghĩa câu hỏi, các phương án lựa chọn và viết lời giải thích ngữ pháp chi tiết bằng tiếng Việt trong trường "explanation".
3. Mảng "options" phải chứa đúng 4 đáp án dạng text tiếng Hàn (không bao gồm ký hiệu số ①, ②, ③, ④).
4. Chỉ số "correct_option" bắt buộc phải là số từ 1 đến 4 trỏ chính xác vào vị trí đáp án đúng trong mảng "options" (1 là phần tử đầu tiên).
5. Trường "category" bắt buộc phải là 'reading' (nếu là đề Đọc) hoặc 'listening' (nếu là đề Nghe có kèm hội thoại/kịch bản nghe).
6. Trường "level" bắt buộc là 1 (TOPIK I) hoặc 2 (TOPIK II).

Xuất ra định dạng JSON duy nhất, không thêm markdown code blocks (không dùng \`\`\`json), không giải thích gì ngoài JSON. Định dạng JSON bắt buộc:
{
  "title": "Tiêu đề đề thi tự đặt, ví dụ: Đề thi chính thức TOPIK II Đọc - Kỳ 64",
  "category": "reading hoặc listening",
  "level": 2,
  "questions": [
    {
      "question_number": 1,
      "question_type": "grammar_fill",
      "instructions": "Yêu cầu chung của nhóm câu hỏi, ví dụ: [1~2] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.",
      "passage": "Đoạn văn đọc hiểu hoặc kịch bản nghe nếu có",
      "question_text": "Nội dung câu hỏi tiếng Hàn",
      "options": ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"],
      "correct_option": 3,
      "explanation": "Lời dịch tiếng Việt và giải nghĩa ngữ pháp tương đương chi tiết.",
      "audio_script": "Kịch bản nghe tiếng Hàn nếu category là listening"
    }
  ]
}`;

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Hãy phân tích đề thi sau:\n\n${text}` }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DeepSeek API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content?.trim() || '';
    
    // Clean markdown code blocks if AI returned them
    if (content.startsWith('```')) {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) content = match[1].trim();
    }
    
    return JSON.parse(content);
  } catch (err) {
    console.error('❌ Lỗi trong quá trình AI phân tích văn bản:');
    console.error(err);
    process.exit(1);
  }
}

// ─── 4. LƯU VÀO SUPABASE DATABASE ─────────────────────────────────
async function saveToDatabase(parsedData) {
  console.log('💾 Đang chuẩn bị ghi dữ liệu vào cơ sở dữ liệu Supabase...');
  
  const examRecord = {
    title: parsedData.title || `Đề thi TOPIK tự động nhập ${new Date().toLocaleDateString()}`,
    category: parsedData.category || 'reading',
    level: parsedData.level || 2,
    created_by: 'admin_bulk_import'
  };

  try {
    // 1. Thêm đề thi vào topik_exams
    const { data: newExam, error: examError } = await supabase
      .from('topik_exams')
      .insert([examRecord])
      .select()
      .single();

    if (examError || !newExam) {
      throw new Error(`Không thể tạo đề thi: ${examError?.message}`);
    }

    console.log(`✅ Đã tạo đề thi thành công! ID: ${newExam.id} | Số hiệu đề: #${newExam.exam_number}`);

    // 2. Thêm các câu hỏi tương ứng
    const questionsToInsert = parsedData.questions.map(q => ({
      exam_id: newExam.id,
      question_number: Number(q.question_number) || 1,
      question_type: q.question_type || 'reading_comprehension',
      instructions: q.instructions || '',
      passage: q.passage || null,
      question_text: q.question_text || '',
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correct_option: Number(q.correct_option) || 1,
      explanation: q.explanation || null,
      audio_script: q.audio_script || null
    }));

    const { error: questionsError } = await supabase
      .from('topik_exam_questions')
      .insert(questionsToInsert);

    if (questionsError) {
      // Rollback đề thi lỗi để không tạo dữ liệu rác
      await supabase.from('topik_exams').delete().eq('id', newExam.id);
      throw new Error(`Không thể tạo câu hỏi: ${questionsError.message}`);
    }

    console.log(`🎉 HOÀN THÀNH! Đã nhập thành công ${questionsToInsert.length} câu hỏi vào đề thi "${newExam.title}"!`);
    console.log('👉 Mở ứng dụng Du Học Mate của bạn và vào tab "Luyện đề thi" để trải nghiệm ngay.');

  } catch (err) {
    console.error('❌ Lỗi khi ghi dữ liệu vào database Supabase:');
    console.error(err.message || err);
    process.exit(1);
  }
}

// ─── CHẠY TOÀN BỘ TIẾN TRÌNH ──────────────────────────────────────
async function main() {
  console.log('===================================================');
  console.log('🚀 KHỞI ĐỘNG HỆ THỐNG IMPORT ĐỀ THI TOPIK TỰ ĐỘNG');
  console.log('===================================================');
  
  const parsedData = await parseExamWithAi(rawText);
  await saveToDatabase(parsedData);
}

main();
