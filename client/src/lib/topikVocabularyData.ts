/**
 * TOPIK Master Vocabulary Dataset (Enriched with Sino-Vietnamese Hán-Việt Roots)
 * Generated automatically by local background worker.
 * Covers TOPIK 1, 2, 3, 4, 5, 6.
 */

export interface TopikVocabularyItem {
  id: string
  ko: string
  vi: string
  en: string
  level: number
  sinoVi?: string
  category: string
  pronunciation?: string
  ai_examples?: { sentence: string; meaning: string }[]
  created_at?: string
}

export const TOPIK_VOCABULARY_DATA: TopikVocabularyItem[] = [
  {
    "id": "v1-1-학생",
    "ko": "학생",
    "vi": "Học sinh",
    "en": "Student",
    "level": 1,
    "sinoVi": "Học sinh",
    "category": "academic",
    "pronunciation": "[학생]",
    "ai_examples": [
      {
        "sentence": "저는 매일 학생에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Học sinh mỗi ngày."
      },
      {
        "sentence": "오늘 학생이/가 아주 좋아요.",
        "meaning": "Hôm nay Học sinh rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 학생을/를 공부해요.",
        "meaning": "Tôi học Học sinh cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.113Z"
  },
  {
    "id": "v1-2-학교",
    "ko": "학교",
    "vi": "Trường học",
    "en": "School",
    "level": 1,
    "sinoVi": "Học hiệu",
    "category": "academic",
    "pronunciation": "[학교]",
    "ai_examples": [
      {
        "sentence": "저는 매일 학교에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Trường học mỗi ngày."
      },
      {
        "sentence": "오늘 학교이/가 아주 좋아요.",
        "meaning": "Hôm nay Trường học rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 학교을/를 공부해요.",
        "meaning": "Tôi học Trường học cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.119Z"
  },
  {
    "id": "v1-3-선생님",
    "ko": "선생님",
    "vi": "Thầy/Cô giáo",
    "en": "Teacher",
    "level": 1,
    "sinoVi": "Tiên sinh",
    "category": "academic",
    "pronunciation": "[선생님]",
    "ai_examples": [
      {
        "sentence": "저는 매일 선생님에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Thầy/Cô giáo mỗi ngày."
      },
      {
        "sentence": "오늘 선생님이/가 아주 좋아요.",
        "meaning": "Hôm nay Thầy/Cô giáo rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 선생님을/를 공부해요.",
        "meaning": "Tôi học Thầy/Cô giáo cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.119Z"
  },
  {
    "id": "v1-4-도서관",
    "ko": "도서관",
    "vi": "Thư viện",
    "en": "Library",
    "level": 1,
    "sinoVi": "Đồ thư quán",
    "category": "academic",
    "pronunciation": "[도서관]",
    "ai_examples": [
      {
        "sentence": "저는 매일 도서관에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Thư viện mỗi ngày."
      },
      {
        "sentence": "오늘 도서관이/가 아주 좋아요.",
        "meaning": "Hôm nay Thư viện rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 도서관을/를 공부해요.",
        "meaning": "Tôi học Thư viện cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.119Z"
  },
  {
    "id": "v1-5-책",
    "ko": "책",
    "vi": "Sách",
    "en": "Book",
    "level": 1,
    "category": "academic",
    "pronunciation": "[책]",
    "ai_examples": [
      {
        "sentence": "저는 매일 책에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Sách mỗi ngày."
      },
      {
        "sentence": "오늘 책이/가 아주 좋아요.",
        "meaning": "Hôm nay Sách rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 책을/를 공부해요.",
        "meaning": "Tôi học Sách cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.119Z"
  },
  {
    "id": "v1-6-공부",
    "ko": "공부",
    "vi": "Học tập",
    "en": "Study",
    "level": 1,
    "sinoVi": "Công",
    "category": "academic",
    "pronunciation": "[공부]",
    "ai_examples": [
      {
        "sentence": "저는 매일 공부에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Học tập mỗi ngày."
      },
      {
        "sentence": "오늘 공부이/가 아주 좋아요.",
        "meaning": "Hôm nay Học tập rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 공부을/를 공부해요.",
        "meaning": "Tôi học Học tập cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.119Z"
  },
  {
    "id": "v1-7-친구",
    "ko": "친구",
    "vi": "Bạn bè",
    "en": "Friend",
    "level": 1,
    "sinoVi": "Cứu",
    "category": "daily",
    "pronunciation": "[친구]",
    "ai_examples": [
      {
        "sentence": "저는 매일 친구에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Bạn bè mỗi ngày."
      },
      {
        "sentence": "오늘 친구이/가 아주 좋아요.",
        "meaning": "Hôm nay Bạn bè rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 친구을/를 공부해요.",
        "meaning": "Tôi học Bạn bè cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.119Z"
  },
  {
    "id": "v1-8-가족",
    "ko": "가족",
    "vi": "Gia đình",
    "en": "Family",
    "level": 1,
    "sinoVi": "Gia tộc",
    "category": "daily",
    "pronunciation": "[가족]",
    "ai_examples": [
      {
        "sentence": "저는 매일 가족에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Gia đình mỗi ngày."
      },
      {
        "sentence": "오늘 가족이/가 아주 좋아요.",
        "meaning": "Hôm nay Gia đình rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 가족을/를 공부해요.",
        "meaning": "Tôi học Gia đình cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.119Z"
  },
  {
    "id": "v1-9-아버지",
    "ko": "아버지",
    "vi": "Bố, Cha",
    "en": "Father",
    "level": 1,
    "sinoVi": "Địa",
    "category": "daily",
    "pronunciation": "[아버지]",
    "ai_examples": [
      {
        "sentence": "저는 매일 아버지에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Bố, Cha mỗi ngày."
      },
      {
        "sentence": "오늘 아버지이/가 아주 좋아요.",
        "meaning": "Hôm nay Bố, Cha rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 아버지을/를 공부해요.",
        "meaning": "Tôi học Bố, Cha cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.119Z"
  },
  {
    "id": "v1-10-어머니",
    "ko": "어머니",
    "vi": "Mẹ",
    "en": "Mother",
    "level": 1,
    "category": "daily",
    "pronunciation": "[어머니]",
    "ai_examples": [
      {
        "sentence": "저는 매일 어머니에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Mẹ mỗi ngày."
      },
      {
        "sentence": "오늘 어머니이/가 아주 좋아요.",
        "meaning": "Hôm nay Mẹ rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 어머니을/를 공부해요.",
        "meaning": "Tôi học Mẹ cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.119Z"
  },
  {
    "id": "v1-11-형",
    "ko": "형",
    "vi": "Anh trai (nam gọi)",
    "en": "Older brother (male speaker)",
    "level": 1,
    "category": "daily",
    "pronunciation": "[형]",
    "ai_examples": [
      {
        "sentence": "저는 매일 형에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Anh trai (nam gọi) mỗi ngày."
      },
      {
        "sentence": "오늘 형이/가 아주 좋아요.",
        "meaning": "Hôm nay Anh trai (nam gọi) rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 형을/를 공부해요.",
        "meaning": "Tôi học Anh trai (nam gọi) cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-12-누나",
    "ko": "누나",
    "vi": "Chị gái (nam gọi)",
    "en": "Older sister (male speaker)",
    "level": 1,
    "category": "daily",
    "pronunciation": "[누나]",
    "ai_examples": [
      {
        "sentence": "저는 매일 누나에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Chị gái (nam gọi) mỗi ngày."
      },
      {
        "sentence": "오늘 누나이/가 아주 좋아요.",
        "meaning": "Hôm nay Chị gái (nam gọi) rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 누나을/를 공부해요.",
        "meaning": "Tôi học Chị gái (nam gọi) cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-13-오빠",
    "ko": "오빠",
    "vi": "Anh trai (nữ gọi)",
    "en": "Older brother (female speaker)",
    "level": 1,
    "category": "daily",
    "pronunciation": "[오빠]",
    "ai_examples": [
      {
        "sentence": "저는 매일 오빠에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Anh trai (nữ gọi) mỗi ngày."
      },
      {
        "sentence": "오늘 오빠이/가 아주 좋아요.",
        "meaning": "Hôm nay Anh trai (nữ gọi) rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 오빠을/를 공부해요.",
        "meaning": "Tôi học Anh trai (nữ gọi) cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-14-언니",
    "ko": "언니",
    "vi": "Chị gái (nữ gọi)",
    "en": "Older sister (female speaker)",
    "level": 1,
    "category": "daily",
    "pronunciation": "[언니]",
    "ai_examples": [
      {
        "sentence": "저는 매일 언니에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Chị gái (nữ gọi) mỗi ngày."
      },
      {
        "sentence": "오늘 언니이/가 아주 좋아요.",
        "meaning": "Hôm nay Chị gái (nữ gọi) rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 언니을/를 공부해요.",
        "meaning": "Tôi học Chị gái (nữ gọi) cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-15-동생",
    "ko": "동생",
    "vi": "Em (em trai/em gái)",
    "en": "Younger sibling",
    "level": 1,
    "sinoVi": "Động Sinh",
    "category": "daily",
    "pronunciation": "[동생]",
    "ai_examples": [
      {
        "sentence": "저는 매일 동생에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Em (em trai/em gái) mỗi ngày."
      },
      {
        "sentence": "오늘 동생이/가 아주 좋아요.",
        "meaning": "Hôm nay Em (em trai/em gái) rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 동생을/를 공부해요.",
        "meaning": "Tôi học Em (em trai/em gái) cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-16-집",
    "ko": "집",
    "vi": "Nhà",
    "en": "House/Home",
    "level": 1,
    "category": "daily",
    "pronunciation": "[집]",
    "ai_examples": [
      {
        "sentence": "저는 매일 집에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Nhà mỗi ngày."
      },
      {
        "sentence": "오늘 집이/가 아주 좋아요.",
        "meaning": "Hôm nay Nhà rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 집을/를 공부해요.",
        "meaning": "Tôi học Nhà cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-17-방",
    "ko": "방",
    "vi": "Phòng",
    "en": "Room",
    "level": 1,
    "category": "daily",
    "pronunciation": "[방]",
    "ai_examples": [
      {
        "sentence": "저는 매일 방에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Phòng mỗi ngày."
      },
      {
        "sentence": "오늘 방이/가 아주 좋아요.",
        "meaning": "Hôm nay Phòng rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 방을/를 공부해요.",
        "meaning": "Tôi học Phòng cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-18-식당",
    "ko": "식당",
    "vi": "Nhà hàng, Quán ăn",
    "en": "Restaurant",
    "level": 1,
    "sinoVi": "Thực đường",
    "category": "daily",
    "pronunciation": "[식당]",
    "ai_examples": [
      {
        "sentence": "저는 매일 식당에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Nhà hàng, Quán ăn mỗi ngày."
      },
      {
        "sentence": "오늘 식당이/가 아주 좋아요.",
        "meaning": "Hôm nay Nhà hàng, Quán ăn rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 식당을/를 공부해요.",
        "meaning": "Tôi học Nhà hàng, Quán ăn cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-19-음식",
    "ko": "음식",
    "vi": "Thức ăn, Món ăn",
    "en": "Food",
    "level": 1,
    "sinoVi": "Ẩm thực",
    "category": "daily",
    "pronunciation": "[음식]",
    "ai_examples": [
      {
        "sentence": "저는 매일 음식에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Thức ăn, Món ăn mỗi ngày."
      },
      {
        "sentence": "오늘 음식이/가 아주 좋아요.",
        "meaning": "Hôm nay Thức ăn, Món ăn rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 음식을/를 공부해요.",
        "meaning": "Tôi học Thức ăn, Món ăn cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-20-물",
    "ko": "물",
    "vi": "Nước",
    "en": "Water",
    "level": 1,
    "sinoVi": "Vật",
    "category": "daily",
    "pronunciation": "[물]",
    "ai_examples": [
      {
        "sentence": "저는 매일 물에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Nước mỗi ngày."
      },
      {
        "sentence": "오늘 물이/가 아주 좋아요.",
        "meaning": "Hôm nay Nước rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 물을/를 공부해요.",
        "meaning": "Tôi học Nước cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-21-밥",
    "ko": "밥",
    "vi": "Cơm",
    "en": "Rice / Meal",
    "level": 1,
    "category": "daily",
    "pronunciation": "[밥]",
    "ai_examples": [
      {
        "sentence": "저는 매일 밥에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Cơm mỗi ngày."
      },
      {
        "sentence": "오늘 밥이/가 아주 좋아요.",
        "meaning": "Hôm nay Cơm rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 밥을/를 공부해요.",
        "meaning": "Tôi học Cơm cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-22-빵",
    "ko": "빵",
    "vi": "Bánh mì",
    "en": "Bread",
    "level": 1,
    "category": "daily",
    "pronunciation": "[빵]",
    "ai_examples": [
      {
        "sentence": "저는 매일 빵에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Bánh mì mỗi ngày."
      },
      {
        "sentence": "오늘 빵이/가 아주 좋아요.",
        "meaning": "Hôm nay Bánh mì rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 빵을/를 공부해요.",
        "meaning": "Tôi học Bánh mì cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-23-우유",
    "ko": "우유",
    "vi": "Sữa",
    "en": "Milk",
    "level": 1,
    "category": "daily",
    "pronunciation": "[우유]",
    "ai_examples": [
      {
        "sentence": "저는 매일 우유에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Sữa mỗi ngày."
      },
      {
        "sentence": "오늘 우유이/가 아주 좋아요.",
        "meaning": "Hôm nay Sữa rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 우유을/를 공부해요.",
        "meaning": "Tôi học Sữa cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-24-커피",
    "ko": "커피",
    "vi": "Cà phê",
    "en": "Coffee",
    "level": 1,
    "category": "daily",
    "pronunciation": "[커피]",
    "ai_examples": [
      {
        "sentence": "저는 매일 커피에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Cà phê mỗi ngày."
      },
      {
        "sentence": "오늘 커피이/가 아주 좋아요.",
        "meaning": "Hôm nay Cà phê rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 커피을/를 공부해요.",
        "meaning": "Tôi học Cà phê cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-25-사과",
    "ko": "사과",
    "vi": "Quả táo",
    "en": "Apple",
    "level": 1,
    "sinoVi": "Sư",
    "category": "daily",
    "pronunciation": "[사과]",
    "ai_examples": [
      {
        "sentence": "저는 매일 사과에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Quả táo mỗi ngày."
      },
      {
        "sentence": "오늘 사과이/가 아주 좋아요.",
        "meaning": "Hôm nay Quả táo rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 사과을/를 공부해요.",
        "meaning": "Tôi học Quả táo cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-26-시계",
    "ko": "시계",
    "vi": "Đồng hồ",
    "en": "Watch / Clock",
    "level": 1,
    "sinoVi": "Thị Kế",
    "category": "daily",
    "pronunciation": "[시계]",
    "ai_examples": [
      {
        "sentence": "저는 매일 시계에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Đồng hồ mỗi ngày."
      },
      {
        "sentence": "오늘 시계이/가 아주 좋아요.",
        "meaning": "Hôm nay Đồng hồ rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 시계을/를 공부해요.",
        "meaning": "Tôi học Đồng hồ cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-27-전화",
    "ko": "전화",
    "vi": "Điện thoại",
    "en": "Phone",
    "level": 1,
    "sinoVi": "Điện Hóa",
    "category": "daily",
    "pronunciation": "[전화]",
    "ai_examples": [
      {
        "sentence": "저는 매일 전화에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Điện thoại mỗi ngày."
      },
      {
        "sentence": "오늘 전화이/가 아주 좋아요.",
        "meaning": "Hôm nay Điện thoại rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 전화을/를 공부해요.",
        "meaning": "Tôi học Điện thoại cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-28-컴퓨터",
    "ko": "컴퓨터",
    "vi": "Máy tính",
    "en": "Computer",
    "level": 1,
    "category": "daily",
    "pronunciation": "[컴퓨터]",
    "ai_examples": [
      {
        "sentence": "저는 매일 컴퓨터에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Máy tính mỗi ngày."
      },
      {
        "sentence": "오늘 컴퓨터이/가 아주 좋아요.",
        "meaning": "Hôm nay Máy tính rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 컴퓨터을/를 공부해요.",
        "meaning": "Tôi học Máy tính cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-29-옷",
    "ko": "옷",
    "vi": "Quần áo",
    "en": "Clothes",
    "level": 1,
    "category": "shopping",
    "pronunciation": "[옷]",
    "ai_examples": [
      {
        "sentence": "저는 매일 옷에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Quần áo mỗi ngày."
      },
      {
        "sentence": "오늘 옷이/가 아주 좋아요.",
        "meaning": "Hôm nay Quần áo rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 옷을/를 공부해요.",
        "meaning": "Tôi học Quần áo cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-30-신발",
    "ko": "신발",
    "vi": "Giày dép",
    "en": "Shoes",
    "level": 1,
    "category": "shopping",
    "pronunciation": "[신발]",
    "ai_examples": [
      {
        "sentence": "저는 매일 신발에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Giày dép mỗi ngày."
      },
      {
        "sentence": "오늘 신발이/가 아주 좋아요.",
        "meaning": "Hôm nay Giày dép rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 신발을/를 공부해요.",
        "meaning": "Tôi học Giày dép cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-31-가방",
    "ko": "가방",
    "vi": "Cặp, Túi xách",
    "en": "Bag",
    "level": 1,
    "sinoVi": "Gia",
    "category": "shopping",
    "pronunciation": "[가방]",
    "ai_examples": [
      {
        "sentence": "저는 매일 가방에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Cặp, Túi xách mỗi ngày."
      },
      {
        "sentence": "오늘 가방이/가 아주 좋아요.",
        "meaning": "Hôm nay Cặp, Túi xách rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 가방을/를 공부해요.",
        "meaning": "Tôi học Cặp, Túi xách cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-32-돈",
    "ko": "돈",
    "vi": "Tiền",
    "en": "Money",
    "level": 1,
    "category": "shopping",
    "pronunciation": "[돈]",
    "ai_examples": [
      {
        "sentence": "저는 매일 돈에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Tiền mỗi ngày."
      },
      {
        "sentence": "오늘 돈이/가 아주 좋아요.",
        "meaning": "Hôm nay Tiền rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 돈을/를 공부해요.",
        "meaning": "Tôi học Tiền cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-33-시장",
    "ko": "시장",
    "vi": "Chợ",
    "en": "Market",
    "level": 1,
    "sinoVi": "Thị Trường",
    "category": "shopping",
    "pronunciation": "[시장]",
    "ai_examples": [
      {
        "sentence": "저는 매일 시장에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Chợ mỗi ngày."
      },
      {
        "sentence": "오늘 시장이/가 아주 좋아요.",
        "meaning": "Hôm nay Chợ rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 시장을/를 공부해요.",
        "meaning": "Tôi học Chợ cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-34-마트",
    "ko": "마트",
    "vi": "Siêu thị",
    "en": "Mart",
    "level": 1,
    "category": "shopping",
    "pronunciation": "[마트]",
    "ai_examples": [
      {
        "sentence": "저는 매일 마트에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Siêu thị mỗi ngày."
      },
      {
        "sentence": "오늘 마트이/가 아주 좋아요.",
        "meaning": "Hôm nay Siêu thị rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 마트을/를 공부해요.",
        "meaning": "Tôi học Siêu thị cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-35-병원",
    "ko": "병원",
    "vi": "Bệnh viện",
    "en": "Hospital",
    "level": 1,
    "sinoVi": "Bệnh viện",
    "category": "hospital",
    "pronunciation": "[병원]",
    "ai_examples": [
      {
        "sentence": "저는 매일 병원에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Bệnh viện mỗi ngày."
      },
      {
        "sentence": "오늘 병원이/가 아주 좋아요.",
        "meaning": "Hôm nay Bệnh viện rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 병원을/를 공부해요.",
        "meaning": "Tôi học Bệnh viện cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-36-약국",
    "ko": "약국",
    "vi": "Tiệm thuốc",
    "en": "Pharmacy",
    "level": 1,
    "sinoVi": "Dược cục",
    "category": "hospital",
    "pronunciation": "[약국]",
    "ai_examples": [
      {
        "sentence": "저는 매일 약국에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Tiệm thuốc mỗi ngày."
      },
      {
        "sentence": "오늘 약국이/가 아주 좋아요.",
        "meaning": "Hôm nay Tiệm thuốc rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 약국을/를 공부해요.",
        "meaning": "Tôi học Tiệm thuốc cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-37-의사",
    "ko": "의사",
    "vi": "Bác sĩ",
    "en": "Doctor",
    "level": 1,
    "sinoVi": "Y sư",
    "category": "hospital",
    "pronunciation": "[의사]",
    "ai_examples": [
      {
        "sentence": "저는 매일 의사에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Bác sĩ mỗi ngày."
      },
      {
        "sentence": "오늘 의사이/가 아주 좋아요.",
        "meaning": "Hôm nay Bác sĩ rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 의사을/를 공부해요.",
        "meaning": "Tôi học Bác sĩ cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-38-약",
    "ko": "약",
    "vi": "Thuốc",
    "en": "Medicine",
    "level": 1,
    "sinoVi": "Dược",
    "category": "hospital",
    "pronunciation": "[약]",
    "ai_examples": [
      {
        "sentence": "저는 매일 약에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Thuốc mỗi ngày."
      },
      {
        "sentence": "오늘 약이/가 아주 좋아요.",
        "meaning": "Hôm nay Thuốc rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 약을/를 공부해요.",
        "meaning": "Tôi học Thuốc cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-39-버스",
    "ko": "버스",
    "vi": "Xe buýt",
    "en": "Bus",
    "level": 1,
    "sinoVi": "Xa buýt",
    "category": "travel",
    "pronunciation": "[버스]",
    "ai_examples": [
      {
        "sentence": "저는 매일 버스에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Xe buýt mỗi ngày."
      },
      {
        "sentence": "오늘 버스이/가 아주 좋아요.",
        "meaning": "Hôm nay Xe buýt rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 버스을/를 공부해요.",
        "meaning": "Tôi học Xe buýt cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-40-지하철",
    "ko": "지하철",
    "vi": "Tàu điện ngầm",
    "en": "Subway",
    "level": 1,
    "sinoVi": "Địa hạ thiết",
    "category": "travel",
    "pronunciation": "[지하철]",
    "ai_examples": [
      {
        "sentence": "저는 매일 지하철에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Tàu điện ngầm mỗi ngày."
      },
      {
        "sentence": "오늘 지하철이/가 아주 좋아요.",
        "meaning": "Hôm nay Tàu điện ngầm rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 지하철을/를 공부해요.",
        "meaning": "Tôi học Tàu điện ngầm cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-41-택시",
    "ko": "택시",
    "vi": "Xe taxi",
    "en": "Taxi",
    "level": 1,
    "sinoVi": "Đặc tây",
    "category": "travel",
    "pronunciation": "[택시]",
    "ai_examples": [
      {
        "sentence": "저는 매일 택시에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Xe taxi mỗi ngày."
      },
      {
        "sentence": "오늘 택시이/가 아주 좋아요.",
        "meaning": "Hôm nay Xe taxi rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 택시을/를 공부해요.",
        "meaning": "Tôi học Xe taxi cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-42-비행기",
    "ko": "비행기",
    "vi": "Máy bay",
    "en": "Airplane",
    "level": 1,
    "sinoVi": "Phi hành cơ",
    "category": "travel",
    "pronunciation": "[비행기]",
    "ai_examples": [
      {
        "sentence": "저는 매일 비행기에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Máy bay mỗi ngày."
      },
      {
        "sentence": "오늘 비행기이/가 아주 좋아요.",
        "meaning": "Hôm nay Máy bay rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 비행기을/를 공부해요.",
        "meaning": "Tôi học Máy bay cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-43-공항",
    "ko": "공항",
    "vi": "Sân bay",
    "en": "Airport",
    "level": 1,
    "sinoVi": "Không cảng",
    "category": "travel",
    "pronunciation": "[공항]",
    "ai_examples": [
      {
        "sentence": "저는 매일 공항에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Sân bay mỗi ngày."
      },
      {
        "sentence": "오늘 공항이/가 아주 좋아요.",
        "meaning": "Hôm nay Sân bay rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 공항을/를 공부해요.",
        "meaning": "Tôi học Sân bay cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-44-한국",
    "ko": "한국",
    "vi": "Hàn Quốc",
    "en": "Korea",
    "level": 1,
    "sinoVi": "Cục",
    "category": "travel",
    "pronunciation": "[한국]",
    "ai_examples": [
      {
        "sentence": "저는 매일 한국에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Hàn Quốc mỗi ngày."
      },
      {
        "sentence": "오늘 한국이/가 아주 좋아요.",
        "meaning": "Hôm nay Hàn Quốc rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 한국을/를 공부해요.",
        "meaning": "Tôi học Hàn Quốc cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-45-베트남",
    "ko": "베트남",
    "vi": "Việt Nam",
    "en": "Vietnam",
    "level": 1,
    "category": "travel",
    "pronunciation": "[베트남]",
    "ai_examples": [
      {
        "sentence": "저는 매일 베트남에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Việt Nam mỗi ngày."
      },
      {
        "sentence": "오늘 베트남이/가 아주 좋아요.",
        "meaning": "Hôm nay Việt Nam rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 베트남을/를 공부해요.",
        "meaning": "Tôi học Việt Nam cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-46-오늘",
    "ko": "오늘",
    "vi": "Hôm nay",
    "en": "Today",
    "level": 1,
    "category": "daily",
    "pronunciation": "[오늘]",
    "ai_examples": [
      {
        "sentence": "저는 매일 오늘에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Hôm nay mỗi ngày."
      },
      {
        "sentence": "오늘 오늘이/가 아주 좋아요.",
        "meaning": "Hôm nay Hôm nay rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 오늘을/를 공부해요.",
        "meaning": "Tôi học Hôm nay cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-47-어제",
    "ko": "어제",
    "vi": "Hôm qua",
    "en": "Yesterday",
    "level": 1,
    "sinoVi": "Tế",
    "category": "daily",
    "pronunciation": "[어제]",
    "ai_examples": [
      {
        "sentence": "저는 매일 어제에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Hôm qua mỗi ngày."
      },
      {
        "sentence": "오늘 어제이/가 아주 좋아요.",
        "meaning": "Hôm nay Hôm qua rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 어제을/를 공부해요.",
        "meaning": "Tôi học Hôm qua cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-48-내일",
    "ko": "내일",
    "vi": "Ngày mai",
    "en": "Tomorrow",
    "level": 1,
    "category": "daily",
    "pronunciation": "[내일]",
    "ai_examples": [
      {
        "sentence": "저는 매일 내일에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Ngày mai mỗi ngày."
      },
      {
        "sentence": "오늘 내일이/가 아주 좋아요.",
        "meaning": "Hôm nay Ngày mai rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 내일을/를 공부해요.",
        "meaning": "Tôi học Ngày mai cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-49-주말",
    "ko": "주말",
    "vi": "Cuối tuần",
    "en": "Weekend",
    "level": 1,
    "category": "daily",
    "pronunciation": "[주말]",
    "ai_examples": [
      {
        "sentence": "저는 매일 주말에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Cuối tuần mỗi ngày."
      },
      {
        "sentence": "오늘 주말이/가 아주 좋아요.",
        "meaning": "Hôm nay Cuối tuần rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 주말을/를 공부해요.",
        "meaning": "Tôi học Cuối tuần cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-50-시간",
    "ko": "시간",
    "vi": "Thời gian / Giờ",
    "en": "Time / Hour",
    "level": 1,
    "sinoVi": "Thị",
    "category": "daily",
    "pronunciation": "[시간]",
    "ai_examples": [
      {
        "sentence": "저는 매일 시간에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Thời gian / Giờ mỗi ngày."
      },
      {
        "sentence": "오늘 시간이/가 아주 좋아요.",
        "meaning": "Hôm nay Thời gian / Giờ rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 시간을/를 공부해요.",
        "meaning": "Tôi học Thời gian / Giờ cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-51-모자",
    "ko": "모자",
    "vi": "Mũ, Nón",
    "en": "Hat / Cap",
    "level": 1,
    "sinoVi": "Tự",
    "category": "shopping",
    "pronunciation": "[모자]",
    "ai_examples": [
      {
        "sentence": "저는 매일 모자에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Mũ, Nón mỗi ngày."
      },
      {
        "sentence": "오늘 모자이/가 아주 좋아요.",
        "meaning": "Hôm nay Mũ, Nón rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 모자을/를 공부해요.",
        "meaning": "Tôi học Mũ, Nón cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-52-우산",
    "ko": "우산",
    "vi": "Cái ô, Dù",
    "en": "Umbrella",
    "level": 1,
    "sinoVi": "Sơn",
    "category": "daily",
    "pronunciation": "[우산]",
    "ai_examples": [
      {
        "sentence": "저는 매일 우산에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Cái ô, Dù mỗi ngày."
      },
      {
        "sentence": "오늘 우산이/가 아주 좋아요.",
        "meaning": "Hôm nay Cái ô, Dù rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 우산을/를 공부해요.",
        "meaning": "Tôi học Cái ô, Dù cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-53-볼펜",
    "ko": "볼펜",
    "vi": "Bút bi",
    "en": "Pen",
    "level": 1,
    "category": "academic",
    "pronunciation": "[볼펜]",
    "ai_examples": [
      {
        "sentence": "저는 매일 볼펜에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Bút bi mỗi ngày."
      },
      {
        "sentence": "오늘 볼펜이/가 아주 좋아요.",
        "meaning": "Hôm nay Bút bi rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 볼펜을/를 공부해요.",
        "meaning": "Tôi học Bút bi cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-54-연필",
    "ko": "연필",
    "vi": "Bút chì",
    "en": "Pencil",
    "level": 1,
    "sinoVi": "Nghiên",
    "category": "academic",
    "pronunciation": "[연필]",
    "ai_examples": [
      {
        "sentence": "저는 매일 연필에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Bút chì mỗi ngày."
      },
      {
        "sentence": "오늘 연필이/가 아주 좋아요.",
        "meaning": "Hôm nay Bút chì rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 연필을/를 공부해요.",
        "meaning": "Tôi học Bút chì cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-55-지우개",
    "ko": "지우개",
    "vi": "Cục tẩy",
    "en": "Eraser",
    "level": 1,
    "sinoVi": "Địa",
    "category": "academic",
    "pronunciation": "[지우개]",
    "ai_examples": [
      {
        "sentence": "저는 매일 지우개에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Cục tẩy mỗi ngày."
      },
      {
        "sentence": "오늘 지우개이/가 아주 좋아요.",
        "meaning": "Hôm nay Cục tẩy rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 지우개을/를 공부해요.",
        "meaning": "Tôi học Cục tẩy cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-56-공책",
    "ko": "공책",
    "vi": "Vở ghi",
    "en": "Notebook",
    "level": 1,
    "sinoVi": "Công",
    "category": "academic",
    "pronunciation": "[공책]",
    "ai_examples": [
      {
        "sentence": "저는 매일 공책에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Vở ghi mỗi ngày."
      },
      {
        "sentence": "오늘 공책이/가 아주 좋아요.",
        "meaning": "Hôm nay Vở ghi rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 공책을/를 공부해요.",
        "meaning": "Tôi học Vở ghi cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-57-책상",
    "ko": "책상",
    "vi": "Bàn học",
    "en": "Desk",
    "level": 1,
    "category": "academic",
    "pronunciation": "[책상]",
    "ai_examples": [
      {
        "sentence": "저는 매일 책상에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Bàn học mỗi ngày."
      },
      {
        "sentence": "오늘 책상이/가 아주 좋아요.",
        "meaning": "Hôm nay Bàn học rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 책상을/를 공부해요.",
        "meaning": "Tôi học Bàn học cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-58-의자",
    "ko": "의자",
    "vi": "Cái ghế",
    "en": "Chair",
    "level": 1,
    "sinoVi": "Y Tự",
    "category": "academic",
    "pronunciation": "[의자]",
    "ai_examples": [
      {
        "sentence": "저는 매일 의자에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Cái ghế mỗi ngày."
      },
      {
        "sentence": "오늘 의자이/가 아주 좋아요.",
        "meaning": "Hôm nay Cái ghế rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 의자을/를 공부해요.",
        "meaning": "Tôi học Cái ghế cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-59-문",
    "ko": "문",
    "vi": "Cửa ra vào",
    "en": "Door",
    "level": 1,
    "sinoVi": "Môn",
    "category": "daily",
    "pronunciation": "[문]",
    "ai_examples": [
      {
        "sentence": "저는 매일 문에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Cửa ra vào mỗi ngày."
      },
      {
        "sentence": "오늘 문이/가 아주 좋아요.",
        "meaning": "Hôm nay Cửa ra vào rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 문을/를 공부해요.",
        "meaning": "Tôi học Cửa ra vào cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-60-창문",
    "ko": "창문",
    "vi": "Cửa sổ",
    "en": "Window",
    "level": 1,
    "sinoVi": "Môn",
    "category": "daily",
    "pronunciation": "[창문]",
    "ai_examples": [
      {
        "sentence": "저는 매일 창문에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Cửa sổ mỗi ngày."
      },
      {
        "sentence": "오늘 창문이/가 아주 좋아요.",
        "meaning": "Hôm nay Cửa sổ rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 창문을/를 공부해요.",
        "meaning": "Tôi học Cửa sổ cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-61-안경",
    "ko": "안경",
    "vi": "Kính mắt",
    "en": "Glasses",
    "level": 1,
    "sinoVi": "Kinh",
    "category": "daily",
    "pronunciation": "[안경]",
    "ai_examples": [
      {
        "sentence": "저는 매일 안경에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Kính mắt mỗi ngày."
      },
      {
        "sentence": "오늘 안경이/가 아주 좋아요.",
        "meaning": "Hôm nay Kính mắt rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 안경을/를 공부해요.",
        "meaning": "Tôi học Kính mắt cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-62-거울",
    "ko": "거울",
    "vi": "Cái gương",
    "en": "Mirror",
    "level": 1,
    "category": "daily",
    "pronunciation": "[거울]",
    "ai_examples": [
      {
        "sentence": "저는 매일 거울에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Cái gương mỗi ngày."
      },
      {
        "sentence": "오늘 거울이/가 아주 좋아요.",
        "meaning": "Hôm nay Cái gương rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 거울을/를 공부해요.",
        "meaning": "Tôi học Cái gương cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-63-휴지",
    "ko": "휴지",
    "vi": "Giấy vệ sinh / Giấy ăn",
    "en": "Tissue",
    "level": 1,
    "sinoVi": "Địa",
    "category": "daily",
    "pronunciation": "[휴지]",
    "ai_examples": [
      {
        "sentence": "저는 매일 휴지에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Giấy vệ sinh / Giấy ăn mỗi ngày."
      },
      {
        "sentence": "오늘 휴지이/가 아주 좋아요.",
        "meaning": "Hôm nay Giấy vệ sinh / Giấy ăn rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 휴지을/를 공부해요.",
        "meaning": "Tôi học Giấy vệ sinh / Giấy ăn cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v1-64-비누",
    "ko": "비누",
    "vi": "Xà phòng",
    "en": "Soap",
    "level": 1,
    "category": "daily",
    "pronunciation": "[비누]",
    "ai_examples": [
      {
        "sentence": "저는 매일 비누에/을/를 이용해요.",
        "meaning": "Tôi dùng/đến Xà phòng mỗi ngày."
      },
      {
        "sentence": "오늘 비누이/가 아주 좋아요.",
        "meaning": "Hôm nay Xà phòng rất tốt/đẹp."
      },
      {
        "sentence": "친구하고 같이 비누을/를 공부해요.",
        "meaning": "Tôi học Xà phòng cùng với bạn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-65-대학교",
    "ko": "대학교",
    "vi": "Trường đại học",
    "en": "University",
    "level": 2,
    "sinoVi": "Đại học hiệu",
    "category": "academic",
    "pronunciation": "[대학교]",
    "ai_examples": [
      {
        "sentence": "내일에 대학교을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Trường đại học."
      },
      {
        "sentence": "한국에서 대학교을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Trường đại học ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-66-전공",
    "ko": "전공",
    "vi": "Chuyên ngành",
    "en": "Major",
    "level": 2,
    "sinoVi": "Chuyên công",
    "category": "academic",
    "pronunciation": "[전공]",
    "ai_examples": [
      {
        "sentence": "내일에 전공을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Chuyên ngành."
      },
      {
        "sentence": "한국에서 전공을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Chuyên ngành ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-67-수업",
    "ko": "수업",
    "vi": "Giờ học, Bài học",
    "en": "Class / Lesson",
    "level": 2,
    "sinoVi": "Thụ nghiệp",
    "category": "academic",
    "pronunciation": "[수업]",
    "ai_examples": [
      {
        "sentence": "내일에 수업을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Giờ học, Bài học."
      },
      {
        "sentence": "한국에서 수업을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Giờ học, Bài học ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-68-시험",
    "ko": "시험",
    "vi": "Kỳ thi, Bài kiểm tra",
    "en": "Exam / Test",
    "level": 2,
    "sinoVi": "Thí nghiệm",
    "category": "academic",
    "pronunciation": "[시험]",
    "ai_examples": [
      {
        "sentence": "내일에 시험을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Kỳ thi, Bài kiểm tra."
      },
      {
        "sentence": "한국에서 시험을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Kỳ thi, Bài kiểm tra ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-69-성적",
    "ko": "성적",
    "vi": "Thành tích, Điểm số",
    "en": "Grades / Score",
    "level": 2,
    "sinoVi": "Thành tích",
    "category": "academic",
    "pronunciation": "[성적]",
    "ai_examples": [
      {
        "sentence": "내일에 성적을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Thành tích, Điểm số."
      },
      {
        "sentence": "한국에서 성적을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Thành tích, Điểm số ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-70-숙제",
    "ko": "숙제",
    "vi": "Bài tập về nhà",
    "en": "Homework",
    "level": 2,
    "sinoVi": "Túc đề",
    "category": "academic",
    "pronunciation": "[숙제]",
    "ai_examples": [
      {
        "sentence": "내일에 숙제을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Bài tập về nhà."
      },
      {
        "sentence": "한국에서 숙제을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Bài tập về nhà ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-71-방학",
    "ko": "방학",
    "vi": "Kỳ nghỉ hè/đông",
    "en": "Vacation (school)",
    "level": 2,
    "sinoVi": "Học",
    "category": "academic",
    "pronunciation": "[방학]",
    "ai_examples": [
      {
        "sentence": "내일에 방학을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Kỳ nghỉ hè/đông."
      },
      {
        "sentence": "한국에서 방학을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Kỳ nghỉ hè/đông ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-72-장학금",
    "ko": "장학금",
    "vi": "Học bổng",
    "en": "Scholarship",
    "level": 2,
    "sinoVi": "Tưởng học kim",
    "category": "academic",
    "pronunciation": "[장학금]",
    "ai_examples": [
      {
        "sentence": "내일에 장학금을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Học bổng."
      },
      {
        "sentence": "한국에서 장학금을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Học bổng ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-73-은행",
    "ko": "은행",
    "vi": "Ngân hàng",
    "en": "Bank",
    "level": 2,
    "sinoVi": "Ngân hàng",
    "category": "work",
    "pronunciation": "[은행]",
    "ai_examples": [
      {
        "sentence": "내일에 은행을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Ngân hàng."
      },
      {
        "sentence": "한국에서 은행을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Ngân hàng ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-74-통장",
    "ko": "통장",
    "vi": "Sổ tài khoản",
    "en": "Bankbook",
    "level": 2,
    "sinoVi": "Thông trướng",
    "category": "work",
    "pronunciation": "[통장]",
    "ai_examples": [
      {
        "sentence": "내일에 통장을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Sổ tài khoản."
      },
      {
        "sentence": "한국에서 통장을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Sổ tài khoản ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-75-비밀번호",
    "ko": "비밀번호",
    "vi": "Mật khẩu",
    "en": "Password / PIN",
    "level": 2,
    "sinoVi": "Bí mật phiên hiệu",
    "category": "work",
    "pronunciation": "[비밀번호]",
    "ai_examples": [
      {
        "sentence": "내일에 비밀번호을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Mật khẩu."
      },
      {
        "sentence": "한국에서 비밀번호을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Mật khẩu ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-76-카카오톡",
    "ko": "카카오톡",
    "vi": "Ứng dụng KakaoTalk",
    "en": "KakaoTalk",
    "level": 2,
    "category": "daily",
    "pronunciation": "[카카오톡]",
    "ai_examples": [
      {
        "sentence": "내일에 카카오톡을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Ứng dụng KakaoTalk."
      },
      {
        "sentence": "한국에서 카카오톡을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Ứng dụng KakaoTalk ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-77-편의점",
    "ko": "편의점",
    "vi": "Cửa hàng tiện lợi",
    "en": "Convenience store",
    "level": 2,
    "sinoVi": "Y Điếm",
    "category": "shopping",
    "pronunciation": "[편의점]",
    "ai_examples": [
      {
        "sentence": "내일에 편의점을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Cửa hàng tiện lợi."
      },
      {
        "sentence": "한국에서 편의점을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Cửa hàng tiện lợi ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-78-아르바이트",
    "ko": "아르바이트",
    "vi": "Việc làm thêm (Part-time)",
    "en": "Part-time job",
    "level": 2,
    "category": "work",
    "pronunciation": "[아르바이트]",
    "ai_examples": [
      {
        "sentence": "내일에 아르바이트을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Việc làm thêm (Part-time)."
      },
      {
        "sentence": "한국에서 아르바이트을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Việc làm thêm (Part-time) ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-79-월세",
    "ko": "월세",
    "vi": "Tiền thuê nhà theo tháng",
    "en": "Monthly rent",
    "level": 2,
    "category": "daily",
    "pronunciation": "[월세]",
    "ai_examples": [
      {
        "sentence": "내일에 월세을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Tiền thuê nhà theo tháng."
      },
      {
        "sentence": "한국에서 월세을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Tiền thuê nhà theo tháng ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-80-보증금",
    "ko": "보증금",
    "vi": "Tiền đặt cọc nhà",
    "en": "Deposit money",
    "level": 2,
    "category": "daily",
    "pronunciation": "[보증금]",
    "ai_examples": [
      {
        "sentence": "내일에 보증금을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Tiền đặt cọc nhà."
      },
      {
        "sentence": "한국에서 보증금을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Tiền đặt cọc nhà ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-81-원룸",
    "ko": "원룸",
    "vi": "Phòng khép kín (One-room)",
    "en": "Studio apartment",
    "level": 2,
    "sinoVi": "Viện",
    "category": "daily",
    "pronunciation": "[원룸]",
    "ai_examples": [
      {
        "sentence": "내일에 원룸을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Phòng khép kín (One-room)."
      },
      {
        "sentence": "한국에서 원룸을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Phòng khép kín (One-room) ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-82-기숙사",
    "ko": "기숙사",
    "vi": "Ký túc xá",
    "en": "Dormitory",
    "level": 2,
    "sinoVi": "Kế Sư",
    "category": "academic",
    "pronunciation": "[기숙사]",
    "ai_examples": [
      {
        "sentence": "내일에 기숙사을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Ký túc xá."
      },
      {
        "sentence": "한국에서 기숙사을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Ký túc xá ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-83-외국인등록증",
    "ko": "외국인등록증",
    "vi": "Thẻ cư trú người nước ngoài",
    "en": "Alien Registration Card",
    "level": 2,
    "sinoVi": "Cục Nhân",
    "category": "work",
    "pronunciation": "[외국인등록증]",
    "ai_examples": [
      {
        "sentence": "내일에 외국인등록증을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Thẻ cư trú người nước ngoài."
      },
      {
        "sentence": "한국에서 외국인등록증을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Thẻ cư trú người nước ngoài ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-84-여권",
    "ko": "여권",
    "vi": "Hộ chiếu",
    "en": "Passport",
    "level": 2,
    "category": "travel",
    "pronunciation": "[여권]",
    "ai_examples": [
      {
        "sentence": "내일에 여권을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Hộ chiếu."
      },
      {
        "sentence": "한국에서 여권을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Hộ chiếu ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-85-비자",
    "ko": "비자",
    "vi": "Thị thực (Visa)",
    "en": "Visa",
    "level": 2,
    "sinoVi": "Tự",
    "category": "travel",
    "pronunciation": "[비자]",
    "ai_examples": [
      {
        "sentence": "내일에 비자을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Thị thực (Visa)."
      },
      {
        "sentence": "한국에서 비자을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Thị thực (Visa) ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-86-취업",
    "ko": "취업",
    "vi": "Xin việc, Tìm việc",
    "en": "Employment",
    "level": 2,
    "category": "work",
    "pronunciation": "[취업]",
    "ai_examples": [
      {
        "sentence": "내일에 취업을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Xin việc, Tìm việc."
      },
      {
        "sentence": "한국에서 취업을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Xin việc, Tìm việc ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-87-회사원",
    "ko": "회사원",
    "vi": "Nhân viên công ty",
    "en": "Office worker",
    "level": 2,
    "sinoVi": "Sư Viện",
    "category": "work",
    "pronunciation": "[회사원]",
    "ai_examples": [
      {
        "sentence": "내일에 회사원을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Nhân viên công ty."
      },
      {
        "sentence": "한국에서 회사원을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Nhân viên công ty ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-88-월급",
    "ko": "월급",
    "vi": "Lương hàng tháng",
    "en": "Monthly salary",
    "level": 2,
    "sinoVi": "Nguyệt cấp",
    "category": "work",
    "pronunciation": "[월급]",
    "ai_examples": [
      {
        "sentence": "내일에 월급을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Lương hàng tháng."
      },
      {
        "sentence": "한국에서 월급을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Lương hàng tháng ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-89-휴가",
    "ko": "휴가",
    "vi": "Kỳ nghỉ làm",
    "en": "Leave / Holiday",
    "level": 2,
    "sinoVi": "Hưu hạ",
    "category": "work",
    "pronunciation": "[휴가]",
    "ai_examples": [
      {
        "sentence": "내일에 휴가을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Kỳ nghỉ làm."
      },
      {
        "sentence": "한국에서 휴가을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Kỳ nghỉ làm ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-90-출근",
    "ko": "출근",
    "vi": "Đi làm",
    "en": "Going to work",
    "level": 2,
    "sinoVi": "Xuất cần",
    "category": "work",
    "pronunciation": "[출근]",
    "ai_examples": [
      {
        "sentence": "내일에 출근을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Đi làm."
      },
      {
        "sentence": "한국에서 출근을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Đi làm ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-91-퇴근",
    "ko": "퇴근",
    "vi": "Tan làm",
    "en": "Leaving work",
    "level": 2,
    "sinoVi": "Thối cần",
    "category": "work",
    "pronunciation": "[퇴근]",
    "ai_examples": [
      {
        "sentence": "내일에 퇴근을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Tan làm."
      },
      {
        "sentence": "한국에서 퇴근을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Tan làm ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-92-야근",
    "ko": "야근",
    "vi": "Làm tăng ca đêm",
    "en": "Night overtime",
    "level": 2,
    "sinoVi": "Dạ cần",
    "category": "work",
    "pronunciation": "[야근]",
    "ai_examples": [
      {
        "sentence": "내일에 야근을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Làm tăng ca đêm."
      },
      {
        "sentence": "한국에서 야근을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Làm tăng ca đêm ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-93-간호사",
    "ko": "간호사",
    "vi": "Y tá, Cán hộ sư",
    "en": "Nurse",
    "level": 2,
    "sinoVi": "Cán hộ sư",
    "category": "hospital",
    "pronunciation": "[간호사]",
    "ai_examples": [
      {
        "sentence": "내일에 간호사을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Y tá, Cán hộ sư."
      },
      {
        "sentence": "한국에서 간호사을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Y tá, Cán hộ sư ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-94-감기",
    "ko": "감기",
    "vi": "Bệnh cảm cúm",
    "en": "Cold / Flu",
    "level": 2,
    "sinoVi": "Kế",
    "category": "hospital",
    "pronunciation": "[감기]",
    "ai_examples": [
      {
        "sentence": "내일에 감기을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Bệnh cảm cúm."
      },
      {
        "sentence": "한국에서 감기을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Bệnh cảm cúm ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-95-열",
    "ko": "열",
    "vi": "Sốt",
    "en": "Fever",
    "level": 2,
    "category": "hospital",
    "pronunciation": "[열]",
    "ai_examples": [
      {
        "sentence": "내일에 열을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Sốt."
      },
      {
        "sentence": "한국에서 열을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Sốt ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-96-기침",
    "ko": "기침",
    "vi": "Ho",
    "en": "Cough",
    "level": 2,
    "sinoVi": "Kế",
    "category": "hospital",
    "pronunciation": "[기침]",
    "ai_examples": [
      {
        "sentence": "내일에 기침을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Ho."
      },
      {
        "sentence": "한국에서 기침을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Ho ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-97-주사",
    "ko": "주사",
    "vi": "Tiêm thuốc",
    "en": "Injection",
    "level": 2,
    "sinoVi": "Chú xạ",
    "category": "hospital",
    "pronunciation": "[주사]",
    "ai_examples": [
      {
        "sentence": "내일에 주사을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Tiêm thuốc."
      },
      {
        "sentence": "한국에서 주사을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Tiêm thuốc ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-98-처방전",
    "ko": "처방전",
    "vi": "Đơn thuốc",
    "en": "Prescription",
    "level": 2,
    "sinoVi": "Điện",
    "category": "hospital",
    "pronunciation": "[처방전]",
    "ai_examples": [
      {
        "sentence": "내일에 처방전을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Đơn thuốc."
      },
      {
        "sentence": "한국에서 처방전을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Đơn thuốc ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v2-99-예약",
    "ko": "예약",
    "vi": "Đặt trước (vấn/phòng)",
    "en": "Reservation",
    "level": 2,
    "sinoVi": "Dự ước",
    "category": "daily",
    "pronunciation": "[예약]",
    "ai_examples": [
      {
        "sentence": "내일에 예약을/를 준비해야 해요.",
        "meaning": "Ngày mai tôi phải chuẩn bị Đặt trước (vấn/phòng)."
      },
      {
        "sentence": "한국에서 예약을/를 신청했어요.",
        "meaning": "Tôi đã đăng ký Đặt trước (vấn/phòng) ở Hàn Quốc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-100-수강신청",
    "ko": "수강신청",
    "vi": "Đăng ký môn học",
    "en": "Course registration",
    "level": 3,
    "sinoVi": "Thủy",
    "category": "academic",
    "pronunciation": "[수강신청]",
    "ai_examples": [
      {
        "sentence": "최근 수강신청에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Đăng ký môn học đang tăng cao."
      },
      {
        "sentence": "수강신청 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Đăng ký môn học."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-101-교양과목",
    "ko": "교양과목",
    "vi": "Môn học đại cương",
    "en": "General elective course",
    "level": 3,
    "sinoVi": "Hiệu",
    "category": "academic",
    "pronunciation": "[교양과목]",
    "ai_examples": [
      {
        "sentence": "최근 교양과목에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Môn học đại cương đang tăng cao."
      },
      {
        "sentence": "교양과목 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Môn học đại cương."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-102-전공필수",
    "ko": "전공필수",
    "vi": "Môn chuyên ngành bắt buộc",
    "en": "Required major course",
    "level": 3,
    "sinoVi": "Điện Công Thủy",
    "category": "academic",
    "pronunciation": "[전공필수]",
    "ai_examples": [
      {
        "sentence": "최근 전공필수에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Môn chuyên ngành bắt buộc đang tăng cao."
      },
      {
        "sentence": "전공필수 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Môn chuyên ngành bắt buộc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-103-이력서",
    "ko": "이력서",
    "vi": "Sơ yếu lý lịch (CV)",
    "en": "Resume / CV",
    "level": 3,
    "sinoVi": "Lý lịch thư",
    "category": "work",
    "pronunciation": "[이력서]",
    "ai_examples": [
      {
        "sentence": "최근 이력서에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Sơ yếu lý lịch (CV) đang tăng cao."
      },
      {
        "sentence": "이력서 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Sơ yếu lý lịch (CV)."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-104-자기소개서",
    "ko": "자기소개서",
    "vi": "Bài tự giới thiệu bản thân",
    "en": "Cover letter",
    "level": 3,
    "sinoVi": "Tự Kế Thư",
    "category": "work",
    "pronunciation": "[자기소개서]",
    "ai_examples": [
      {
        "sentence": "최근 자기소개서에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Bài tự giới thiệu bản thân đang tăng cao."
      },
      {
        "sentence": "자기소개서 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Bài tự giới thiệu bản thân."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-105-면접",
    "ko": "면접",
    "vi": "Phỏng vấn",
    "en": "Interview",
    "level": 3,
    "sinoVi": "Diện tiếp",
    "category": "work",
    "pronunciation": "[면접]",
    "ai_examples": [
      {
        "sentence": "최근 면접에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Phỏng vấn đang tăng cao."
      },
      {
        "sentence": "면접 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Phỏng vấn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-106-합격통지서",
    "ko": "합격통지서",
    "vi": "Giấy báo trúng tuyển",
    "en": "Acceptance letter",
    "level": 3,
    "sinoVi": "Thống Địa Thư",
    "category": "academic",
    "pronunciation": "[합격통지서]",
    "ai_examples": [
      {
        "sentence": "최근 합격통지서에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Giấy báo trúng tuyển đang tăng cao."
      },
      {
        "sentence": "합격통지서 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Giấy báo trúng tuyển."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-107-등록금",
    "ko": "등록금",
    "vi": "Học phí",
    "en": "Tuition fee",
    "level": 3,
    "category": "academic",
    "pronunciation": "[등록금]",
    "ai_examples": [
      {
        "sentence": "최근 등록금에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Học phí đang tăng cao."
      },
      {
        "sentence": "등록금 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Học phí."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-108-부동산",
    "ko": "부동산",
    "vi": "Bất động sản / Văn phòng môi giới",
    "en": "Real estate",
    "level": 3,
    "sinoVi": "Bất động sản",
    "category": "daily",
    "pronunciation": "[부동산]",
    "ai_examples": [
      {
        "sentence": "최근 부동산에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Bất động sản / Văn phòng môi giới đang tăng cao."
      },
      {
        "sentence": "부동산 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Bất động sản / Văn phòng môi giới."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-109-계약서",
    "ko": "계약서",
    "vi": "Hợp đồng",
    "en": "Contract document",
    "level": 3,
    "sinoVi": "Kế Dược Thư",
    "category": "work",
    "pronunciation": "[계약서]",
    "ai_examples": [
      {
        "sentence": "최근 계약서에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Hợp đồng đang tăng cao."
      },
      {
        "sentence": "계약서 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Hợp đồng."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-110-관리비",
    "ko": "관리비",
    "vi": "Phí quản lý nhà",
    "en": "Maintenance fee",
    "level": 3,
    "sinoVi": "Quán Lý",
    "category": "daily",
    "pronunciation": "[관리비]",
    "ai_examples": [
      {
        "sentence": "최근 관리비에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Phí quản lý nhà đang tăng cao."
      },
      {
        "sentence": "관리비 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Phí quản lý nhà."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-111-공과금",
    "ko": "공과금",
    "vi": "Tiền điện nước ga sinh hoạt",
    "en": "Utility bills",
    "level": 3,
    "sinoVi": "Công",
    "category": "daily",
    "pronunciation": "[공과금]",
    "ai_examples": [
      {
        "sentence": "최근 공과금에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Tiền điện nước ga sinh hoạt đang tăng cao."
      },
      {
        "sentence": "공과금 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Tiền điện nước ga sinh hoạt."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-112-송금",
    "ko": "송금",
    "vi": "Chuyển tiền",
    "en": "Remittance / Money transfer",
    "level": 3,
    "sinoVi": "Tống kim",
    "category": "work",
    "pronunciation": "[송금]",
    "ai_examples": [
      {
        "sentence": "최근 송금에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Chuyển tiền đang tăng cao."
      },
      {
        "sentence": "송금 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Chuyển tiền."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-113-환전",
    "ko": "환전",
    "vi": "Đổi ngoại tệ",
    "en": "Currency exchange",
    "level": 3,
    "sinoVi": "Hoán tiền",
    "category": "travel",
    "pronunciation": "[환전]",
    "ai_examples": [
      {
        "sentence": "최근 환전에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Đổi ngoại tệ đang tăng cao."
      },
      {
        "sentence": "환전 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Đổi ngoại tệ."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-114-건강보험",
    "ko": "건강보험",
    "vi": "Bảo hiểm y tế",
    "en": "Health insurance",
    "level": 3,
    "category": "hospital",
    "pronunciation": "[건강보험]",
    "ai_examples": [
      {
        "sentence": "최근 건강보험에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Bảo hiểm y tế đang tăng cao."
      },
      {
        "sentence": "건강보험 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Bảo hiểm y tế."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-115-응급실",
    "ko": "응급실",
    "vi": "Phòng cấp cứu",
    "en": "Emergency room",
    "level": 3,
    "sinoVi": "Ứng cấp thất",
    "category": "hospital",
    "pronunciation": "[응급실]",
    "ai_examples": [
      {
        "sentence": "최근 응급실에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Phòng cấp cứu đang tăng cao."
      },
      {
        "sentence": "응급실 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Phòng cấp cứu."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v3-116-진료비",
    "ko": "진료비",
    "vi": "Phí khám bệnh",
    "en": "Medical treatment fee",
    "level": 3,
    "category": "hospital",
    "pronunciation": "[진료비]",
    "ai_examples": [
      {
        "sentence": "최근 진료비에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Phí khám bệnh đang tăng cao."
      },
      {
        "sentence": "진료비 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Phí khám bệnh."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v4-117-승진",
    "ko": "승진",
    "vi": "Thăng tiến, Thăng chức",
    "en": "Promotion",
    "level": 4,
    "sinoVi": "Thăng tiến",
    "category": "work",
    "pronunciation": "[승진]",
    "ai_examples": [
      {
        "sentence": "최근 승진에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Thăng tiến, Thăng chức đang tăng cao."
      },
      {
        "sentence": "승진 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Thăng tiến, Thăng chức."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v4-118-출장",
    "ko": "출장",
    "vi": "Đi công tác",
    "en": "Business trip",
    "level": 4,
    "sinoVi": "Xuất trướng",
    "category": "work",
    "pronunciation": "[출장]",
    "ai_examples": [
      {
        "sentence": "최근 출장에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Đi công tác đang tăng cao."
      },
      {
        "sentence": "출장 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Đi công tác."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v4-119-보고서",
    "ko": "보고서",
    "vi": "Bản báo cáo",
    "en": "Report document",
    "level": 4,
    "sinoVi": "Báo cáo thư",
    "category": "work",
    "pronunciation": "[보고서]",
    "ai_examples": [
      {
        "sentence": "최근 보고서에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Bản báo cáo đang tăng cao."
      },
      {
        "sentence": "보고서 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Bản báo cáo."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v4-120-회의",
    "ko": "회의",
    "vi": "Cuộc họp, Hội nghị",
    "en": "Meeting",
    "level": 4,
    "sinoVi": "Hội nghị",
    "category": "work",
    "pronunciation": "[회의]",
    "ai_examples": [
      {
        "sentence": "최근 회의에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Cuộc họp, Hội nghị đang tăng cao."
      },
      {
        "sentence": "회의 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Cuộc họp, Hội nghị."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v4-121-업무",
    "ko": "업무",
    "vi": "Nghiệp vụ, Công việc",
    "en": "Work duty",
    "level": 4,
    "sinoVi": "Nghiệp vụ",
    "category": "work",
    "pronunciation": "[업무]",
    "ai_examples": [
      {
        "sentence": "최근 업무에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Nghiệp vụ, Công việc đang tăng cao."
      },
      {
        "sentence": "업무 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Nghiệp vụ, Công việc."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-122-국제정세",
    "ko": "국제정세",
    "vi": "Tình hình quốc tế",
    "en": "International situation",
    "level": 6,
    "sinoVi": "Quốc tế tình thế",
    "category": "academic",
    "pronunciation": "[국제정세]",
    "ai_examples": [
      {
        "sentence": "최근 국제정세에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Tình hình quốc tế đang tăng cao."
      },
      {
        "sentence": "국제정세 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Tình hình quốc tế."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-123-지속가능발전",
    "ko": "지속가능발전",
    "vi": "Phát triển bền vững",
    "en": "Sustainable development",
    "level": 6,
    "sinoVi": "Trì tục khả năng phát triển",
    "category": "academic",
    "pronunciation": "[지속가능발전]",
    "ai_examples": [
      {
        "sentence": "최근 지속가능발전에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Phát triển bền vững đang tăng cao."
      },
      {
        "sentence": "지속가능발전 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Phát triển bền vững."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-124-빈부격차",
    "ko": "빈부격차",
    "vi": "Khoảng cách giàu nghèo",
    "en": "Gap between rich and poor",
    "level": 6,
    "sinoVi": "Bần phú cách sai",
    "category": "academic",
    "pronunciation": "[빈부격차]",
    "ai_examples": [
      {
        "sentence": "최근 빈부격차에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Khoảng cách giàu nghèo đang tăng cao."
      },
      {
        "sentence": "빈부격차 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Khoảng cách giàu nghèo."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-125-문화유산",
    "ko": "문화유산",
    "vi": "Di sản văn hóa",
    "en": "Cultural heritage",
    "level": 6,
    "sinoVi": "Văn hóa di sản",
    "category": "academic",
    "pronunciation": "[문화유산]",
    "ai_examples": [
      {
        "sentence": "최근 문화유산에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Di sản văn hóa đang tăng cao."
      },
      {
        "sentence": "문화유산 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Di sản văn hóa."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-126-사법개혁",
    "ko": "사법개혁",
    "vi": "Cải cách tư pháp",
    "en": "Judicial reform",
    "level": 6,
    "sinoVi": "Tư pháp cải cách",
    "category": "academic",
    "pronunciation": "[사법개혁]",
    "ai_examples": [
      {
        "sentence": "최근 사법개혁에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Cải cách tư pháp đang tăng cao."
      },
      {
        "sentence": "사법개혁 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Cải cách tư pháp."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-127-경제위기",
    "ko": "경제위기",
    "vi": "Khủng hoảng kinh tế",
    "en": "Economic crisis",
    "level": 6,
    "sinoVi": "Kinh tế nguy cơ",
    "category": "academic",
    "pronunciation": "[경제위기]",
    "ai_examples": [
      {
        "sentence": "최근 경제위기에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Khủng hoảng kinh tế đang tăng cao."
      },
      {
        "sentence": "경제위기 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Khủng hoảng kinh tế."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-128-외교관",
    "ko": "외교관",
    "vi": "Nhà ngoại giao",
    "en": "Diplomat",
    "level": 6,
    "sinoVi": "Ngoại giao quán",
    "category": "academic",
    "pronunciation": "[외교관]",
    "ai_examples": [
      {
        "sentence": "최근 외교관에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Nhà ngoại giao đang tăng cao."
      },
      {
        "sentence": "외교관 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Nhà ngoại giao."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-129-지적재산권",
    "ko": "지적재산권",
    "vi": "Quyền sở hữu trí tuệ",
    "en": "Intellectual property rights",
    "level": 6,
    "sinoVi": "Trí đích tài sản quyền",
    "category": "academic",
    "pronunciation": "[지적재산권]",
    "ai_examples": [
      {
        "sentence": "최근 지적재산권에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Quyền sở hữu trí tuệ đang tăng cao."
      },
      {
        "sentence": "지적재산권 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Quyền sở hữu trí tuệ."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-130-헌법재판소",
    "ko": "헌법재판소",
    "vi": "Tòa án hiến pháp",
    "en": "Constitutional Court",
    "level": 6,
    "sinoVi": "Hiến pháp tài phán sở",
    "category": "academic",
    "pronunciation": "[헌법재판소]",
    "ai_examples": [
      {
        "sentence": "최근 헌법재판소에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Tòa án hiến pháp đang tăng cao."
      },
      {
        "sentence": "헌법재판소 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Tòa án hiến pháp."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-131-국회의원",
    "ko": "국회의원",
    "vi": "Nghị sĩ quốc hội",
    "en": "Member of National Assembly",
    "level": 6,
    "sinoVi": "Quốc hội nghị viên",
    "category": "academic",
    "pronunciation": "[국회의원]",
    "ai_examples": [
      {
        "sentence": "최근 국회의원에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Nghị sĩ quốc hội đang tăng cao."
      },
      {
        "sentence": "국회의원 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Nghị sĩ quốc hội."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-132-민주주의",
    "ko": "민주주의",
    "vi": "Chủ nghĩa dân chủ",
    "en": "Democracy",
    "level": 6,
    "sinoVi": "Dân chủ chủ nghĩa",
    "category": "academic",
    "pronunciation": "[민주주의]",
    "ai_examples": [
      {
        "sentence": "최근 민주주의에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Chủ nghĩa dân chủ đang tăng cao."
      },
      {
        "sentence": "민주주의 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Chủ nghĩa dân chủ."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-133-자본주의",
    "ko": "자본주의",
    "vi": "Chủ nghĩa tư bản",
    "en": "Capitalism",
    "level": 6,
    "sinoVi": "Tư bản chủ nghĩa",
    "category": "academic",
    "pronunciation": "[자본주의]",
    "ai_examples": [
      {
        "sentence": "최근 자본주의에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Chủ nghĩa tư bản đang tăng cao."
      },
      {
        "sentence": "자본주의 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Chủ nghĩa tư bản."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-134-세계화",
    "ko": "세계화",
    "vi": "Toàn cầu hóa",
    "en": "Globalization",
    "level": 6,
    "sinoVi": "Thế giới hóa",
    "category": "academic",
    "pronunciation": "[세계화]",
    "ai_examples": [
      {
        "sentence": "최근 세계화에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Toàn cầu hóa đang tăng cao."
      },
      {
        "sentence": "세계화 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Toàn cầu hóa."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-135-다문화사회",
    "ko": "다문화사회",
    "vi": "Xã hội đa văn hóa",
    "en": "Multicultural society",
    "level": 6,
    "sinoVi": "Đa văn hóa xã hội",
    "category": "academic",
    "pronunciation": "[다문화사회]",
    "ai_examples": [
      {
        "sentence": "최근 다문화사회에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Xã hội đa văn hóa đang tăng cao."
      },
      {
        "sentence": "다문화사회 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Xã hội đa văn hóa."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-136-초고령사회",
    "ko": "초고령사회",
    "vi": "Xã hội siêu già hóa",
    "en": "Super-aged society",
    "level": 6,
    "sinoVi": "Siêu cao linh xã hội",
    "category": "academic",
    "pronunciation": "[초고령사회]",
    "ai_examples": [
      {
        "sentence": "최근 초고령사회에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Xã hội siêu già hóa đang tăng cao."
      },
      {
        "sentence": "초고령사회 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Xã hội siêu già hóa."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-137-지구온난화",
    "ko": "지구온난화",
    "vi": "Hiện tượng nóng lên toàn cầu",
    "en": "Global warming",
    "level": 6,
    "sinoVi": "Địa cầu ôn nạn hóa",
    "category": "academic",
    "pronunciation": "[지구온난화]",
    "ai_examples": [
      {
        "sentence": "최근 지구온난화에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Hiện tượng nóng lên toàn cầu đang tăng cao."
      },
      {
        "sentence": "지구온난화 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Hiện tượng nóng lên toàn cầu."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-138-신재생에너지",
    "ko": "신재생에너지",
    "vi": "Năng lượng tái tạo mới",
    "en": "Renewable energy",
    "level": 6,
    "sinoVi": "Tân tái sinh năng lượng",
    "category": "academic",
    "pronunciation": "[신재생에너지]",
    "ai_examples": [
      {
        "sentence": "최근 신재생에너지에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Năng lượng tái tạo mới đang tăng cao."
      },
      {
        "sentence": "신재생에너지 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Năng lượng tái tạo mới."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-139-인공지능",
    "ko": "인공지능",
    "vi": "Trí tuệ nhân tạo",
    "en": "Artificial intelligence",
    "level": 6,
    "sinoVi": "Nhân công trí năng",
    "category": "academic",
    "pronunciation": "[인공지능]",
    "ai_examples": [
      {
        "sentence": "최근 인공지능에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Trí tuệ nhân tạo đang tăng cao."
      },
      {
        "sentence": "인공지능 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Trí tuệ nhân tạo."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-140-빅데이터",
    "ko": "빅데이터",
    "vi": "Dữ liệu lớn",
    "en": "Big data",
    "level": 6,
    "sinoVi": "Đại dữ liệu",
    "category": "academic",
    "pronunciation": "[빅데이터]",
    "ai_examples": [
      {
        "sentence": "최근 빅데이터에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Dữ liệu lớn đang tăng cao."
      },
      {
        "sentence": "빅데이터 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Dữ liệu lớn."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-141-생명공학",
    "ko": "생명공학",
    "vi": "Công nghệ sinh học",
    "en": "Biotechnology",
    "level": 6,
    "sinoVi": "Sinh mệnh công học",
    "category": "academic",
    "pronunciation": "[생명공학]",
    "ai_examples": [
      {
        "sentence": "최근 생명공학에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Công nghệ sinh học đang tăng cao."
      },
      {
        "sentence": "생명공학 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Công nghệ sinh học."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-142-우주탐사",
    "ko": "우주탐사",
    "vi": "Thám hiểm vũ trụ",
    "en": "Space exploration",
    "level": 6,
    "sinoVi": "Vũ trụ thám tra",
    "category": "academic",
    "pronunciation": "[우주탐사]",
    "ai_examples": [
      {
        "sentence": "최근 우주탐사에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Thám hiểm vũ trụ đang tăng cao."
      },
      {
        "sentence": "우주탐사 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Thám hiểm vũ trụ."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  },
  {
    "id": "v6-143-국제통화기금",
    "ko": "국제통화기금",
    "vi": "Quỹ tiền tệ quốc tế (IMF)",
    "en": "International Monetary Fund",
    "level": 6,
    "sinoVi": "Quốc tế thông hóa cơ kim",
    "category": "academic",
    "pronunciation": "[국제통화기금]",
    "ai_examples": [
      {
        "sentence": "최근 국제통화기금에 대한 관심이 높아지고 있다.",
        "meaning": "Gần đây sự quan tâm đến Quỹ tiền tệ quốc tế (IMF) đang tăng cao."
      },
      {
        "sentence": "국제통화기금 문제를 해결하기 위해 노력이 필요하다.",
        "meaning": "Cần có nỗ lực để giải quyết vấn đề Quỹ tiền tệ quốc tế (IMF)."
      }
    ],
    "created_at": "2026-08-10T02:09:29.120Z"
  }
]
