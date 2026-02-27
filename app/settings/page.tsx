"use client";

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1"
          style={{ background: "linear-gradient(135deg, #38E1FF 0%, #51F3FF 50%, #20CFED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 10px rgba(56,225,255,0.35))" }}>Cài đặt</h1>
        <p className="text-sm" style={{ color: "#6B9AC4" }}>Tùy chỉnh ứng dụng và các cấu hình hệ thống.</p>
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
            style={{ background: "linear-gradient(135deg, rgba(13,37,72,0.95) 0%, rgba(10,29,60,0.98) 100%)", backdropFilter: "blur(16px)", border: "1px solid rgba(56,225,255,0.12)", boxShadow: "0 4px 24px -4px rgba(56,225,255,0.06), 0 1px 3px rgba(0,0,0,0.4)" }}
          >
            <div>
              <p className="font-semibold" style={{ color: "#EEF6FF" }}>{section.label}</p>
              <p className="text-sm mt-0.5" style={{ color: "#6B9AC4" }}>{section.desc}</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(56,225,255,0.08)", color: "#38E1FF", border: "1px solid rgba(56,225,255,0.20)" }}>
              Sắp ra mắt
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl px-6 py-5"
        style={{ background: "linear-gradient(135deg, rgba(14,111,174,0.15), rgba(18,184,232,0.08))", backdropFilter: "blur(12px)", border: "1px solid rgba(56,225,255,0.25)", boxShadow: "0 4px 20px -4px rgba(56,225,255,0.15)" }}>
        <p className="text-sm font-semibold mb-1" style={{ color: "#38E1FF" }}>Kết nối Supabase</p>
        <p className="text-sm" style={{ color: "#87AFCF" }}>
          Dữ liệu được lưu trữ và đồng bộ qua Supabase (PostgreSQL). Mọi thay đổi được cập nhật realtime lên cloud.
        </p>
      </div>
    </div>
  );
}
