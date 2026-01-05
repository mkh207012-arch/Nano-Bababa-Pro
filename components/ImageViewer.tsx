import React, { useState } from 'react';
import { Download, Maximize2, Wand2, X, Check, Users, Sparkles, LayoutGrid, ChevronRight } from 'lucide-react';
import { GeneratedImage } from '../types';

interface ImageViewerProps {
  imageUrl: string | null;
  isLoading: boolean;
  history?: GeneratedImage[];
  onEdit?: (prompt: string) => void;
  onConsistentGenerate?: (prompt: string) => void;
  onSelectImage?: (image: GeneratedImage) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ 
  imageUrl, 
  isLoading, 
  onEdit, 
  onConsistentGenerate,
  history = [],
  onSelectImage
}) => {
  const [activeMode, setActiveMode] = useState<'none' | 'edit' | 'consistent'>('none');
  const [promptText, setPromptText] = useState("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `k-beauty-studio-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSubmit = () => {
    if (!promptText.trim()) return;

    if (activeMode === 'edit' && onEdit) {
      onEdit(promptText);
    } else if (activeMode === 'consistent' && onConsistentGenerate) {
      onConsistentGenerate(promptText);
    }
    
    setActiveMode('none');
    setPromptText("");
  };

  const toggleMode = (mode: 'edit' | 'consistent') => {
    if (activeMode === mode) {
      setActiveMode('none');
    } else {
      setActiveMode(mode);
      setPromptText("");
    }
  };

  if (!imageUrl && !isLoading && history.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black/90 p-8 h-full min-h-[50vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Maximize2 className="text-gray-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-300 mb-2">촬영 준비 완료</h2>
          <p className="text-gray-500">
            Canon L 렌즈와 컨셉을 선택하여 세계적인 수준의 뷰티 화보를 만들어보세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-black relative overflow-hidden">
      {/* Top Bar for Gallery Toggle */}
      {history.length > 0 && (
        <div className="absolute top-4 right-4 z-30">
          <button 
            onClick={() => setIsGalleryOpen(!isGalleryOpen)}
            className="bg-black/50 backdrop-blur border border-gray-700 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm hover:bg-gray-800 transition-colors"
          >
            {isGalleryOpen ? <ChevronRight size={16} /> : <LayoutGrid size={16} />}
            {isGalleryOpen ? '갤러리 닫기' : `갤러리 (${history.length})`}
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <p className="mt-6 text-rose-400 font-mono animate-pulse">8K 화보 현상 중...</p>
        </div>
      )}

      <div className="flex flex-1 h-full overflow-hidden">
        {/* Main Image Area */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-10 overflow-auto relative transition-all duration-300">
          {imageUrl ? (
            <div className="relative group max-h-full max-w-full shadow-2xl shadow-black/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageUrl} 
                alt="생성된 K-Pop 뷰티 화보" 
                className="max-h-[85vh] max-w-full object-contain rounded-sm border border-gray-800"
              />
              
              {/* Quick Actions Overlay */}
              <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Consistent Character Gen Button */}
                <button 
                  onClick={() => toggleMode('consistent')}
                  className={`p-3 rounded-full shadow-lg transition-colors border-2 
                    ${activeMode === 'consistent' ? 'bg-rose-600 border-rose-400 text-white' : 'bg-white text-black border-transparent hover:bg-rose-50'}`}
                  title="이 모델로 다음 컷 촬영 (모델 유지)"
                >
                  <Users size={20} />
                </button>

                {/* Edit Button */}
                <button 
                  onClick={() => toggleMode('edit')}
                  className={`p-3 rounded-full shadow-lg transition-colors border-2
                    ${activeMode === 'edit' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white text-black border-transparent hover:bg-purple-50'}`}
                  title="이미지 부분 수정"
                >
                  <Wand2 size={20} />
                </button>

                <button 
                  onClick={handleDownload}
                  className="bg-white text-black p-3 rounded-full shadow-lg hover:bg-gray-200 transition-colors border-2 border-transparent"
                  title="원본 다운로드"
                >
                  <Download size={20} />
                </button>
              </div>

              {/* Prompt Input Panel */}
              {activeMode !== 'none' && (
                <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gray-900/90 backdrop-blur border border-gray-700 p-4 rounded-xl shadow-2xl z-10 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-semibold flex items-center gap-2 ${activeMode === 'consistent' ? 'text-rose-400' : 'text-purple-400'}`}>
                      {activeMode === 'consistent' ? <Users size={14} /> : <Wand2 size={14} />}
                      {activeMode === 'consistent' ? '모델 유지 다음 컷 촬영' : 'AI 부분 수정'}
                    </span>
                    <button onClick={() => setActiveMode('none')} className="text-gray-500 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                    {activeMode === 'consistent' 
                      ? '현재 모델의 얼굴과 체형을 유지하면서, 새로운 장소나 포즈로 사진을 새로 찍습니다.' 
                      : '현재 사진의 구도는 그대로 유지하고, 머리색이나 소품 등 특정 부분만 변경합니다.'}
                  </p>

                  <textarea 
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder={activeMode === 'consistent' ? "예: 해변가에서 모자를 쓰고 웃고 있음..." : "예: 머리카락을 금발로 변경, 선글라스 추가..."}
                    className={`w-full bg-black/50 border rounded-lg p-3 text-sm text-white outline-none resize-none h-20 mb-3 focus:ring-1
                      ${activeMode === 'consistent' ? 'border-gray-600 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500'}`}
                    autoFocus
                  />
                  <button 
                    onClick={handleSubmit}
                    disabled={!promptText.trim()}
                    className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                      ${activeMode === 'consistent' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                  >
                    {activeMode === 'consistent' ? <Sparkles size={16} /> : <Check size={16} />}
                    {activeMode === 'consistent' ? '촬영 시작' : '수정 적용'}
                  </button>
                </div>
              )}
            </div>
          ) : (
             // Placeholder if history exists but no current image selected (rare case if handled by App)
             <div className="text-gray-500 text-sm">이미지를 선택해주세요</div>
          )}
        </div>

        {/* Gallery Sidebar (Right) */}
        <div 
          className={`bg-gray-900 border-l border-gray-800 transition-all duration-300 ease-in-out flex flex-col z-20
            ${isGalleryOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}`}
        >
          <div className="p-4 border-b border-gray-800 font-semibold text-gray-200 flex items-center gap-2">
            <LayoutGrid size={18} />
            촬영 기록
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  if (onSelectImage) onSelectImage(img);
                }}
                className={`group cursor-pointer relative rounded-lg overflow-hidden border-2 transition-all
                  ${imageUrl === img.url ? 'border-rose-500' : 'border-transparent hover:border-gray-600'}`}
              >
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={img.url} 
                  alt={`History ${idx}`} 
                  className="w-full h-48 object-cover bg-gray-800"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <p className="text-xs text-white line-clamp-2">
                    {img.prompt}
                  </p>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-10">
                아직 생성된 화보가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
