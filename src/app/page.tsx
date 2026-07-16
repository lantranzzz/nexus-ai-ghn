'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import SettingsSidebar, { ApiKeys } from '@/components/SettingsSidebar';
import ModelSelection from '@/components/ModelSelection';
import ResearchForm from '@/components/ResearchForm';
import { getResearches, ResearchData, isSupabaseConfigured, supabase, getApiKeysFromCloud } from '@/lib/supabase';
import { 
  Sparkles, Clock, History, FileText, Database, 
  HelpCircle, ChevronRight, AlertTriangle, ShieldCheck 
} from 'lucide-react';

const Login = dynamic(() => import('@/components/Login'), { ssr: false });
const PromptReview = dynamic(() => import('@/components/PromptReview'), { ssr: false });
const ReportView = dynamic(() => import('@/components/ReportView'), { ssr: false });
const ReportsLibrary = dynamic(() => import('@/components/ReportsLibrary'), { ssr: false });


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
    'ChatGPT (OpenAI)',
    'Claude (Anthropic)',
    'Gemini (Google)',
    'Perplexity',
    'Grok (xAI)'
  ]);
  const [selectedSynthesisModel, setSelectedSynthesisModel] = useState<string>(
    'OpenAI (gpt-5.5)'
  );

  // Tiến trình Orchestration
  // 'form' | 'planning' | 'prompts' | 'researching' | 'result'
  // Lưu ý: không còn bước 'manual_input' — sau khi duyệt prompt, hệ thống tự động gọi
  // API tới từng Search Model bằng API Key người dùng đã cấu hình, không cần copy-paste tay.
  const [step, setStep] = useState<'form' | 'planning' | 'prompts' | 'researching' | 'result'>('form');
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const [prompts, setPrompts] = useState<Record<string, string>>({});
  // Kết quả thô tự động lấy được từ từng Search Model (điền bởi server sau bước research).
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [planningSummary, setPlanningSummary] = useState<string>('');
  const [report, setReport] = useState<string>('');
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [isReportMocked, setIsReportMocked] = useState<boolean>(false);
  // Các Search Model bị bỏ qua khi tự động research (thiếu API Key / gọi lỗi) -> dùng dữ liệu mẫu tham khảo.
  const [skippedModels, setSkippedModels] = useState<{ model: string; reason: string }[]>([]);
  const [researchWarning, setResearchWarning] = useState<string>('');

  // Lịch sử nghiên cứu đã lưu
  const [history, setHistory] = useState<ResearchData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [dbStatusText, setDbStatusText] = useState<string>('LocalStorage');

  // Xác thực
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Tab Điều hướng chính
  const [activeTab, setActiveTab] = useState<'research' | 'library'>('research');

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
          // Kiểm tra session hiện tại, có timeout để tránh treo màn hình loading vô thời hạn
          // nếu getSession() bị kẹt (đã ghi nhận là có thể xảy ra với supabase-js trong một số
          // trường hợp trình duyệt/mạng cụ thể).
          // Optimistic UI: Check local storage first to skip loading screen
          const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
          let hasLocalSession = false;
          try {
            if (storageKey) {
              const raw = localStorage.getItem(storageKey);
              if (raw && JSON.parse(raw).access_token) {
                hasLocalSession = true;
                setIsAuthenticated(true);
                setIsCheckingAuth(false);
                // Background fetch API keys
                getApiKeysFromCloud().then(cloudKeys => {
                  if (cloudKeys) localStorage.setItem('nexusai_api_keys', JSON.stringify(cloudKeys));
                }).catch(() => {});
              }
            }
          } catch (e) {}

          const sessionPromise = supabase.auth.getSession();
          const authTimeoutPromise = new Promise<{ data: { session: any }, error: any }>((_, reject) =>
            setTimeout(() => reject(new Error('Yêu cầu xác thực Supabase quá hạn (Timeout).')), 3000)
          );
          
          const { data: { session }, error } = await Promise.race([sessionPromise, authTimeoutPromise]) as { data: { session: any }, error: any };
          if (error && !hasLocalSession) throw error;
          
          if (session) {
            if (!hasLocalSession) {
              setIsAuthenticated(true);
              getApiKeysFromCloud().then(cloudKeys => {
                if (cloudKeys) {
                  localStorage.setItem('nexusai_api_keys', JSON.stringify(cloudKeys));
                }
              }).catch(e => {
                console.error('Không tải được API Keys:', e);
              });
            }
          } else if (!hasLocalSession) {
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
          // Không cấu hình Supabase -> không có backend xác thực -> chưa đăng nhập.
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra Auth:', err);
        // Fail closed: lỗi xác thực thì coi như chưa đăng nhập, không dựa vào cờ localStorage.
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
    // KHÔNG gọi loadHistory() ở đây — cần đợi checkAuth xác nhận session xong trước
  }, []);

  // Khi trạng thái đăng nhập thay đổi -> tải lịch sử
  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated]);

  // Lấy các API Keys từ LocalStorage khi cần gọi API
  const EMPTY_API_KEYS: ApiKeys = {
    openai: '',
    anthropic: '',
    google: '',
    perplexity: '',
    deepseek: '',
    moonshot: '',
    xai: '',
    qwen: '',
  };

  const getStoredApiKeys = (): ApiKeys => {
    const rawKeys = localStorage.getItem('nexusai_api_keys');
    if (rawKeys) {
      try {
        // Merge với default để không lỗi khi dữ liệu cũ thiếu field mới (xai/qwen).
        return { ...EMPTY_API_KEYS, ...JSON.parse(rawKeys) };
      } catch (e) {
        console.error('Lỗi parse API keys:', e);
      }
    }
    return EMPTY_API_KEYS;
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
    setLoadingMessage('Đang tự động kết nối tới các Search Model đã chọn...');

    const searchModelNames = selectedSearchModels.map(m => m.split(' ')[0]);
    const progressMessages = [
      'Bắt đầu thiết lập truy vấn chiến lược...',
      `Đang điều phối tìm kiếm tới: ${searchModelNames.join(', ')}...`,
      ...searchModelNames.map(model => `Đang trích xuất dữ liệu chuyên sâu từ ${model}...`),
      'Đã thu thập xong dữ liệu thô. Đang chuyển giao cho Tổng Biên Tập...',
      'Tổng Biên Tập đang dịch và chuẩn hóa thuật ngữ chuyên ngành...',
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
        prompts: prompts,
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
      setRawInputs(data.rawInputs || {});
      setSkippedModels(data.skippedModels || []);
      setResearchWarning(data.warning || '');
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
    setRawInputs(item.raw_inputs || {});
    setSkippedModels([]);
    setResearchWarning('');
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
    setRawInputs({});
    setReport('');
    setSources([]);
    setSkippedModels([]);
    setResearchWarning('');
    setStep('form');
  };

  if (isCheckingAuth) {
    return <div className="h-screen bg-[#F6F7F9] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('nexusai_auth');
    localStorage.removeItem('sb-ahtvxyzlkwp-auth-token'); // Clear possible leftover token
    
    // Clear all sb-* tokens aggressively
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key);
      }
    });

    if (isSupabaseConfigured() && supabase) {
      supabase.auth.signOut().catch(error => {
        console.error('Lỗi khi đăng xuất Supabase:', error);
      });
    }
  };

  // View report handler
  const handleViewReport = (data: ResearchData) => {
    setScope(data.query.scope);
    setPersona(data.query.persona);
    setAction(data.query.action);
    setRules(data.query.rules);
    setKnowledge(data.query.knowledge);
    setPrompts(data.research_prompts);
    setSelectedSearchModels(data.search_models);
    setSelectedSynthesisModel(data.synthesis_model);
    setRawInputs(data.raw_inputs || {});
    setReport(data.final_report);
    setSources(data.sources);
    setSkippedModels([]);
    setResearchWarning('');
    setStep('result');
    setActiveTab('research');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar 
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onLogout={handleLogout}
        history={history}
        onNewResearch={() => {
          handleReset();
          setActiveTab('research');
        }}
        onViewReport={handleViewReport}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F8F9FA]">
        <TopNav
          onLogout={handleLogout}
          onOpenSettings={() => setIsSettingsOpen(true)}
          title={activeTab === 'library' ? 'Thư viện báo cáo' : 'Nghiên cứu chiến lược'}
          subtitle={activeTab === 'library' ? 'Quản lý & xem lại các báo cáo đã lưu' : 'Điều phối AI đa mô hình cho Giao Hàng Nhanh'}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          
        {activeTab === 'library' ? (
          <ReportsLibrary 
            history={history} 
            isLoading={isLoadingHistory} 
            onViewReport={handleViewReport} 
          />
        ) : (
          <>
          {/* CÁC BƯỚC CỦA TAB NGHIÊN CỨU CHIẾN LƯỢC */}
          
          {/* STEP 2: LOADING (KẾT HỢP PLANNING & TỔNG HỢP NẾU SKIP) */}
          {(step === 'planning' || step === 'researching') && (
          <div className="surface-card p-12 flex flex-col items-center justify-center space-y-6 text-center animate-fade min-h-[400px]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary-light border-t-primary rounded-full animate-spin-fast" />
              <Sparkles className="w-6 h-6 text-primary absolute inset-0 m-auto animate-pulse" />
            </div>

            <div className="space-y-2 max-w-lg">
              <h3 className="text-base md:text-lg font-bold text-gray-900">
                {step === 'planning' ? 'Đang Thiết Lập Kế Hoạch Nghiên Cứu' : 'Đang Điều Phối Hai Giai Đoạn'}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 font-medium">
                {loadingMessage}
              </p>
            </div>

            <div className="w-full max-w-xs bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-1000"
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

            <div className="bg-gradient-to-r from-primary-light to-white p-6 rounded-2xl border border-primary-light-hover flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <h2 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
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

            <div className="surface-card p-8 md:p-10 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">Lịch Sử Nghiên Cứu ({history.length})</h3>
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
                      className="p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary-light/30 cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : ''}
                          </span>
                          <span className="badge badge-primary text-[9px] px-2 py-0.5">
                            {item.synthesis_model.split(' ')[0]}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {item.query.scope}
                        </h4>
                        <p className="text-[10px] text-gray-500 line-clamp-2">
                          <strong>Role:</strong> {item.query.persona}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                        <span>{item.search_models.length} Search Bots</span>
                        <span className="font-semibold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
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

        {/* STEP 3: DUYỆT PROMPTS -> XÁC NHẬN LÀ HỆ THỐNG TỰ ĐỘNG CHẠY NGHIÊN CỨU LUÔN */}
        {step === 'prompts' && (
          <PromptReview
            prompts={prompts}
            setPrompts={setPrompts}
            planningSummary={planningSummary}
            onBack={() => setStep('form')}
            onConfirm={handleExecuteResearch}
            isLoading={false}
            isMocked={isReportMocked}
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
            skippedModels={skippedModels}
            researchWarning={researchWarning}
            onReset={handleReset}
            onBackToInput={() => setStep('prompts')}
          />
        )}
        </>
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
