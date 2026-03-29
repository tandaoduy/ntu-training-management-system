<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $studentRole = Role::query()->firstOrCreate(
            ['code' => 'student'],
            ['name' => 'Sinh vien', 'description' => null],
        );

        return [
            'username' => fake()->unique()->numerify('65######'),
            'password' => static::$password ??= Hash::make('password'),
            'role_id' => $studentRole->id,
            'status' => true,
            'last_login_at' => now(),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this;
    }
}
