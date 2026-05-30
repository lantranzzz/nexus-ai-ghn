'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import SettingsSidebar, { ApiKeys } from '@/components/SettingsSidebar';
import ModelSelection from '@/components/ModelSelection';
import ResearchForm from '@/components/ResearchForm';
import PromptReview from '@/components/PromptReview';
import ManualInputForm from '@/components/ManualInputForm';
import ReportView from '@/components/ReportView';
import { getResearches, ResearchData, isSupabaseConfigured, supabase, getApiKeysFromCloud } from '@/lib/supabase';
import Login from '@/components/Login';
import { 
  Sparkles, Clock, History, FileText, Database, 
  HelpCircle, ChevronRight, AlertTriangle, ShieldCheck 
} from 'lucide-react';

export default function Home() {
  // Trạng thái Sidebar Cấu hình
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Dữ liệu Form
  const [scope, setScope] = useState<string>('');
  const [persona, setPersona] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [rules, setRules] = useState<string>('');
  const [knowledge, setKnowledge] = useState<string>('');

  // Lựa chọn Model mặc định
  const [selectedSearchModels, setSelectedSearchModels] = useState<string[]>([
    'Perplexity',
    'DeepSeek',
    'Moonshot Kimi'
  ]);
  const [selectedSynthesisModel, setSelectedSynthesisModel] = useState<string>(
    'OpenAI (gpt-5.5)'
  );

  // Tiến trình Orchestration
  // 'form' | 'planning' | 'prompts' | 'manual_input' | 'researching' | 'result'
  const [step, setStep] = useState<'form' | 'planning' | 'prompts' | 'manual_input' | 'researching' | 'result'>('form');
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [planningSummary, setPlanningSummary] = useState<string>('');
  const [report, setReport] = useState<string>('');
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [isReportMocked, setIsReportMocked] = useState<boolean>(false);

  // Lịch sử nghiên cứu đã lưu
  const [history, setHistory] = useState<ResearchData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [dbStatusText, setDbStatusText] = useState<string>('LocalStorage');

  // Xác thực
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Khởi chạy: Tải lịch sử & kiểm tra DB
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const res = await getResearches();
    if (res.success) {
      setHistory(res.data);
      setDbStatusText(res.isLocalFallback ? 'Cục bộ (LocalStorage)' : 'Đồng bộ Cloud Supabase');
    }
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isSupabaseConfigured() && supabase) {
          // Kiểm tra session hiện tại có timeout 10s
          const sessionPromise = supabase.auth.getSession();
          const authTimeoutPromise = new Promise<{ data: { session: any }, error: any }>((_, reject) => 
            setTimeout(() => reject(new Error('Yêu cầu xác thực Supabase quá hạn (Timeout).')), 25000)
          );
          
          const { data: { session }, error } = await Promise.race([sessionPromise, authTimeoutPromise]) as { data: { session: any }, error: any };
          if (error) throw error;
          
          if (session) {
            setIsAuthenticated(true);
            // Tải API Keys từ Cloud về
            try {
              const cloudKeys = await getApiKeysFromCloud();
              if (cloudKeys) {
                localStorage.setItem('nexusai_api_keys', JSON.stringify(cloudKeys));
              }
            } catch (e) {
              console.error('Không tải được API Keys:', e);
            }
          } else {
            setIsAuthenticated(false);
          }

          // Lắng nghe thay đổi auth
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
              setIsAuthenticated(true);
              try {
                const cloudKeys = await getApiKeysFromCloud();
                if (cloudKeys) {
                  localStorage.setItem('nexusai_api_keys', JSON.stringify(cloudKeys));
                }
              } catch(e) {}
            } else {
              setIsAuthenticated(false);
            }
          });

          return () => subscription.unsubscribe();
        } else {
          // Kiểm tra trạng thái đăng nhập Local
          const authStatus = localStorage.getItem('nexusai_auth');
          if (authStatus === 'true') {
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra Auth:', err);
        // Fallback local auth if supabase fails
        const authStatus = localStorage.getItem('nexusai_auth');
        if (authStatus === 'true') setIsAuthenticated(true);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
    loadHistory();
  }, []);

  // Lấy các API Keys từ LocalStorage khi cần gọi API
  const getStoredApiKeys = (): ApiKeys => {
    const rawKeys = localStorage.getItem('nexusai_api_keys');
    if (rawKeys) {
      try {
        return JSON.parse(rawKeys);
      } catch (e) {
        console.error('Lỗi parse API keys:', e);
      }
    }
    return {
      openai: '',
      anthropic: '',
      google: '',
      perplexity: '',
      deepseek: '',
      moonshot: '',
    };
  };

  // GIAI ĐOẠN 1: LẬP KẾ HOẠCH & SINH PROMPTS
  const handlePlanResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const apiKeys = getStoredApiKeys();
    
    // Kiểm tra xem Model Tổng Biên Tập có API Key chưa
    let requiredKeyName = '';
    const synthesisLower = selectedSynthesisModel.toLowerCase();
    if (synthesisLower.includes('claude')) requiredKeyName = 'anthropic';
    else if (synthesisLower.includes('gpt') || synthesisLower.includes('o1')) requiredKeyName = 'openai';
    else if (synthesisLower.includes('gemini')) requiredKeyName = 'google';
    
    if (requiredKeyName && !apiKeys[requiredKeyName as keyof typeof apiKeys]) {
      alert(`Bạn chưa cấu hình API Key cho ${requiredKeyName.toUpperCase()} - model đang được chọn làm Tổng Biên Tập. Vui lòng thêm Key trong phần Cài đặt trước khi chạy.`);
      setIsSettingsOpen(true);
      return;
    }

    setStep('planning');
    setLoadingMessage('Đang kết nối Model Tổng Biên Tập để lập kế hoạch & tối ưu prompt...');

    try {
      const payload = {
        query: { scope, persona, action, rules, knowledge },
        synthesisModel: selectedSynthesisModel,
        searchModels: selectedSearchModels,
        apiKeys: apiKeys
      };
      
      const response = await fetch('/api/orchestrate/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi máy chủ: ${response.status}`);
      }

      const data = await response.json();
      setPrompts(data.prompts || {});
      setPlanningSummary(data.planning_summary || '');
      setIsReportMocked(!!data.isMocked);
      setStep('prompts');
    } catch (err: any) {
      console.error(err);
      alert(`Đã xảy ra lỗi lập kế hoạch: ${err.message}`);
      setStep('form');
    }
  };

  // GIAI ĐOẠN 2: THỰC THI API SONG SONG & BIÊN SOẠN TỔNG HỢP
  const handleExecuteResearch = async () => {
    const activeApiKeys = getStoredApiKeys();
    
    // Kiểm tra xem Model Tổng Biên Tập có API Key chưa
    let requiredKeyName = '';
    const synthesisLower = selectedSynthesisModel.toLowerCase();
    if (synthesisLower.includes('claude')) requiredKeyName = 'anthropic';
    else if (synthesisLower.includes('gpt') || synthesisLower.includes('o1')) requiredKeyName = 'openai';
    else if (synthesisLower.includes('gemini')) requiredKeyName = 'google';
    
    if (requiredKeyName && !activeApiKeys[requiredKeyName as keyof typeof activeApiKeys]) {
      alert(`Bạn chưa cấu hình API Key cho ${requiredKeyName.toUpperCase()} - model đang được chọn làm Tổng Biên Tập. Vui lòng thêm Key trong phần Cài đặt trước khi chạy.`);
      setIsSettingsOpen(true);
      return;
    }

    setStep('researching');
    setLoadingMessage('Bắt đầu chuyển giao dữ liệu thô cho Model Tổng Biên Tập...');

    const progressMessages = [
      'Bắt đầu gọi API song song tới các model Tìm Tin (Search)...',
      'Đang truy tìm dữ liệu logistics toàn cầu (Perplexity)...',
      'Đang khai thác dữ liệu chuỗi cung ứng thông minh...',
      'Đang phân tích cấu trúc chi phí & lập luận toán học (DeepSeek)...',
      'Đã thu thập dữ liệu thô. Đang chuyển giao cho Model Tổng Biên Tập...',
      'Tổng Biên Tập đang dịch các thuật ngữ chuyên ngành...',
      'Tổng Biên Tập đang đối chiếu fact-check mâu thuẫn dữ liệu...',
      'Đang biên soạn báo cáo phân tích chiến lược cuối cùng...'
    ];

    let msgIndex = 0;
    const interval = setInterval(() => {
      if (msgIndex < progressMessages.length - 1) {
        msgIndex++;
        setLoadingMessage(progressMessages[msgIndex]);
      }
    }, 4000);

    try {
      const payload = {
        query: { scope, persona, action, rules, knowledge },
        synthesisModel: selectedSynthesisModel,
        searchModels: selectedSearchModels,
        rawInputs: rawInputs,
        apiKeys: activeApiKeys
      };
      
      const response = await fetch('/api/orchestrate/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi máy chủ: ${response.status}`);
      }

      const data = await response.json();
      setReport(data.report || '');
      setSources(data.sources || []);
      setIsReportMocked(!!data.isMocked);
      setStep('result');
      
      loadHistory();
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      alert(`Đã xảy ra lỗi thực thi nghiên cứu: ${err.message}`);
      setStep('prompts');
    }
  };

  // Tải lại nghiên cứu lịch sử
  const handleLoadHistoryItem = (item: ResearchData) => {
    setScope(item.query.scope);
    setPersona(item.query.persona);
    setAction(item.query.action);
    setRules(item.query.rules);
    setKnowledge(item.query.knowledge);
    setPrompts(item.research_prompts);
    setSelectedSearchModels(item.search_models);
    setSelectedSynthesisModel(item.synthesis_model);
    setReport(item.final_report);
    setSources(item.sources);
    setIsReportMocked(false); 
    setStep('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setScope('');
    setPersona('');
    setAction('');
    setRules('');
    setKnowledge('');
    setPrompts({});
    setReport('');
    setSources([]);
    setStep('form');
  };

  if (isCheckingAuth) {
    return <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#F58220] border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 space-y-10 pb-20">
        
        {(step === 'planning' || step === 'researching') && (
          <div className="bg-white p-12 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center justify-center space-y-6 text-center animate-fade min-h-[400px]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-orange-100 border-t-[#F58220] rounded-full animate-spin-fast" />
              <Sparkles className="w-6 h-6 text-[#F58220] absolute inset-0 m-auto animate-pulse" />
            </div>
            
            <div className="space-y-2 max-w-lg">
              <h3 className="text-base md:text-lg font-bold text-gray-800">
                {step === 'planning' ? 'Đang Thiết Lập Kế Hoạch Nghiên Cứu' : 'Đang Điều Phối Hai Giai Đoạn'}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 font-medium">
                {loadingMessage}
              </p>
            </div>

            <div className="w-full max-w-xs bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#F58220] h-full transition-all duration-1000" 
                style={{ 
                  width: step === 'planning' ? '40%' : '75%',
                  animation: 'pulse 1.5s infinite'
                }} 
              />
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-12">
            
            <div className="bg-gradient-to-r from-orange-50 to-white p-6 rounded-2xl border border-orange-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <h2 className="text-lg md:text-xl font-black text-gray-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#F58220]" />
                  NexusAI: Nền Tảng Nghiên Cứu Chiến Lược
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
                  Ứng dụng điều phối hai giai đoạn chuyên sâu: Lập kế hoạch sinh prompt bằng mô hình Tổng biên tập thượng tầng, chạy song song tìm kiếm dữ liệu thị trường và biên soạn báo cáo hoàn chỉnh.
                </p>
              </div>
            </div>

            <ModelSelection
              selectedSearchModels={selectedSearchModels}
              setSelectedSearchModels={setSelectedSearchModels}
              selectedSynthesisModel={selectedSynthesisModel}
              setSelectedSynthesisModel={setSelectedSynthesisModel}
            />

            <ResearchForm
              scope={scope}
              setScope={setScope}
              persona={persona}
              setPersona={setPersona}
              action={action}
              setAction={setAction}
              rules={rules}
              setRules={setRules}
              knowledge={knowledge}
              setKnowledge={setKnowledge}
              onSubmit={handlePlanResearch}
              isLoading={false}
            />

            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md border border-gray-100 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#F58220]" />
                  <h3 className="font-bold text-gray-800 text-sm md:text-base">Lịch Sử Nghiên Cứu ({history.length})</h3>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Database: <strong>{dbStatusText}</strong></span>
                </div>
              </div>

              {isLoadingHistory ? (
                <div className="text-center py-8 text-xs text-gray-500">Đang tải lịch sử...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-xs text-gray-400">Chưa có phân tích chiến lược nào được lưu trữ.</p>
                  <p className="text-[10px] text-gray-400 mt-1">Các báo cáo sau khi hoàn tất bấm 'Lưu vào Database' sẽ xuất hiện ở đây.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleLoadHistoryItem(item)}
                      className="p-4 rounded-xl border border-gray-200 hover:border-[#F58220] hover:bg-orange-50/20 cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : ''}
                          </span>
                          <span className="text-[9px] font-bold text-[#F58220] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                            {item.synthesis_model.split(' ')[0]}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-[#F58220] transition-colors">
                          {item.query.scope}
                        </h4>
                        <p className="text-[10px] text-gray-500 line-clamp-2">
                          <strong>Role:</strong> {item.query.persona}
                        </p>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                        <span>{item.search_models.length} Search Bots</span>
                        <span className="font-semibold text-[#F58220] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Xem báo cáo
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* STEP 3: DUYỆT PROMPTS */}
        {step === 'prompts' && (
          <PromptReview
            prompts={prompts}
            setPrompts={setPrompts}
            planningSummary={planningSummary}
            onBack={() => setStep('form')}
            onConfirm={() => {
              // Khởi tạo state rỗng cho rawInputs dựa trên các model đã chọn
              const initialRawInputs: Record<string, string> = {};
              selectedSearchModels.forEach(m => initialRawInputs[m] = '');
              setRawInputs(initialRawInputs);
              setStep('manual_input');
            }}
            isLoading={false}
            isMocked={isReportMocked}
          />
        )}

        {/* STEP 4: NHẬP DỮ LIỆU THÔ (MANUAL INPUT) */}
        {step === 'manual_input' && (
          <ManualInputForm
            models={selectedSearchModels}
            rawInputs={rawInputs}
            setRawInputs={setRawInputs}
            onBack={() => setStep('prompts')}
            onSubmit={handleExecuteResearch}
            isLoading={false}
          />
        )}

        {/* STEP 4: KẾT QUẢ BÁO CÁO CỐT LÕI */}
        {step === 'result' && (
          <ReportView
            report={report}
            sources={sources}
            query={{ scope, persona, action, rules, knowledge }}
            searchModels={selectedSearchModels}
            synthesisModel={selectedSynthesisModel}
            prompts={prompts}
            rawInputs={rawInputs}
            isMocked={isReportMocked}
            onReset={handleReset}
          />
        )}

        </main>
      </div>

      {/* Settings Drawer */}
      <SettingsSidebar 
        isOpen={isSettingsOpen} 
        onClose={() => {
          setIsSettingsOpen(false);
          loadHistory(); // Load lại history ngộ nhỡ env thay đổi
        }} 
      />
    </div>
  );
}
