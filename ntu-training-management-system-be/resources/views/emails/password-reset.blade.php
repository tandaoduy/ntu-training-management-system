<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a73e8; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
        .button { display: inline-block; padding: 12px 30px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { color: #d32f2f; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Đặt lại mật khẩu</h2>
        </div>

        <div class="content">
            <p>Xin chào <strong>{{ $user_name }}</strong>,</p>

            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng nhấn vào nút bên dưới để tiếp tục:</p>

            <center>
                <a href="{{ $reset_link }}" class="button">Đặt lại mật khẩu</a>
            </center>

            <p>Hoặc sao chép liên kết này vào trình duyệt:</p>
            <p style="word-break: break-all; color: #1a73e8;">{{ $reset_link }}</p>

            <p class="warning">⚠️ Lưu ý: Liên kết này sẽ hết hạn sau {{ $expire_time }}</p>

            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>

            <p>Trân trọng,<br>Hệ thống Quản lý Đào tạo NTU</p>
        </div>

        <div class="footer">
            <p>Đây là email tự động, vui lòng không trả lời email này.</p>
            <p>&copy; 2026 NTU Training Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
