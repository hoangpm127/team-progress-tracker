"use client";

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1 uppercase tracking-tight text-center" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "0.12em" }}>Cài đặt</h1>
        <p className="text-slate-500 text-sm">Tùy chỉnh ứng dụng và các cấu hình hệ thống.</p>
      </div>

      {/* Placeholder sections */}
      <div className="space-y-4">
        {[
          { label: "Chung", desc: "Tên không gian làm việc, múi giờ và ngôn ngữ hiển thị." },
          { label: "Thông báo", desc: "Cấu hình quy tắc thông báo qua email và trong ứng dụng." },
          { label: "Tích hợp", desc: "Kết nối với Slack, Jira hoặc các công cụ bên thứ ba." },
          { label: "Dữ liệu & Quyền riêng tư", desc: "Xuất hoặc xóa dữ liệu theo dõi của bạn." },
        ].map((section) => (
          <div
            key={section.label}
            className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5"
          >
            <div>
              <p className="font-semibold text-slate-800">{section.label}</p>
              <p className="text-sm text-slate-400 mt-0.5">{section.desc}</p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-400 px-3 py-1 rounded-full">
              Sắp ra mắt
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-5">
        <p className="text-sm font-semibold text-indigo-700 mb-1">Chế độ Demo</p>
        <p className="text-sm text-indigo-500">
          Ứng dụng chạy hoàn toàn trên trình duyệt, dữ liệu được lưu qua localStorage. Không có dữ liệu nào gửi lên máy chủ.
        </p>
      </div>
    </div>
  );
}
