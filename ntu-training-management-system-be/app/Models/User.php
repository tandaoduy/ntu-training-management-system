<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use App\Models\Permission;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
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

    public function profileName(): ?string
    {
        $this->syncProfileFromRole();

        $profile = $this->relationLoaded('profile')
            ? $this->profile
            : $this->profile()->first();

        if (! $profile) {
            return null;
        }

        // Get the display name based on profile type
        $nameAttribute = match ($this->role?->code) {
            'student' => 'ten_sinh_vien',
            'lecturer' => 'ten_giang_vien',
            'training_officer' => 'ten_chuyen_vien',
            'manager' => 'ten_nguoi_quan_ly',
            default => 'name',
        };

        $name = trim((string) ($profile->getAttribute($nameAttribute) ?? ''));

        return $name !== '' ? $name : null;
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

    public function profileName(): ?string
    {
        $this->syncProfileFromRole();

        $profile = $this->relationLoaded('profile')
            ? $this->profile
            : $this->profile()->first();

        if (! $profile) {
            return null;
        }

        $name = trim((string) (
            $profile->getAttribute('ten_sinh_vien')
            ?? $profile->getAttribute('ten_giang_vien')
            ?? $profile->getAttribute('ten_chuyen_vien')
            ?? $profile->getAttribute('ten_nguoi_quan_ly')
            ?? $profile->getAttribute('full_name')
            ?? ''
        ));

        return $name !== '' ? $name : null;
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
        if ($this->role?->code === 'admin') {
            return true;
        }

        return $this->permissionCodes()->contains($code);
    }

    public function permissionCodes(): Collection
    {
        if (! $this->role_id) {
            return collect();
        }

        $cacheKey = sprintf('role_permissions:%d', $this->role_id);

        $codes = Cache::remember($cacheKey, now()->addMinutes(5), function (): array {
            $role = $this->role()->first();

            if ($role?->code === 'admin') {
                return Permission::query()->pluck('code')->toArray();
            }

            return $role?->permissions()->pluck('code')->toArray() ?? [];
        });

        return collect($codes);
    }
}
