import { useCallback, useEffect, useRef, useState } from 'react'
import { apiDelete, apiGet, apiPost } from '@/api/core/request'
import { httpClient } from '@/api/config/httpClient'
import './AdminBackupPage.css'

interface BackupFile {
  file: string
  format?: string
  created_at: string
  size: number
  tables: number
  rows: number
}

interface BackupListResponse {
  data: BackupFile[]
}

interface BackupMutationResponse {
  message: string
  data?: BackupFile | {
    tables: number
    rows: number
    restored_at: string
  }
}

const formatDateTime = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('vi-VN')
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const errorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message)
  }

  return 'Có lỗi xảy ra, vui lòng thử lại.'
}

export default function AdminBackupPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadBackups = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiGet<BackupListResponse>('/admin/backups')
      setBackups(response.data)
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBackups()
  }, [loadBackups])

  const runAction = async (key: string, action: () => Promise<void>) => {
    setBusyAction(key)
    setMessage(null)
    setError(null)

    try {
      await action()
      await loadBackups()
    } catch (actionError) {
      setError(errorMessage(actionError))
    } finally {
      setBusyAction(null)
    }
  }

  const createBackup = () => runAction('create', async () => {
    const response = await apiPost<BackupMutationResponse>('/admin/backups')
    setMessage(response.message)
  })

  const uploadBackup = () => runAction('upload', async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file sao lưu trước khi tải lên.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    const response = await apiPost<BackupMutationResponse, FormData>('/admin/backups/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setMessage(response.message)
  })

  const restoreBackup = (file: string) => runAction(`restore:${file}`, async () => {
    const confirmed = window.confirm('Phục hồi sẽ ghi đè dữ liệu hiện tại bằng bản sao lưu này. Bạn có chắc muốn tiếp tục?')

    if (!confirmed) {
      return
    }

    const response = await apiPost<BackupMutationResponse>(`/admin/backups/${encodeURIComponent(file)}/restore`)
    setMessage(response.message)
  })

  const deleteBackup = (file: string) => runAction(`delete:${file}`, async () => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa bản sao lưu này?')

    if (!confirmed) {
      return
    }

    const response = await apiDelete<BackupMutationResponse>(`/admin/backups/${encodeURIComponent(file)}`)
    setMessage(response.message)
  })

  const downloadBackup = (file: string) => runAction(`download:${file}`, async () => {
    const response = await httpClient.get<Blob>(`/admin/backups/${encodeURIComponent(file)}/download`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(response.data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(url)
    setMessage('Đã tải bản sao lưu.')
  })

  return (
    <main className="ab-page">
      <section className="ab-header">
        <div>
          <p className="ab-eyebrow">Sao lưu dữ liệu</p>
          <h1>Sao lưu và phục hồi</h1>
        </div>
        <button
          type="button"
          className="ab-primary-button"
          onClick={createBackup}
          disabled={busyAction === 'create'}
        >
          {busyAction === 'create' ? 'Đang tạo...' : 'Tạo bản sao lưu'}
        </button>
      </section>

      {(message || error) && (
        <div className={`ab-alert ${error ? 'error' : 'success'}`}>
          {error ?? message}
        </div>
      )}

      <section className="ab-toolbar">
        <div className="ab-upload">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.sql,application/json,text/plain"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="ab-secondary-button"
            onClick={uploadBackup}
            disabled={busyAction === 'upload'}
          >
            {busyAction === 'upload' ? 'Đang tải...' : 'Tải file backup lên'}
          </button>
        </div>
        <button type="button" className="ab-ghost-button" onClick={loadBackups} disabled={isLoading}>
          Cập nhật danh sách
        </button>
      </section>

      <section className="ab-table-wrap">
        <table className="ab-table">
          <thead>
            <tr>
              <th>Tên file</th>
              <th>Thời gian</th>
              <th>Số bảng</th>
              <th>Số dòng</th>
              <th>Dung lượng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="ab-empty">Đang tải danh sách sao lưu...</td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={6} className="ab-empty">Chưa có bản sao lưu nào.</td>
              </tr>
            ) : backups.map((backup) => (
              <tr key={backup.file}>
                <td className="ab-file">{backup.file}</td>
                <td>{formatDateTime(backup.created_at)}</td>
                <td>{backup.tables}</td>
                <td>{backup.rows}</td>
                <td>{formatBytes(backup.size)}</td>
                <td>
                  <div className="ab-actions">
                    <button
                      type="button"
                      onClick={() => downloadBackup(backup.file)}
                      disabled={busyAction === `download:${backup.file}`}
                    >
                      Tải
                    </button>
                    <button
                      type="button"
                      className="restore"
                      onClick={() => restoreBackup(backup.file)}
                      disabled={busyAction === `restore:${backup.file}`}
                    >
                      Phục hồi
                    </button>
                    <button
                      type="button"
                      className="delete"
                      onClick={() => deleteBackup(backup.file)}
                      disabled={busyAction === `delete:${backup.file}`}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
