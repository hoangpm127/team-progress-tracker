"use client";

export default function SettingsPage() {
  return (
    <div className="relative min-h-screen"
      style={{ backgroundImage: 'url("/bg-settings.png")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(18,18,18,0.50)", zIndex: 0 }} />
    <div className="relative p-6 md:p-8 max-w-3xl mx-auto" style={{ zIndex: 1 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1"
          style={{ color: "#ffffff" }}>Cài đặt</h1>
        <p className="text-sm" style={{ color: "#aaaaaa" }}>Tùy chỉnh ứng dụng và các cấu hình hệ thống.</p>
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
            className="flex items-center justify-between rounded-2xl px-6 py-5 backdrop-blur-md"
            style={{ background: "rgba(20,20,20,0.22)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.4)" }}
          >
            <div>
              <p className="font-semibold" style={{ color: "#ffffff" }}>{section.label}</p>
              <p className="text-sm mt-0.5" style={{ color: "#aaaaaa" }}>{section.desc}</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "#aaaaaa", border: "1px solid rgba(255,255,255,0.12)" }}>
              Sắp ra mắt
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl px-6 py-5 backdrop-blur-md"
        style={{ background: "rgba(20,20,20,0.22)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.3)" }}>
        <p className="text-sm font-semibold mb-1" style={{ color: "#cccccc" }}>Kết nối Supabase</p>
        <p className="text-sm" style={{ color: "#aaaaaa" }}>
          Dữ liệu được lưu trữ và đồng bộ qua Supabase (PostgreSQL). Mọi thay đổi được cập nhật realtime lên cloud.
        </p>
      </div>
    </div>
    </div>
  );
}
