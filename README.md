# NTU Training Management System

Hệ thống quản lý đào tạo cho Trường Đại học Nha Trang, xây dựng theo mô hình fullstack:
- Backend: Laravel (PHP 8.2, Laravel 12)
- Frontend: React + TypeScript + Vite
- Database: PostgreSQL 16
- Vận hành đồng bộ bằng Docker Compose

README này tổng hợp từ:
- Cấu trúc source code hiện có trong workspace
- Nội dung nghiệp vụ trong file báo cáo đồ án đính kèm

## 1. Mục tiêu dự án

Xây dựng hệ thống hỗ trợ quản lý đào tạo theo vai trò:
- Sinh viên
- Giảng viên
- Trưởng/phó đơn vị (khoa)
- Chuyên viên phòng đào tạo

Hệ thống hướng đến các nghiệp vụ trọng tâm:
- Xem thời khóa biểu
- Quản lý/xem điểm học phần
- Đăng ký kế hoạch học tập
- Đăng ký học phần
- Mở lớp học phần
- Xếp thời khóa biểu
- Tra cứu chương trình đào tạo
- Quản lý sinh viên và tiến độ đào tạo

## 2. Cấu trúc thư mục dự án

```text
ntu-training-management-system/
|- docker-compose.yml
|- ntu-training-management-system-be/    # Laravel API
|  |- app/
|  |  |- Http/Controllers/               # Controller xử lý request
|  |  |- Models/                         # Eloquent model
|  |  |- Providers/                      # Service providers
|  |- routes/
|  |  |- api.php                         # Định nghĩa API routes
|  |  |- web.php                         # Web routes
|  |- database/
|  |  |- migrations/                     # CSDL migrations
|  |  |- seeders/                        # Dữ liệu mẫu
|  |- config/                            # Cấu hình app
|  |- tests/                             # Unit/Feature tests
|  |- Dockerfile
|
|- ntu-training-management-system-fe/    # React app
|  |- src/
|  |  |- App.tsx                         # UI chính
|  |  |- testApi.ts                      # Gọi API backend test
|  |  |- main.tsx                        # Entry point
|  |- public/
|  |- Dockerfile
```

## 3. Kiến trúc triển khai (Docker)

`docker-compose.yml` hiện tại gồm 3 service:
- `frontend`: build từ `ntu-training-management-system-fe`, map cổng `5173:5173`
- `backend`: build từ `ntu-training-management-system-be`, map cổng `8000:8000`
- `postgres`: sử dụng image `postgres:16-alpine`, map cổng `5432:5432`

Luồng kết nối:
1. Người dùng truy cập giao diện React tại `http://localhost:5173`
2. Frontend gọi API Laravel tại `http://localhost:8000`
3. Backend truy cập PostgreSQL để đọc/ghi dữ liệu nghiệp vụ

## 4. Hiện trạng source code (phiên bản hiện tại)

### Backend
- Đang ở mức khởi tạo cơ bản của Laravel.
- API route đã có sẵn route test:
  - `GET /api/test` trả về JSON: `{ "message": "Backend OK" }`
- Model `User` sử dụng cấu hình mặc định của Laravel auth scaffold.
- Chưa có các module nghiệp vụ riêng (đăng ký học phần, điểm, TKB...) trong code hiện tại.

### Frontend
- Đang ở mức khởi tạo Vite + React, được chỉnh sửa để test kết nối backend.
- `src/testApi.ts` gọi `GET http://localhost:8000/api/test`.
- `src/App.tsx` hiển thị thông điệp trả về từ backend.

Tóm lại: hệ thống đã có bộ khung FE/BE + Docker + kết nối API cơ bản; các nghiệp vụ đồ án chưa được implement đầy đủ trong source hiện tại.

## 5. Chức năng nghiệp vụ theo báo cáo đồ án

Dưới đây là nhóm chức năng theo từng vai trò (tổng hợp từ tài liệu báo cáo):

### 5.1 Sinh viên
- Xem thời khóa biểu theo học kỳ/tuần
- Xem kết quả học tập/điểm học phần
- Cập nhật thông tin cá nhân
- Đăng ký kế hoạch học tập
- Đăng ký học phần (có ràng buộc)

### 5.2 Giảng viên
- Xem thời khóa biểu giảng dạy
- Quản lý/nhập/chỉnh sửa điểm sinh viên
- Xem kế hoạch học tập/chương trình đào tạo để cố vấn

### 5.3 Trưởng/Phó đơn vị
- Quản lý xếp thời khóa biểu cấp khoa
- Giám sát tiến độ nhập điểm
- Quản lý danh sách, tình trạng sinh viên
- Tra cứu chương trình đào tạo theo ngành/khóa

### 5.4 Chuyên viên phòng đào tạo
- Xếp thời khóa biểu toàn trường
- Mở lớp học phần
- Quản lý quy trình đăng ký học phần
- Khóa/mở đợt đăng ký, hủy lớp không đủ điều kiện sĩ số

## 6. Luồng xử lý nghiệp vụ tiêu biểu

### 6.1 Luồng đăng ký học phần (Sinh viên)
1. Sinh viên đăng nhập và chọn lớp học phần muốn đăng ký.
2. Hệ thống kiểm tra điều kiện tiên quyết.
3. Hệ thống kiểm tra sĩ số lớp còn trống hay không.
4. Hệ thống kiểm tra trùng lịch với các học phần đã đăng ký.
5. Nếu hợp lệ: lưu đăng ký vào CSDL, cập nhật TKB cá nhân.
6. Nếu không hợp lệ: trả thông báo lỗi rõ nguyên nhân.

### 6.2 Luồng nhập điểm (Giảng viên)
1. Giảng viên chọn lớp học phần được phân công.
2. Nhập/chỉnh sửa các cột điểm theo quy định.
3. Hệ thống validate dữ liệu (thang điểm, trọng số...).
4. Lưu dữ liệu vào CSDL kết quả học tập.
5. Tính/đổi điểm tổng kết (thang 10, thang 4, điểm chữ nếu áp dụng).
6. Công bố kết quả cho sinh viên.

### 6.3 Luồng mở lớp và vận hành đợt đăng ký (Phòng đào tạo)
1. Khởi tạo danh sách lớp học phần theo CTĐT và nhu cầu học tập.
2. Gán giảng viên, đặt sĩ số tối đa, bố trí phòng học.
3. Mở cổng đăng ký trong khoảng thời gian quy định.
4. Sau khi đóng đăng ký, thống kê sĩ số từng lớp.
5. Lớp không đủ điều kiện thì hủy, giải phóng tài nguyên.
6. Chốt danh sách lớp vận hành chính thức.

## 7. Luồng kỹ thuật FE-BE-DB (thực thi)

### 7.1 Luồng hiện tại (đã có trong code)
1. Frontend React load `App.tsx`.
2. `useEffect` gọi `testApi()` trong `testApi.ts`.
3. Axios gửi request `GET /api/test` đến backend Laravel.
4. Laravel trả về JSON `{ message: "Backend OK" }`.
5. Frontend hiển thị thông điệp lên màn hình.

### 7.2 Luồng mục tiêu (khi mở rộng nghiệp vụ)
1. Frontend gửi request theo use case (đăng ký học phần, xem điểm...).
2. Laravel route -> controller -> service (nếu tách service layer) -> model.
3. Model thao tác PostgreSQL.
4. Backend trả response JSON có status, dữ liệu, thông báo lỗi.
5. Frontend cập nhật UI và điều hướng theo kết quả.

## 8. Hướng dẫn chạy dự án

### Cách 1: Docker Compose (khuyến nghị)
```bash
docker compose up --build
```

Sau khi chạy:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API test: `http://localhost:8000/api/test`
- PostgreSQL: `localhost:5432`

### Cách 2: Chạy riêng từng phần (local)
Backend:
```bash
cd ntu-training-management-system-be
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Frontend:
```bash
cd ntu-training-management-system-fe
npm install
npm run dev
```
