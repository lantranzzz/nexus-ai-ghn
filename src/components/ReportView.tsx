import React, { useState } from 'react';
import { 
  FileText, Download, Save, ExternalLink, RefreshCw, 
  CheckCircle, Database, AlertCircle, Copy, Check, ArrowLeft
} from 'lucide-react';
import { saveResearch } from '@/lib/supabase';

interface Source {
  title: string;
  url: string;
}

// Chỉ cho phép http/https. Nguồn (sources) đến từ output AI (không tin cậy) nên
// phải chặn các scheme nguy hiểm như javascript:/data: để tránh XSS khi bấm link.
const sanitizeUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
};

interface ReportViewProps {
  report: string;
  sources: Source[];
  query: {
    scope: string;
    persona: string;
    action: string;
    rules: string;
    knowledge: string;
  };
  searchModels: string[];
  synthesisModel: string;
  prompts: Record<string, string>;
  rawInputs: Record<string, string>;
  isMocked: boolean;
  // Các Search Model bị bỏ qua khi tự động research (thiếu API Key / gọi lỗi) -> đã dùng dữ liệu mẫu tham khảo thay thế.
  skippedModels?: { model: string; reason: string }[];
  researchWarning?: string;
  onReset: () => void;
  onBackToInput: () => void;
}

// BỘ PARSER MARKDOWN THỦ CÔNG CỰC KỲ MẠNH MẼ VÀ AN TOÀN
// RENDER FULLTABLES, HEADINGS, LISTS VÀ BLOCKQUOTES BẰNG VANILLA REACT MÀ KHÔNG LO LỖI BUILD
const parseMarkdownToReact = (text: string): React.ReactNode[] => {
  if (!text) return [];
  
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentTable: { headers: string[]; rows: string[][] } | null = null;
  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;
  
  // Hàm xử lý văn bản thường chứa bold, italic, code
  const formatText = (txt: string): React.ReactNode[] => {
    let parts: React.ReactNode[] = [];
    let currentStr = txt;
    
    // Tìm và định dạng Bold **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;
    
    const tokenized: { type: 'text' | 'bold' | 'code'; content: string }[] = [];
    
    // Một giải pháp đơn giản thay thế regex phức tạp để format bold và inline code
    let i = 0;
    while (i < txt.length) {
      if (txt.substring(i, i + 2) === '**') {
        const nextBold = txt.indexOf('**', i + 2);
        if (nextBold !== -1) {
          tokenized.push({ type: 'bold', content: txt.substring(i + 2, nextBold) });
          i = nextBold + 2;
          continue;
        }
      }
      if (txt[i] === '`') {
        const nextCode = txt.indexOf('`', i + 1);
        if (nextCode !== -1) {
          tokenized.push({ type: 'code', content: txt.substring(i + 1, nextCode) });
          i = nextCode + 1;
          continue;
        }
      }
      
      const lastToken = tokenized[tokenized.length - 1];
      if (lastToken && lastToken.type === 'text') {
        lastToken.content += txt[i];
      } else {
        tokenized.push({ type: 'text', content: txt[i] });
      }
      i++;
    }
    
    return tokenized.map((t, idx) => {
      if (t.type === 'bold') {
        return <strong key={idx} className="font-bold text-gray-900">{t.content}</strong>;
      }
      if (t.type === 'code') {
        return <code key={idx} className="bg-gray-100 text-red-600 px-1 py-0.5 rounded font-mono text-xs">{t.content}</code>;
      }
      return t.content;
    });
  };

  const flushList = (key: number) => {
    if (currentList) {
      const ListTag = currentList.type;
      elements.push(
        <ListTag key={`list-${key}`} className={currentList.type === 'ul' ? 'list-disc pl-6 mb-4 text-gray-700' : 'list-decimal pl-6 mb-4 text-gray-700'}>
          {currentList.items.map((item, idx) => (
            <li key={idx} className="mb-1.5">{item}</li>
          ))}
        </ListTag>
      );
      currentList = null;
    }
  };

  const flushTable = (key: number) => {
    if (currentTable) {
      elements.push(
        <div key={`table-container-${key}`} className="overflow-x-auto w-full mb-6 rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-xs md:text-sm">
            <thead className="bg-orange-50">
              <tr>
                {currentTable.headers.map((h, idx) => (
                  <th key={idx} className="px-4 py-3 text-left font-bold text-gray-700 border-b border-gray-200 uppercase tracking-wider">
                    {formatText(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentTable.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-3 text-gray-700 whitespace-normal border-b border-gray-100">
                      {formatText(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    // 1. XỬ LÝ TABLES
    if (trimmed.startsWith('|')) {
      flushList(idx);
      
      const cells = line.split('|').map(c => c.trim()).filter((_, index, arr) => index > 0 && index < arr.length - 1);
      
      // Bỏ qua dòng căn lề kiểu | :--- | :--- |
      if (trimmed.includes('---')) {
        continue;
      }
      
      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      flushTable(idx);
    }

    // 2. XỬ LÝ LISTS
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      const isOrdered = /^\d+\.\s/.test(trimmed);
      const content = isOrdered ? trimmed.replace(/^\d+\.\s/, '') : trimmed.substring(2);
      
      if (!currentList) {
        currentList = { 
          type: isOrdered ? 'ol' : 'ul', 
          items: [formatText(content)] 
        };
      } else {
        // Nếu đổi loại list, flush cũ ra
        if ((isOrdered && currentList.type === 'ul') || (!isOrdered && currentList.type === 'ol')) {
          flushList(idx);
          currentList = { 
            type: isOrdered ? 'ol' : 'ul', 
            items: [formatText(content)] 
          };
        } else {
          currentList.items.push(formatText(content));
        }
      }
      continue;
    } else {
      flushList(idx);
    }

    // 3. XỬ LÝ HEADINGS
    if (trimmed.startsWith('#')) {
      const level = (trimmed.match(/^#+/) || [''])[0].length;
      const content = trimmed.replace(/^#+\s*/, '');
      const formatted = formatText(content);
      
      if (level === 1) {
        elements.push(
          <h1 key={idx} className="text-xl md:text-2xl font-black text-[#F58220] border-b-2 border-orange-100 pb-2.5 mt-6 mb-4 flex items-center gap-2">
            {formatted}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2 key={idx} className="text-base md:text-lg font-bold text-gray-800 border-l-4 border-[#F58220] pl-3 mt-5 mb-3">
            {formatted}
          </h2>
        );
      } else if (level === 3) {
        elements.push(
          <h3 key={idx} className="text-sm md:text-base font-bold text-gray-700 mt-4 mb-2">
            {formatted}
          </h3>
        );
      } else {
        elements.push(
          <h4 key={idx} className="text-xs md:text-sm font-semibold text-gray-600 mt-3 mb-1.5 uppercase">
            {formatted}
          </h4>
        );
      }
      continue;
    }

    // 4. XỬ LÝ BLOCKQUOTES
    if (trimmed.startsWith('>')) {
      const content = trimmed.substring(1).trim();
      elements.push(
        <blockquote key={idx} className="border-l-4 border-gray-300 pl-4 py-1.5 italic text-gray-500 mb-4 text-xs md:text-sm bg-gray-50 rounded-r-lg pr-4">
          {formatText(content)}
        </blockquote>
      );
      continue;
    }

    // 5. DÒNG PHÂN CÁCH ---
    if (trimmed === '---') {
      elements.push(<hr key={idx} className="my-6 border-gray-200" />);
      continue;
    }

    // 6. DÒNG TRỐNG
    if (trimmed === '') {
      continue;
    }

    // 7. VĂN BẢN THƯỜNG
    elements.push(
      <p key={idx} className="mb-4 text-xs md:text-sm text-gray-700 leading-relaxed text-justify">
        {formatText(trimmed)}
      </p>
    );
  }

  // Khóa sổ nếu còn list hoặc table sót
  flushList(lines.length);
  flushTable(lines.length);

  return elements;
};

export default function ReportView({
  report,
  sources,
  query,
  searchModels,
  synthesisModel,
  prompts,
  rawInputs,
  isMocked,
  skippedModels = [],
  researchWarning = '',
  onReset,
  onBackToInput
}: ReportViewProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLocalSaved, setIsLocalSaved] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Copy báo cáo vào bộ nhớ tạm
  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tải báo cáo về máy (.md)
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([report], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `GHN_Research_Report_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Lưu báo cáo lên Supabase (hoặc LocalStorage fallback)
  const handleSaveToDb = async () => {
    setSaveStatus('saving');
    
    const result = await saveResearch({
      query,
      research_prompts: prompts,
      search_models: searchModels,
      synthesis_model: synthesisModel,
      raw_inputs: rawInputs,
      final_report: report,
      sources
    });

    if (result.success) {
      setSaveStatus('success');
      setIsLocalSaved(result.isLocalFallback);
      setTimeout(() => setSaveStatus('idle'), 4000);
    } else {
      setSaveStatus('error');
      setErrorMessage(result.error || 'Lỗi không xác định');
    }
  };

  return (
    <div className="space-y-6 animate-fade">
      
      {/* Thanh công cụ hành động phía trên */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#F58220]" />
          <div>
            <h4 className="text-xs md:text-sm font-bold text-gray-800">Báo Cáo Đã Sẵn Sàng</h4>
            <p className="text-[11px] text-gray-500">Biên soạn hoàn chỉnh theo tiêu chuẩn Strategy Manager</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Nút Copy */}
          <button
            onClick={handleCopy}
            className="text-xs px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 font-semibold border border-gray-200 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép</span>
              </>
            )}
          </button>

          {/* Nút Tải về */}
          <button
            onClick={handleDownload}
            className="text-xs px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 font-semibold border border-gray-200 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            Tải File .MD
          </button>

          {/* Nút Lưu dữ liệu */}
          <button
            onClick={handleSaveToDb}
            disabled={saveStatus === 'saving'}
            className={`text-xs px-4 py-2 font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              saveStatus === 'saving' 
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md'
            }`}
          >
            <Save className="w-4 h-4" />
            {saveStatus === 'saving' ? 'Đang lưu...' : 'Lưu vào Database'}
          </button>

          {/* Nút quay lại chỉnh Prompt & chạy lại nghiên cứu tự động */}
          <button
            onClick={onBackToInput}
            className="text-xs px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer transition-colors border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Chỉnh sửa Prompt & Chạy lại
          </button>

          {/* Nút Tạo lại từ đầu */}
          <button
            onClick={onReset}
            className="text-xs px-4 py-2 bg-[#F58220] hover:bg-[#E06B16] text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Nghiên Cứu Mới
          </button>
        </div>
      </div>

      {/* Thông báo trạng thái lưu */}
      {saveStatus === 'success' && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fade ${
          isLocalSaved 
            ? 'bg-amber-50 border-amber-200 text-amber-900' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
        }`}>
          {isLocalSaved ? (
            <>
              <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Đã lưu trữ thành công vào LocalStorage (Offline Mode)!</p>
                <p className="mt-0.5 opacity-90">Supabase chưa được cấu hình. Hệ thống đã lưu trữ cục bộ để bạn có thể xem lại lịch sử nghiên cứu sau này.</p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Đã đồng bộ lên Cloud Database Supabase thành công!</p>
                <p className="mt-0.5 opacity-90">Dữ liệu phân tích đã được lưu trữ an toàn trong bảng <strong>`researches`</strong> trên Cloud.</p>
              </div>
            </>
          )}
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl flex items-start gap-3 animate-fade">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Không thể lưu dữ liệu!</p>
            <p className="mt-0.5 opacity-90">Chi tiết lỗi: {errorMessage}</p>
          </div>
        </div>
      )}

      {/* Cảnh báo các Search Model bị bỏ qua khi tự động research (thiếu API Key / gọi lỗi) */}
      {!isMocked && skippedModels.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1.5">
            <p className="font-bold uppercase">Một số Search Model dùng dữ liệu mẫu tham khảo</p>
            <p className="opacity-90">
              Hệ thống không gọi API thật được cho các model dưới đây, nên đã dùng dữ liệu mẫu tham khảo thay thế. Hãy thận trọng khi trích dẫn các phần liên quan trong báo cáo, hoặc bổ sung API Key rồi chạy lại.
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              {skippedModels.map((s, i) => (
                <li key={i}><strong>{s.model}:</strong> {s.reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {researchWarning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">{researchWarning}</div>
        </div>
      )}

      {/* Hiển thị Banner Chạy Thử Nghiệm */}
      {isMocked && (
        <div className="bg-orange-50 border border-orange-200 text-gray-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#F58220] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-[#F58220] uppercase">Chạy thử nghiệm (Demo Mode)</p>
            <p className="mt-0.5 text-gray-600">
              Bạn đang xem báo cáo chiến lược giả lập chất lượng cao được thiết kế riêng cho mục tiêu nghiên cứu của bạn. Để chạy API thật lấy tin thời gian thực, hãy mở <strong>Sidebar cấu hình (hình Bánh răng)</strong> ở góc phải Header và nhập API Keys của các model.
            </p>
          </div>
        </div>
      )}

      {/* NỘI DUNG CHÍNH CỦA BÁO CÁO PHÂN TÍCH */}
      <div className="bg-white p-6 md:p-10 rounded-2xl shadow-md border border-gray-100">
        <article className="markdown-body">
          {parseMarkdownToReact(report)}
        </article>

        {/* PHẦN DANH SÁCH CÁC NGUỒN TRÍCH DẪN RIÊNG BIỆT Ở CUỐI */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <h4 className="text-xs md:text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-[#F58220]" />
            Chi Tiết Danh Sách Nguồn Trích Dẫn (Sources)
          </h4>
          
          {sources && sources.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pl-0 list-none">
              {sources.map((src, i) => {
                const safeHref = sanitizeUrl(src.url);
                const innerContent = (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-800 group-hover:text-[#F58220] transition-colors line-clamp-1">
                        {src.title}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono truncate max-w-[280px]">
                        {src.url}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#F58220] transition-colors shrink-0 mt-0.5" />
                  </>
                );
                return (
                  <li key={i} className="pl-0">
                    {safeHref ? (
                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 rounded-xl flex items-start justify-between gap-3 group transition-all h-full"
                        style={{ textDecoration: 'none' }}
                      >
                        {innerContent}
                      </a>
                    ) : (
                      // URL không hợp lệ / scheme không an toàn: hiển thị nhưng không cho bấm.
                      <div
                        className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-start justify-between gap-3 group h-full opacity-70"
                        title="Nguồn không có URL hợp lệ (đã bị chặn vì lý do bảo mật)"
                      >
                        {innerContent}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-600 leading-relaxed">
                <p className="font-bold">Không có nguồn trích dẫn cụ thể (No external sources provided)</p>
                <p className="mt-0.5">
                  Mô hình AI biên tập đã sử dụng kiến thức nội tại hoặc dữ liệu được cung cấp chưa chứa các đường dẫn web cụ thể. Hệ thống tuân thủ nguyên tắc không bịa đặt nguồn (No Hallucination) nên phần này được để trống.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
