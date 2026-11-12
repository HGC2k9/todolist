-- ============================================================
-- D1 Database Seed Data (Dữ liệu mẫu cho môi trường dev/demo)
-- ============================================================
-- Tài khoản mặc định:
--   Email: demo@example.com
--   Password: password123
--   User ID: user-demo-001
-- ============================================================

-- Chèn người dùng demo
INSERT OR REPLACE INTO users (id, email, username, password_hash, salt, created_at)
VALUES (
  'user-demo-001',
  'demo@example.com',
  'Demo User',
  '79c53641bf578e8aa2b97c23bc909873fcb5961d563be8df5e8c757c96cf78d1',
  'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-7 days')
);

-- Chèn các công việc mẫu phong phú (Chuẩn ISO 8601 UTC)
-- 1. Việc quá hạn (Overdue) - High priority
INSERT OR REPLACE INTO todos (id, user_id, title, description, category, priority, due_date, is_completed, is_pinned, created_at, updated_at)
VALUES (
  'todo-seed-001',
  'user-demo-001',
  'Nộp báo cáo tài chính Quý 3',
  'Tổng hợp số liệu từ các phòng ban kế toán và gửi CFO trước 17h.',
  'Work',
  'High',
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-2 days'),
  0,
  0,
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-5 days'),
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-5 days')
);

-- 2. Việc hôm nay - High priority (Được ghim lên đầu 📌)
INSERT OR REPLACE INTO todos (id, user_id, title, description, category, priority, due_date, is_completed, is_pinned, created_at, updated_at)
VALUES (
  'todo-seed-002',
  'user-demo-001',
  'Review mã nguồn & Deploy To-Do List lên Cloudflare D1',
  'Kiểm tra lại cấu hình wrangler.toml và test local dev kỹ lưỡng.',
  'Work',
  'High',
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '+4 hours'),
  0,
  1,
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 days'),
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 days')
);

-- 3. Việc cá nhân sắp tới - Medium priority
INSERT OR REPLACE INTO todos (id, user_id, title, description, category, priority, due_date, is_completed, is_pinned, created_at, updated_at)
VALUES (
  'todo-seed-003',
  'user-demo-001',
  'Mua sắm đồ gia dụng cuối tuần',
  'Bao gồm: cà phê hạt, sữa yến mạch, hoa quả tươi và bánh mì ngũ cốc.',
  'Shopping',
  'Medium',
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '+3 days'),
  0,
  0,
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-2 hours'),
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-2 hours')
);

-- 4. Học tập - Low priority
INSERT OR REPLACE INTO todos (id, user_id, title, description, category, priority, due_date, is_completed, is_pinned, created_at, updated_at)
VALUES (
  'todo-seed-004',
  'user-demo-001',
  'Đọc tài liệu Cloudflare Workers KV vs Hyperdrive',
  'Nghiên cứu cơ chế pooling connection của Hyperdrive cho PostgreSQL.',
  'Study',
  'Low',
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '+7 days'),
  0,
  0,
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-10 hours'),
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-10 hours')
);

-- 5. Việc đã hoàn thành (Completed)
INSERT OR REPLACE INTO todos (id, user_id, title, description, category, priority, due_date, is_completed, is_pinned, created_at, updated_at)
VALUES (
  'todo-seed-005',
  'user-demo-001',
  'Tập thể dục buổi sáng 30 phút',
  'Chạy bộ 4km quanh công viên gần nhà.',
  'Health',
  'Medium',
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-6 hours'),
  1,
  0,
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-12 hours'),
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-5 hours')
);
