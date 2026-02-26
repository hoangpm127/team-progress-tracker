"use client";

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #6d28d9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Cài đặt</h1>
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
            className="flex items-center justify-between rounded-2xl px-6 py-5"
            style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 4px 24px -4px rgba(15,23,42,0.07), 0 1px 3px rgba(0,0,0,0.04)" }}
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

      <div className="mt-8 rounded-2xl px-6 py-5"
        style={{ background: "linear-gradient(135deg, rgba(238,242,255,0.9), rgba(245,243,255,0.9))", backdropFilter: "blur(12px)", border: "1px solid rgba(199,210,254,0.5)", boxShadow: "0 4px 20px -4px rgba(99,102,241,0.12)" }}>
        <p className="text-sm font-semibold text-indigo-700 mb-1">Kết nối Supabase</p>
        <p className="text-sm text-indigo-500">
          Dữ liệu được lưu trữ và đồng bộ qua Supabase (PostgreSQL). Mọi thay đổi được cập nhật realtime lên cloud.
        </p>
      </div>
    </div>
  );
}
