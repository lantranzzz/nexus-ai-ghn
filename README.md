# 🍊 NexusAI - GHN Research Tool (Hệ thống Nghiên cứu Đối thủ & Chiến dịch)

NexusAI là một ứng dụng Web Full-stack hoàn chỉnh được phát triển trên nền tảng **Next.js 15 (App Router)** và **TypeScript**, thiết kế riêng biệt theo quy chuẩn nhận diện thương hiệu của **Giao Hàng Nhanh (GHN)**. 

Hệ thống được thiết kế đặc thù cho **Strategy Manager** (không cần biết viết code) để nghiên cứu các đối thủ cạnh tranh thị trường (như J&T Express, SPX, Viettel Post...) và phân tích xu hướng logistics thông qua cơ chế điều phối AI hai giai đoạn (Two-stage Orchestration) cực kỳ chuyên sâu.

---

## 🗺️ Bản đồ Cấu trúc Thư mục (Explorer Directory Structure)

Dưới đây là sơ đồ chi tiết các tệp tin đã được tạo lập trong dự án của bạn và vai trò của từng tệp:

```text
nexusai/
├── 📁 public/                  # Tài nguyên tĩnh (Favicon, hình ảnh)
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 api/
│   │   │   └── 📁 orchestrate/
│   │   │       ├── 📁 plan/
│   │   │       │   └── 📄 route.ts      # [API Giai đoạn 1] Sinh prompt riêng biệt cho từng chatbot
│   │   │       └── 📁 research/
│   │   │           └── 📄 route.ts      # [API Giai đoạn 2] Gọi API song song & Tổng hợp báo cáo chiến lược
│   │   ├── 📄 globals.css       # [Branding UI] Toàn bộ hệ thống Vanilla CSS chuẩn màu cam GHN (#F58220)
│   │   ├── 📄 layout.tsx        # Cấu hình Layout tổng thể, SEO Metadata và Font hỗ trợ tiếng Việt
│   │   └── 📄 page.tsx          # [Dashboard Core] Trực quan hóa luồng điều phối chính & danh sách lịch sử
│   ├── 📁 components/           # Các component giao diện dạng khối (Modular Components)
│   │   ├── 📄 Header.tsx        # Thanh điều hướng trên cùng, logo GHN, nút kích hoạt sidebar bánh răng
│   │   ├── 📄 ModelSelection.tsx# Giao diện Khu vực 1 (Chọn Search song song) & Khu vực 2 (Chọn Synthesis)
│   │   ├── 📄 PromptReview.tsx  # Giao diện xem và chỉnh sửa trực tiếp các prompt đề xuất
│   │   ├── 📄 ReportView.tsx    # Trình đọc báo cáo Markdown, tải file .md, lưu database & trích lọc nguồn
│   │   ├── 📄 ResearchForm.tsx  # Biểu mẫu 3 trường thông tin chuyên sâu kèm các bộ dữ liệu mẫu (Templates)
│   │   └── 📄 SettingsSidebar.tsx# Sidebar bánh răng bảo mật cao, lưu API Keys vào LocalStorage của bạn
│   └── 📁 lib/                  # Thư viện core logic và kết nối hệ thống ngoài
│       ├── 📄 ai.ts             # Bộ Router API đa nhà cung cấp (OpenAI, Anthropic, Google, Perplexity, DeepSeek, Kimi)
│       └── 📄 supabase.ts       # Kết nối database Supabase với công nghệ tự động sao lưu dự phòng (LocalStorage Fallback)
├── 📄 package.json              # Quản lý các thư viện cài đặt (Next.js, Supabase, Lucide Icons)
├── 📄 tsconfig.json             # Cấu hình trình biên dịch TypeScript
└── 📄 supabase_schema.sql       # Lệnh khởi tạo bảng cơ sở dữ liệu trên Supabase
```

---

## ⚡ Hướng dẫn cài đặt và chạy thử trên máy tính của bạn (Localhost:3000)

Strategy Manager có thể dễ dàng chạy ứng dụng trên máy cá nhân theo các bước cực kỳ rõ ràng dưới đây:

### Bước 1: Mở Terminal của bạn (PowerShell hoặc CMD)
Nếu bạn đang sử dụng VS Code, hãy nhấn tổ hợp phím ``Ctrl + ` `` hoặc chọn **Terminal > New Terminal** ở menu phía trên.

### Bước 2: Di chuyển vào thư mục dự án NexusAI
*Lưu ý: Không dùng lệnh `cd` nếu chạy trực tiếp qua hệ thống tự động, nhưng trên máy tính cá nhân của bạn, hãy gõ lệnh:*
```bash
cd "c:\Users\lantn\Desktop\Antigravity Training\nexusai"
```

### Bước 3: Cài đặt các thư viện cần thiết (Dependencies)
Do toàn bộ cấu hình đã được cấu trúc hoàn tất, bạn chỉ cần gõ lệnh sau để hệ thống tự tải các gói thư viện (như các Icon đẹp mắt và bộ kết nối Database):
```bash
npm install
```

### Bước 4: Khởi chạy môi trường phát triển (Run App)
Chạy lệnh dưới đây để khởi động máy chủ cục bộ:
```bash
npm run dev
```

### Bước 5: Truy cập trên trình duyệt
Mở trình duyệt web của bạn (Chrome, Edge, Firefox) và truy cập đường link sau:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🌟 Các Tính năng Chiến lược Đỉnh cao được Tích hợp

1. **Giao diện bóng bẩy chuẩn GHN (Corporate Branding):**
   - Sự kết hợp tinh tế giữa màu **Cam đặc trưng của GHN (#F58220)** làm điểm nhấn, nền trắng và xám nhạt cao cấp giúp nhân viên văn phòng không bị mỏi mắt.
   - Hiệu ứng chuyển động mượt mà, hover nổi bật và bo góc hiện đại theo phong cách Enterprise.

2. **Cơ chế Lập kế hoạch 2 Giai đoạn chặt chẽ (Orchestration):**
   - **Giai đoạn 1:** Khi bạn nhập 3 trường định hướng và bấm **"Lập Kế Hoạch"**, AI Tổng Biên Tập sẽ phân tích nghiệp vụ và sinh ra các đoạn prompt tối ưu riêng biệt cho từng con bot tìm kiếm. Bạn có thể tự tay chỉnh sửa lại các prompt này theo ý mình.
   - **Giai đoạn 2:** Hệ thống kích hoạt API **chạy song song đồng thời** tới các chatbot đã chọn. Sau khi thu thập dữ liệu thô, AI Tổng Biên Tập sẽ tự động dịch thuật ngữ Trung-Anh, đối chiếu chéo (Fact-check) tìm mâu thuẫn số liệu, và viết thành báo cáo chiến lược hoàn chỉnh.

3. **Chế độ Thử nghiệm Thông minh (Demo Mode out of the box):**
   - Nếu bạn chưa có sẵn API Keys của 6 nhà cung cấp, hệ thống **không báo lỗi**. Hệ thống sẽ tự động kích hoạt **Trình Giả Lập Trí Tuệ** sinh ra các dữ liệu phân tích cực kỳ sâu sắc và thực tế dựa trên chính 3 trường thông tin bạn đã nhập. Bạn có thể bấm test thử nghiệm đầy đủ quy trình ngay lập tức!
   - Khi bạn đã sẵn sàng sử dụng dữ liệu thật, chỉ cần nhấn biểu tượng **Bánh răng** ở góc trên bên phải để điền API Keys cá nhân.

4. **Đồng bộ Database Kép (Supabase Cloud + Local Fallback):**
   - Khi báo cáo phân tích hoàn thành, bạn có thể nhấn **"Lưu vào Database"**.
   - Nếu bạn chưa cấu hình biến môi trường Supabase (`NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`), hệ thống sẽ **tự động lưu vào bộ nhớ trình duyệt của bạn (LocalStorage)**.
   - Bạn sẽ nhìn thấy ngay danh sách lịch sử các nghiên cứu của mình được liệt kê trực quan ở cuối trang chủ, cho phép xem lại bất cứ lúc nào!

5. **Xuất bản & Tải báo cáo:**
   - Bạn có thể **Copy nhanh** toàn bộ báo cáo hoặc **Tải file định dạng Markdown (.md)** về máy tính để gửi cho Ban Giám đốc chỉ với một cú click chuột.

---

## 🛠️ Hướng dẫn tích hợp Supabase Cloud thực tế

Để đồng bộ các báo cáo chiến lược lên Cloud Database, bạn chỉ cần làm theo 2 bước đơn giản:

1. **Khởi tạo bảng:**
   Vào tài khoản Supabase của bạn, mở mục **SQL Editor**, tạo một bảng mới bằng cách dán toàn bộ đoạn code trong tệp `supabase_schema.sql` (nằm ngoài thư mục dự án) và bấm **Run**.

2. **Cấu hình biến môi trường:**
   Tạo một tệp mang tên `.env.local` nằm tại thư mục gốc của dự án `nexusai/` với nội dung sau:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=đường_dẫn_supabase_project_của_bạn
   NEXT_PUBLIC_SUPABASE_ANON_KEY=mã_anon_key_của_bạn
   ```
   Sau khi lưu tệp, khởi động lại server (`npm run dev`), hệ thống sẽ lập tức chuyển sang chế độ **Đồng bộ Cloud Supabase** tự động!
