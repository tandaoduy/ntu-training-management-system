<?php

namespace App\Providers;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $slowQueryThreshold = (int) config('database.slow_query_threshold_ms', 0);

        if ($slowQueryThreshold <= 0) {
            return;
        }

        DB::listen(function (QueryExecuted $query) use ($slowQueryThreshold): void {
            if ($query->time < $slowQueryThreshold) {
                return;
            }

            Log::warning('Slow database query detected', [
                'time_ms' => $query->time,
                'connection' => $query->connectionName,
                'sql' => $query->sql,
                'bindings' => $query->bindings,
            ]);
        });
    }
}
