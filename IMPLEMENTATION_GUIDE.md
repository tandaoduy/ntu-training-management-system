# Hướng Dẫn Thêm Ảnh Đại Diện Sinh Viên và Mock API Hành Chính Việt Nam

## Tóm Tắt Các Thay Đổi

Đã thực hiện các cập nhật sau để hỗ trợ lưu ảnh đại diện sinh viên và truy vấn thông tin tỉnh/thành phố, quận/huyện, xã/phường:

### 1. **Tạo LocationService** (`app/Services/Admin/LocationService.php`)
   - Mock service cung cấp dữ liệu hành chính Việt Nam theo OpenAPI schema
   - Dữ liệu có sẵn cho một số tỉnh (Hà Nội, Khánh Hòa, v.v.)
   - Hỗ trợ các chức năng:
     - Lấy danh sách tất cả tỉnh/thành phố
     - Tìm kiếm tỉnh/thành phố theo tên
     - Lấy chi tiết tỉnh + danh sách quận/huyện
     - Lấy danh sách xã/phường theo tỉnh

### 2. **Tạo LocationController** (`app/Http/Controllers/Api/Admin/LocationController.php`)
   - API endpoints để truy vấn thông tin vị trí hành chính
   - 8 endpoints chính cho tỉnh/thành phố, quận/huyện, xã/phường

### 3. **Cập Nhật AdminAccountController** 
   - Thêm validation rule cho upload ảnh (`anh` field)
   - Thêm method `uploadStudentImage()` để upload ảnh riêng
   - Cập nhật `storeStudent()` và `update()` để xử lý ảnh trong request
   - Tự động xóa ảnh cũ khi upload ảnh mới
   - Lưu ảnh vào `storage/app/public/students/{userId}/{timestamp}_filename.jpg`

### 4. **Cập Nhật Routes** (`routes/api.php`)
   - Thêm 8 routes cho location endpoints
   - Thêm route cho upload ảnh sinh viên

### 5. **Cập Nhật API HTTP File** (`AdminAccount.api.http`)
   - Thêm ví dụ upload ảnh riêng (POST `/admin/accounts/{id}/upload-image`)
   - Thêm ví dụ tạo sinh viên với ảnh
   - Thêm các ví dụ truy vấn tỉnh/thành phố, quận/huyện, xã/phường

## API Endpoints

### Upload Ảnh

#### 1. Upload ảnh cho sinh viên (endpoint riêng)
```
POST /api/admin/accounts/{id}/upload-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

anh: [image file, max 5MB]
```

**Response:**
```json
{
  "message": "Đã lưu ảnh sinh viên thành công",
  "data": {
    "id": 1,
    "anh": "students/1/1234567890_avatar.jpg",
    "anh_url": "http://localhost:8000/storage/students/1/1234567890_avatar.jpg"
  }
}
```

#### 2. Upload ảnh khi tạo sinh viên (form-data)
```
POST /api/admin/accounts/students
Authorization: Bearer {token}
Content-Type: multipart/form-data

username: 65138888
password: 123456789
ten_sinh_vien: Nguyễn Văn A
email: student@ntu.edu.vn
ma_lop: 65.CNTT-1
...
anh: [image file]
```

#### 3. Cập nhật ảnh khi cập nhật profile
```
PUT /api/admin/accounts/{id}
Authorization: Bearer {token}
Content-Type: multipart/form-data

profile[email]: newemail@ntu.edu.vn
profile[so_dien_thoai]: 0912345678
anh: [image file]
```

### Vị Trí Hành Chính (Provinces, Districts, Wards)

#### 1. Lấy danh sách tất cả tỉnh/thành phố
```
GET /api/admin/locations/provinces
```

#### 2. Tìm kiếm tỉnh/thành phố
```
GET /api/admin/locations/provinces/search?q=Ha%20Noi
```

#### 3. Lấy chi tiết tỉnh + quận/huyện
```
GET /api/admin/locations/provinces/{code}
Ví dụ: /api/admin/locations/provinces/79 (Khánh Hòa)
```

#### 4. Lấy danh sách quận/huyện của tỉnh
```
GET /api/admin/locations/provinces/{provinceCode}/districts
Ví dụ: /api/admin/locations/provinces/79/districts
```

#### 5. Lấy chi tiết quận/huyện
```
GET /api/admin/locations/districts/{code}
Ví dụ: /api/admin/locations/districts/1574 (TP Nha Trang)
```

#### 6. Lấy danh sách xã/phường
```
GET /api/admin/locations/wards
GET /api/admin/locations/wards?province_code=79
GET /api/admin/locations/wards?q=Ba%20Ria
GET /api/admin/locations/wards?province_code=79&q=phuong
```

#### 7. Lấy chi tiết xã/phường
```
GET /api/admin/locations/wards/{code}
Ví dụ: /api/admin/locations/wards/26560 (Phường Bà Rịa)
```

#### 8. Tìm xã/phường từ mã lưu đếp (backward compatibility)
```
GET /api/admin/locations/wards/legacy?legacy_name=Xã%20Tân%20Hải&legacy_code=22855
```

## Dữ Liệu Đã Cấu Hình

Hiện tại đã cấu hình dữ liệu cho các tỉnh:
- **Hà Nội** (code: 1)
  - Quận Ba Đình, Hoàn Kiếm, Tây Hồ, Cầu Giấy, Đống Đa, Hai Bà Trưng, Hoàng Mai, Long Biên
  - Các phường trong quận Ba Đình

- **Khánh Hòa** (code: 79)
  - Thành phố Nha Trang, Thị xã Cam Ranh, các huyện
  - Các phường trong TP Nha Trang (Bà Rịa, Xương Huân, v.v.)

- Các tỉnh khác (danh sách tỉnh)

## Mở Rộng Dữ Liệu

Để thêm thêm quận/huyện hoặc xã/phường, cập nhật:

```php
// app/Services/Admin/LocationService.php

private static array $districts = [
    79 => [ // code tỉnh
        ['code' => 1574, 'name' => 'Thành phố Nha Trang', 'codename' => 'thanh_pho_nha_trang', 'type' => 'thành phố'],
        // Thêm quận/huyện mới ở đây
    ],
];

private static array $wards = [
    1574 => [ // code quận/huyện
        ['code' => 26560, 'name' => 'Phường Bà Rịa', 'codename' => 'phuong_ba_ria', 'type' => 'phường'],
        // Thêm xã/phường mới ở đây
    ],
];
```

## Ý Nghĩa Các Trường Ảnh

- **anh**: Tên file hoặc đường dẫn lưu ảnh (stored in `storage/app/public/`)
- **anh_url**: URL công khai để hiển thị ảnh (http://localhost:8000/storage/...)

## Lưu Ý

1. **Kích thước ảnh**: Giới hạn 5MB cho mỗi file
2. **Định dạng**: JPEG, PNG, JPG, GIF
3. **Xóa ảnh cũ**: Tự động xóa ảnh cũ khi upload ảnh mới
4. **Public Disk**: Ảnh được lưu công khai để có thể truy cập qua URL
5. **Storage Link**: Chắc chắn rằng `storage:link` command đã được chạy để tạo symlink

## Chạy Storage Link
```bash
php artisan storage:link
```

## Test API

Sử dụng file `AdminAccount.api.http` để test các endpoints:
1. Đăng nhập lấy token
2. Thay đổi `@authToken`
3. Sử dụng các requests ví dụ

## Files Được Tạo/Sửa

✅ **Tạo mới:**
- `app/Services/Admin/LocationService.php`
- `app/Http/Controllers/Api/Admin/LocationController.php`

✅ **Sửa đổi:**
- `app/Http/Controllers/Api/Admin/Account/AdminAccountController.php`
- `routes/api.php`
- `app/Http/Controllers/Api/Admin/Account/AdminAccount.api.http`
