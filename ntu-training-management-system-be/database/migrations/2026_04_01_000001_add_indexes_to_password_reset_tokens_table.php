<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('password_reset_tokens', function (Blueprint $table) {
            $table->index('user_id', 'password_reset_tokens_user_id_idx');
            $table->index(['email', 'created_at'], 'password_reset_tokens_email_created_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('password_reset_tokens', function (Blueprint $table) {
            $table->dropIndex('password_reset_tokens_user_id_idx');
            $table->dropIndex('password_reset_tokens_email_created_at_idx');
        });
    }
};
