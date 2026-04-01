<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NoSqlInjection implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Patterns for common SQL injection and database manipulation attempts
        $dangerousPatterns = [
            // SQL keywords and operators
            '/(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT)\b)/i',
            // SQL comment markers
            '/(--|#|\/\*|\*\/)/i',
            // Semicolon (statement terminator)
            '/;/i',
            // Single and double quotes combined with SQL keywords (common injection patterns)
            '/([\'"])(.*?)(\b(OR|AND)\b)/i',
            // SQL functions like xp_ or sp_ (SQL Server system procedures)
            '/(xp_|sp_|@@|@)/i',
            // Backslash trying to escape (may indicate escape attempt)
            '/\\\\.*([\'"])/i',
            // Parentheses combined with dangerous keywords (for function/stored proc calls)
            '/\((.*?)(UNION|SELECT|INSERT|DELETE|DROP|EXEC)\b/i',
        ];

        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, (string) $value)) {
                $fail("Mật khẩu không được chứa ký tự lệnh SQL/database và dấu ngoặc đơi, ngoặc kép, dấu chấm phẩy, hoặc các ký tự đặc biệt nguy hiểm.");
                return;
            }
        }
    }
}
