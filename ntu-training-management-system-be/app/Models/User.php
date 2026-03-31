<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'password',
        'role_id',
        'profile_id',
        'profile_type',
        'status',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'status' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function student(): HasOne
    {
        return $this->hasOne(SinhVien::class, 'user_id', 'username');
    }

    public function profile(): MorphTo
    {
        return $this->morphTo();
    }

    public function emailVerification(): HasOne
    {
        return $this->hasOne(EmailVerification::class);
    }

    public function profileEmail(): ?string
    {
        $this->syncProfileFromRole();

        $profile = $this->relationLoaded('profile')
            ? $this->profile
            : $this->profile()->first();

        if (! $profile) {
            return null;
        }

        $email = trim((string) ($profile->getAttribute('email') ?? ''));

        return $email !== '' ? $email : null;
    }

    public function isEmailVerified(): bool
    {
        $verification = $this->relationLoaded('emailVerification')
            ? $this->emailVerification
            : $this->emailVerification()->first();

        return (bool) $verification?->verified_at;
    }

    public function syncProfileFromRole(): void
    {
        if ($this->profile_id && $this->profile_type) {
            return;
        }

        if (! $this->relationLoaded('role')) {
            $this->load('role');
        }

        $profile = match ($this->role?->code) {
            'student' => SinhVien::query()->where('user_id', $this->username)->first(),
            'lecturer' => CanBo::query()->where('user_id', $this->username)->first(),
            'training_officer' => ChuyenVien::query()->where('user_id', $this->username)->first(),
            'manager' => QuanLy::query()->where('user_id', $this->username)->first(),
            default => null,
        };

        if (! $profile) {
            return;
        }

        $this->forceFill([
            'profile_id' => $profile->id,
            'profile_type' => $profile::class,
        ])->save();

        $this->setRelation('profile', $profile);
    }

    public function hasPermission(string $code): bool
    {
        if (! $this->relationLoaded('role')) {
            $this->load('role');
        }

        return $this->role
            ? $this->role->permissions()->where('code', $code)->exists()
            : false;
    }
}
