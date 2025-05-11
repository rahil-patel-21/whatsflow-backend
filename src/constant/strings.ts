import { Env } from 'src/config/env';

export const SIGN_UP_OTP_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        
        body {
            font-family: 'Poppins', sans-serif;
            background: #f5f7fa;
            margin: 0;
            padding: 0;
            color: #2d3748;
            line-height: 1.6;
        }
        
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: #fff;
        }
        
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        .logo {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 15px;
            display: inline-block;
        }
        
        .content {
            padding: 40px;
        }
        
        .otp-box {
            background: linear-gradient(135deg, #f0f4ff 0%, #f9f0ff 100%);
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #667eea;
            border: 2px dashed rgba(118, 75, 162, 0.3);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 13px;
            color: #718096;
            border-top: 1px solid #e2e8f0;
        }
        
        .note {
            font-size: 14px;
            color: #718096;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #edf2f7;
        }
        
        .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 500;
            margin-top: 15px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            background: #5a6fd1;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .highlight {
            color: #667eea;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${Env.company.legal_name}</div>
            <h1>Your One-Time Password</h1>
        </div>
        <div class="content">
            <p>Hello <strong>User</strong>,</p>
            <p>Thank you for choosing ${Env.company.legal_name}. Your OTP for verification is:</p>
            
            <div class="otp-box">OTP_CODE</div>
            
            <p>This verification code will expire in <span class="highlight">10 minutes</span>. Please do not share this code with anyone.</p>
            
            <p class="note">If you didn't request this OTP, please ignore this email or contact our support team immediately.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 ${Env.company.legal_name}. All rights reserved.</p>
            <p>Securing your digital connections with trust</p>
        </div>
    </div>
</body>
</html>`;
