package utils

import (
	"fmt"
	"net/smtp"
	"os"
	"strings"
)

type EmailConfig struct {
	SMTPHost string
	SMTPPort string
	From     string
}

func GetEmailConfig() EmailConfig {
	return EmailConfig{
		SMTPHost: getEnv("SMTP_HOST", "localhost"),
		SMTPPort: getEnv("SMTP_PORT", "25"),
		From:     getEnv("SMTP_FROM", "noreply@smartape-vps.com"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func SendEmail(to, subject, body string) error {
	config := GetEmailConfig()
	
	// Connect to the SMTP server
	addr := fmt.Sprintf("%s:%s", config.SMTPHost, config.SMTPPort)
	
	// Set up email message
	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"From: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-version: 1.0;\r\n"+
		"Content-Type: text/html; charset=\"UTF-8\";\r\n"+
		"\r\n"+
		"%s\r\n", to, config.From, subject, body))
	
	// Send email (no auth for local Postfix)
	return smtp.SendMail(addr, nil, config.From, []string{to}, msg)
}

func SendPasswordResetEmail(to, name, resetToken string) error {
	// Get frontend URL from environment or use default
	frontendURL := getEnv("FRONTEND_URL", "http://178.255.127.62:3000")
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", 
		strings.TrimRight(frontendURL, "/"), resetToken)
	
	subject := "Reset Your CoolPhy Password"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">CoolPhy</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0;">Password Reset Request</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">Reset Your Password</h2>
        
        <p>You requested to reset your password for your CoolPhy account. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="%s" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
            </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: white; padding: 10px; border-left: 4px solid #667eea; word-break: break-all; font-size: 12px;">
            %s
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
            <strong>This link will expire in 1 hour.</strong>
        </p>
        
        <p style="color: #666; font-size: 14px;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 CoolPhy. All rights reserved.
        </p>
    </div>
</body>
</html>
	`, resetLink, resetLink)
	
	return SendEmail(to, subject, body)
}
