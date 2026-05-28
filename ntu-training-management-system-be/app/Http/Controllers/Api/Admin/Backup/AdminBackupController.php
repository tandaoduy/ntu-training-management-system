<?php

namespace App\Http\Controllers\Api\Admin\Backup;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AdminBackupController extends Controller
{
    private const BACKUP_DIR = 'backups';

    private const EXCLUDED_TABLES = [
        'cache',
        'cache_locks',
        'failed_jobs',
        'job_batches',
        'jobs',
        'migrations',
        'personal_access_tokens',
        'sessions',
    ];

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->backupFiles(),
        ]);
    }

    public function store(): JsonResponse
    {
        $payload = $this->buildBackupPayload();
        $baseName = 'backup-' . now()->format('Ymd-His');
        $jsonFileName = $baseName . '.json';
        $sqlFileName = $baseName . '.sql';

        Storage::disk('local')->put(
            self::BACKUP_DIR . '/' . $jsonFileName,
            json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        );
        Storage::disk('local')->put(
            self::BACKUP_DIR . '/' . $sqlFileName,
            $this->buildSqlBackup($payload),
        );

        return response()->json([
            'message' => 'Tạo bản sao lưu JSON và SQL thành công.',
            'data' => $this->backupFileInfo($jsonFileName),
        ], 201);
    }

    public function upload(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'file' => ['required', 'file', 'max:51200'],
        ]);

        $file = $payload['file'];
        $fileName = 'uploaded-' . now()->format('Ymd-His') . '-' . preg_replace('/[^A-Za-z0-9._-]/', '-', $file->getClientOriginalName());
        abort_unless(preg_match('/\.(json|sql)$/i', $fileName), 422, 'Chỉ hỗ trợ file sao lưu .json hoặc .sql.');

        $content = (string) file_get_contents($file->getRealPath());
        str_ends_with(strtolower($fileName), '.sql')
            ? $this->assertValidSqlBackup($content)
            : $this->decodeBackupContent($content);

        Storage::disk('local')->put(self::BACKUP_DIR . '/' . $fileName, $content);

        return response()->json([
            'message' => 'Tai len ban sao luu thanh cong.',
            'data' => $this->backupFileInfo($fileName),
        ], 201);
    }

    public function restore(string $file): JsonResponse
    {
        $fileName = $this->safeFileName($file);
        $path = self::BACKUP_DIR . '/' . $fileName;

        abort_unless(Storage::disk('local')->exists($path), 404, 'Khong tim thay ban sao luu.');

        $content = Storage::disk('local')->get($path);
        $summary = str_ends_with($fileName, '.sql')
            ? $this->restoreSql($content)
            : $this->restorePayload($this->decodeBackupContent($content));

        return response()->json([
            'message' => 'Phục hồi dữ liệu thành công.',
            'data' => $summary,
        ]);
    }

    public function download(string $file): BinaryFileResponse
    {
        $fileName = $this->safeFileName($file);
        $path = self::BACKUP_DIR . '/' . $fileName;

        abort_unless(Storage::disk('local')->exists($path), 404, 'Khong tim thay ban sao luu.');

        return response()->download(Storage::disk('local')->path($path), $fileName);
    }

    public function destroy(string $file): JsonResponse
    {
        $fileName = $this->safeFileName($file);
        $path = self::BACKUP_DIR . '/' . $fileName;

        abort_unless(Storage::disk('local')->exists($path), 404, 'Khong tim thay ban sao luu.');

        Storage::disk('local')->delete($path);

        return response()->json([
            'message' => 'Da xoa ban sao luu.',
        ]);
    }

    private function buildBackupPayload(): array
    {
        $tables = $this->orderedTables($this->databaseTables());

        return [
            'version' => 1,
            'created_at' => now()->toISOString(),
            'connection' => config('database.default'),
            'database' => DB::connection()->getDatabaseName(),
            'tables' => collect($tables)->map(function (string $table): array {
                $columns = $this->columns($table);
                $rows = DB::table($table)
                    ->select($columns)
                    ->get()
                    ->map(fn (object $row): array => (array) $row)
                    ->values()
                    ->all();

                return [
                    'name' => $table,
                    'columns' => $columns,
                    'row_count' => count($rows),
                    'rows' => $rows,
                ];
            })->values()->all(),
        ];
    }

    private function restorePayload(array $payload): array
    {
        $incomingTables = collect($payload['tables'] ?? [])
            ->filter(fn ($table): bool => is_array($table) && isset($table['name'], $table['columns'], $table['rows']))
            ->keyBy('name');

        abort_if($incomingTables->isEmpty(), 422, 'File sao luu khong co du lieu bang.');

        $currentTables = collect($this->databaseTables());
        $tableNames = $incomingTables->keys()
            ->filter(fn (string $table): bool => $currentTables->contains($table))
            ->values()
            ->all();

        abort_if(empty($tableNames), 422, 'File sao luu khong khop voi co so du lieu hien tai.');

        $orderedTables = $this->orderedTables($tableNames);
        $restoredRows = 0;

        DB::transaction(function () use ($incomingTables, $orderedTables, &$restoredRows): void {
            $quotedTables = collect($orderedTables)
                ->map(fn (string $table): string => $this->quoteIdentifier($table))
                ->implode(', ');

            DB::statement("TRUNCATE TABLE {$quotedTables} RESTART IDENTITY CASCADE");

            foreach ($orderedTables as $tableName) {
                $table = $incomingTables->get($tableName);
                $columns = array_values(array_filter($table['columns'], 'is_string'));
                $validColumns = $this->columns($tableName);
                $insertColumns = array_values(array_intersect($columns, $validColumns));
                $rows = collect($table['rows'])
                    ->filter('is_array')
                    ->map(fn (array $row): array => Arr::only($row, $insertColumns))
                    ->values();

                foreach ($rows->chunk(500) as $chunk) {
                    if ($chunk->isNotEmpty()) {
                        DB::table($tableName)->insert($chunk->all());
                        $restoredRows += $chunk->count();
                    }
                }

                $this->resetSequence($tableName, $validColumns);
            }
        });

        return [
            'tables' => count($orderedTables),
            'rows' => $restoredRows,
            'restored_at' => now()->toISOString(),
        ];
    }

    private function buildSqlBackup(array $payload): string
    {
        $meta = [
            'version' => $payload['version'] ?? 1,
            'created_at' => $payload['created_at'] ?? now()->toISOString(),
            'database' => $payload['database'] ?? DB::connection()->getDatabaseName(),
            'tables' => collect($payload['tables'] ?? [])->map(fn (array $table): array => [
                'name' => $table['name'] ?? '',
                'row_count' => (int) ($table['row_count'] ?? count($table['rows'] ?? [])),
            ])->values()->all(),
        ];
        $tables = collect($payload['tables'] ?? [])->pluck('name')->filter()->values();
        $lines = [
            '-- NTU_BACKUP_SQL_V1',
            '-- NTU_BACKUP_META ' . json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'BEGIN;',
        ];

        if ($tables->isNotEmpty()) {
            $lines[] = 'TRUNCATE TABLE ' . $tables->map(fn (string $table): string => $this->quoteIdentifier($table))->implode(', ') . ' RESTART IDENTITY CASCADE;';
        }

        foreach ($payload['tables'] ?? [] as $table) {
            $tableName = (string) ($table['name'] ?? '');
            $columns = array_values(array_filter($table['columns'] ?? [], 'is_string'));
            if ($tableName === '' || empty($columns)) {
                continue;
            }

            $columnList = collect($columns)->map(fn (string $column): string => $this->quoteIdentifier($column))->implode(', ');
            foreach ($table['rows'] ?? [] as $row) {
                if (! is_array($row)) {
                    continue;
                }

                $values = collect($columns)
                    ->map(fn (string $column): string => $this->sqlLiteral($row[$column] ?? null))
                    ->implode(', ');
                $lines[] = 'INSERT INTO ' . $this->quoteIdentifier($tableName) . " ({$columnList}) VALUES ({$values});";
            }

            if (in_array('id', $columns, true)) {
                $lines[] = "SELECT setval(pg_get_serial_sequence('{$this->escapeSqlString($tableName)}', 'id'), COALESCE((SELECT MAX(\"id\") FROM {$this->quoteIdentifier($tableName)}), 1), (SELECT COUNT(*) > 0 FROM {$this->quoteIdentifier($tableName)}));";
            }
        }

        $lines[] = 'COMMIT;';
        $lines[] = '';

        return implode("\n", $lines);
    }

    private function restoreSql(string $content): array
    {
        $this->assertValidSqlBackup($content);
        $meta = $this->sqlBackupMeta($content);

        DB::unprepared($content);

        return [
            'tables' => count($meta['tables'] ?? []),
            'rows' => collect($meta['tables'] ?? [])->sum(fn ($table): int => (int) ($table['row_count'] ?? 0)),
            'restored_at' => now()->toISOString(),
        ];
    }

    private function assertValidSqlBackup(string $content): void
    {
        abort_unless(str_starts_with(trim($content), '-- NTU_BACKUP_SQL_V1'), 422, 'File SQL không phải bản sao lưu hợp lệ của hệ thống.');
    }

    private function sqlBackupMeta(string $content): array
    {
        foreach (preg_split('/\R/', $content) ?: [] as $line) {
            if (str_starts_with($line, '-- NTU_BACKUP_META ')) {
                $meta = json_decode(substr($line, strlen('-- NTU_BACKUP_META ')), true);

                return is_array($meta) ? $meta : [];
            }
        }

        return [];
    }

    private function decodeBackupContent(string $content): array
    {
        try {
            $payload = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            abort(422, 'File sao luu khong dung dinh dang JSON.');
        }

        abort_unless(is_array($payload) && isset($payload['tables']) && is_array($payload['tables']), 422, 'File sao luu khong hop le.');

        return $payload;
    }

    private function backupFiles(): array
    {
        Storage::disk('local')->makeDirectory(self::BACKUP_DIR);

        return collect(Storage::disk('local')->files(self::BACKUP_DIR))
            ->filter(fn (string $path): bool => str_ends_with($path, '.json') || str_ends_with($path, '.sql'))
            ->map(fn (string $path): array => $this->backupFileInfo(basename($path)))
            ->sortByDesc('created_at')
            ->values()
            ->all();
    }

    private function backupFileInfo(string $fileName): array
    {
        $path = self::BACKUP_DIR . '/' . $this->safeFileName($fileName);
        $disk = Storage::disk('local');
        $content = $disk->exists($path) ? $disk->get($path) : '{}';
        $payload = str_ends_with($path, '.sql')
            ? $this->sqlBackupMeta($content)
            : (json_decode($content, true) ?: []);
        $tables = collect($payload['tables'] ?? []);

        return [
            'file' => basename($path),
            'format' => pathinfo($path, PATHINFO_EXTENSION),
            'created_at' => $payload['created_at'] ?? date(DATE_ATOM, $disk->lastModified($path)),
            'size' => $disk->size($path),
            'tables' => $tables->count(),
            'rows' => $tables->sum(fn ($table): int => (int) ($table['row_count'] ?? count($table['rows'] ?? []))),
        ];
    }

    private function safeFileName(string $file): string
    {
        $fileName = basename($file);

        abort_if($fileName !== $file || ! preg_match('/^[A-Za-z0-9._-]+\.(json|sql)$/', $fileName), 400, 'Ten file sao luu khong hop le.');

        return $fileName;
    }

    private function databaseTables(): array
    {
        return DB::table('information_schema.tables')
            ->where('table_schema', 'public')
            ->where('table_type', 'BASE TABLE')
            ->whereNotIn('table_name', self::EXCLUDED_TABLES)
            ->orderBy('table_name')
            ->pluck('table_name')
            ->all();
    }

    private function columns(string $table): array
    {
        return DB::table('information_schema.columns')
            ->where('table_schema', 'public')
            ->where('table_name', $table)
            ->orderBy('ordinal_position')
            ->pluck('column_name')
            ->all();
    }

    private function orderedTables(array $tables): array
    {
        $tables = array_values(array_unique($tables));
        $tableSet = array_flip($tables);
        $dependencies = array_fill_keys($tables, []);

        $foreignKeys = DB::select(<<<'SQL'
            select
                tc.table_name as table_name,
                ccu.table_name as foreign_table_name
            from information_schema.table_constraints tc
            join information_schema.key_column_usage kcu
                on tc.constraint_name = kcu.constraint_name
                and tc.table_schema = kcu.table_schema
            join information_schema.constraint_column_usage ccu
                on ccu.constraint_name = tc.constraint_name
                and ccu.table_schema = tc.table_schema
            where tc.constraint_type = 'FOREIGN KEY'
                and tc.table_schema = 'public'
        SQL);

        foreach ($foreignKeys as $foreignKey) {
            $table = $foreignKey->table_name;
            $parent = $foreignKey->foreign_table_name;

            if (isset($tableSet[$table], $tableSet[$parent]) && $table !== $parent) {
                $dependencies[$table][] = $parent;
            }
        }

        $ordered = [];
        $visiting = [];
        $visited = [];

        $visit = function (string $table) use (&$visit, &$ordered, &$visiting, &$visited, $dependencies): void {
            if (isset($visited[$table])) {
                return;
            }

            if (isset($visiting[$table])) {
                $ordered[] = $table;
                $visited[$table] = true;
                return;
            }

            $visiting[$table] = true;

            foreach (array_unique($dependencies[$table] ?? []) as $dependency) {
                $visit($dependency);
            }

            unset($visiting[$table]);
            $visited[$table] = true;
            $ordered[] = $table;
        };

        foreach ($tables as $table) {
            $visit($table);
        }

        return array_values(array_unique($ordered));
    }

    private function resetSequence(string $table, array $columns): void
    {
        if (! in_array('id', $columns, true)) {
            return;
        }

        $sequence = DB::selectOne(
            'select pg_get_serial_sequence(?, ?) as sequence_name',
            [$table, 'id'],
        )?->sequence_name;

        if (! $sequence) {
            return;
        }

        $maxId = DB::table($table)->max('id');

        if ($maxId === null) {
            DB::select('select setval(?, 1, false)', [$sequence]);
            return;
        }

        DB::select('select setval(?, ?, true)', [$sequence, $maxId]);
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '"' . str_replace('"', '""', $identifier) . '"';
    }

    private function sqlLiteral(mixed $value): string
    {
        if ($value === null) {
            return 'NULL';
        }

        if (is_bool($value)) {
            return $value ? 'TRUE' : 'FALSE';
        }

        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        return "'" . $this->escapeSqlString((string) $value) . "'";
    }

    private function escapeSqlString(string $value): string
    {
        return str_replace("'", "''", $value);
    }
}
