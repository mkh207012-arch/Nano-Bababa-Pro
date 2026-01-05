import { AspectRatio, LensConfig, ImageResolution, GridCount, GridSizing } from "./types";

export const LENSES: LensConfig[] = [
  {
    id: "rf85",
    name: "Canon RF 85mm f/1.2L USM",
    focalLength: "85mm",
    aperture: "f/1.2",
    description: "궁극의 인물 렌즈. 크리미한 배경 흐림(보케), 눈동자의 놀라운 선명도, 인물을 돋보이게 하는 압축 효과."
  },
  {
    id: "rf50",
    name: "Canon RF 50mm f/1.2L USM",
    focalLength: "50mm",
    aperture: "f/1.2",
    description: "마법 같은 입체감의 표준 화각. 반신(Half-body) 촬영에 적합하며 자연스러운 시선을 제공합니다."
  },
  {
    id: "rf35",
    name: "Canon RF 35mm f/1.4L VCM",
    focalLength: "35mm",
    aperture: "f/1.4",
    description: "광각 환경 인물 사진. 배경과 의상이 돋보이는 역동적인 구도를 연출합니다."
  },
  {
    id: "rf135",
    name: "Canon RF 135mm f/1.8L IS USM",
    focalLength: "135mm",
    aperture: "f/1.8",
    description: "강력한 망원 압축 효과. 배경과 피사체를 완벽하게 분리하여 몽환적인 분위기를 만듭니다."
  }
];

export const ASPECT_RATIOS = [
  { value: AspectRatio.Portrait, label: "세로 (3:4)" },
  { value: AspectRatio.Tall, label: "소셜 스토리 (9:16)" },
  { value: AspectRatio.Square, label: "정방형 (1:1)" },
  { value: AspectRatio.Landscape, label: "가로 (4:3)" },
  { value: AspectRatio.Wide, label: "시네마틱 (16:9)" },
];

export const RESOLUTIONS: { value: ImageResolution; label: string }[] = [
  { value: "1K", label: "표준 (1K)" },
  { value: "2K", label: "고화질 (2K)" },
  { value: "4K", label: "초고화질 (4K)" },
];

export const GRID_OPTIONS: { value: GridCount; label: string }[] = [
  { value: 1, label: "1장 (단독)" },
  { value: 2, label: "2장 분할" },
  { value: 3, label: "3장 분할" },
  { value: 4, label: "4장 분할" },
  { value: 6, label: "6장 분할" },
  { value: 9, label: "9장 분할" },
];

export const GRID_SIZING_OPTIONS: { value: GridSizing; label: string }[] = [
  { value: 'uniform', label: "동일 크기 (Uniform)" },
  { value: 'random', label: "랜덤 크기 (Random)" },
];

export const CAMERA_ANGLES = [
  "랜덤 (AI 추천)",
  "아이 레벨 (Standard Eye-Level) - 가장 자연스러운 시선",
  "로우 앵글 (Low Angle) - 다리가 길어 보이고 웅장함",
  "하이 앵글 (High Angle) - 얼굴이 돋보이고 귀여운 느낌",
  "더치 앵글 (Dutch Angle) - 역동적이고 힙한 분위기",
  "클로즈업 (Extreme Close-up) - 얼굴 디테일 강조",
  "바스트 샷 (Bust Shot) - 상반신 중심 포트레이트",
  "니 샷 (Knee Shot) - 무릎 위, 패션과 비율 강조",
  "풀 샷 (Full Shot) - 전신과 배경의 조화",
  "오버헤드 (Overhead) - 머리 위에서 내려다보는 구도"
];

export const FASHION_POSES = [
  "랜덤 (AI 추천)",
  "정면 응시 (Front View)",
  "측면 응시 (Side Profile)",
  "뒤돌아보기 (Looking Back)",
  "전신 워킹 (Walking Full Body)",
  "의자에 앉기 (Sitting on Chair)",
  "바닥에 앉기 (Sitting on Floor)",
  "다리 꼬기 (Crossed Legs)",
  "손으로 턱 받치기 (Hand on Chin)",
  "머리카락 쓸어넘기기 (Hand in Hair)",
  "얼굴 클로즈업 (Face Close-up)",
  "눈 감고 느끼기 (Eyes Closed)",
  "역동적인 점프 (Dynamic Jump)",
  "주머니에 손 넣기 (Hands in Pocket)",
  "팔짱 끼기 (Arms Crossed)",
  "소품 활용 (Holding Prop)"
];

export const CONCEPT_GROUPS = {
  indoor: {
    label: "실내 (Indoor)",
    items: [
      "깔끔한 스튜디오 (Studio Clean)",
      "럭셔리 호텔 (Luxury Hotel)",
      "감성 카페 (Cozy Cafe)",
      "모던 거실 (Modern Living Room)",
      "화려한 파티룸 (Fancy Party Room)",
      "클래식 도서관 (Classic Library)",
      "햇살 드는 창가 (Sunlit Window)"
    ]
  },
  outdoor: {
    label: "실외 (Outdoor)",
    items: [
      "네온 시티 야경 (Neon City Night)",
      "햇살 가득한 정원 (Sunlit Garden)",
      "푸른 해변 (Blue Beach)",
      "벚꽃 흩날리는 거리 (Cherry Blossom Street)",
      "도심 루프탑 (City Rooftop)",
      "숲속의 오솔길 (Forest Path)",
      "고급 리조트 수영장 (Luxury Resort Pool)"
    ]
  }
};
