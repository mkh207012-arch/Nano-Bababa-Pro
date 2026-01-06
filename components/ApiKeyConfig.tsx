import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { X, Key, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { getApiKey, saveApiKey, validateConnection } from '../services/geminiService';

interface ApiKeyConfigProps {
  onClose: () => void;
}

export const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = getApiKey();
    if (stored) setApiKey(stored);
  }, []);

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setStatus('error');
      setMessage("API Key를 입력해주세요.");
      return;
    }
    
    setStatus('testing');
    const isValid = await validateConnection(apiKey);
    
    if (isValid) {
      setStatus('success');
      setMessage("연결 성공! 유효한 API Key입니다.");
    } else {
      setStatus('error');
      setMessage("연결 실패. API Key가 올바르지 않거나 권한이 없습니다.");
    }
  };

  const handleSave = () => {
    if (apiKey.trim()) {
      saveApiKey(apiKey);
      onClose();
    } else {
      saveApiKey(""); // Clear
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-lg">
            <Key className="w-5 h-5" />
            <h3>API Key 설정 (External)</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400 leading-relaxed">
            Google AI Studio에서 발급받은 API Key를 입력하세요.<br/>
            키는 서버로 전송되지 않으며, 브라우저 로컬 스토리지에 암호화(난독화)되어 저장됩니다.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">Google Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setStatus('idle');
                setMessage("");
              }}
              placeholder="AIza..."
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
            />
          </div>

          {/* Status Message */}
          {status !== 'idle' && (
            <div className={`text-xs p-3 rounded-lg flex items-center gap-2 ${
              status === 'testing' ? 'bg-blue-900/30 text-blue-300' :
              status === 'success' ? 'bg-green-900/30 text-green-300' :
              'bg-red-900/30 text-red-300'
            }`}>
               {status === 'testing' && <div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />}
               {status === 'success' && <CheckCircle size={14} />}
               {status === 'error' && <AlertCircle size={14} />}
               {status === 'testing' ? "연결 테스트 중..." : message}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3 rounded-b-2xl">
          <Button 
            variant="secondary" 
            onClick={handleTest}
            disabled={!apiKey || status === 'testing'}
            className="text-xs"
          >
            <ShieldCheck size={16} />
            연결 테스트
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={status === 'testing'}
            className="text-xs"
          >
            저장 및 닫기
          </Button>
        </div>
      </div>
    </div>
  );
};
