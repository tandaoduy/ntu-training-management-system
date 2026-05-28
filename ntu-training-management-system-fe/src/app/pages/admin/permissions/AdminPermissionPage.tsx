import { useEffect, useMemo, useState } from 'react'

import { apiGet, apiPut } from '@/api/core/request'
import { useAlert } from '@/components/alert'
import './AdminPermissionPage.css'

type Permission = {
  id: number
  code: string
  name: string
  module: string
  description?: string | null
}

type Role = {
  id: number
  code: string
  name: string
  description?: string | null
  permissions: string[]
}

type PermissionResponse = {
  data: {
    roles: Role[]
    permissions: Record<string, Permission[]>
    locked: Record<string, string[]>
  }
}

type SyncResponse = {
  data: {
    role: Role
  }
}

const moduleLabels: Record<string, string> = {
  training_officer: 'Chuyên viên đào tạo',
  manager: 'Quản lý',
  lecturer: 'Giảng viên',
  student: 'Sinh viên',
}

const roleLabels: Record<string, string> = {
  training_officer: 'Chuyên viên',
  manager: 'Quản lý',
  lecturer: 'Giảng viên',
  student: 'Sinh viên',
}

const toMessage = (error: unknown, fallback: string) => (
  typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
    ? error.message
    : fallback
)

export default function AdminPermissionPage() {
  const { showAlert } = useAlert()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({})
  const [locked, setLocked] = useState<Record<string, string[]>>({})
  const [selectedRoleCode, setSelectedRoleCode] = useState('training_officer')
  const [isLoading, setIsLoading] = useState(true)
  const [savingCode, setSavingCode] = useState<string | null>(null)
  const [draftPermissions, setDraftPermissions] = useState<Record<string, string[]>>({})

  const selectedRole = roles.find((role) => role.code === selectedRoleCode) ?? roles[0]
  const selectedDraftPermissions = selectedRole ? draftPermissions[selectedRole.code] ?? selectedRole.permissions : []
  const activePermissions = useMemo(() => new Set(selectedDraftPermissions), [selectedDraftPermissions])
  const lockedPermissions = useMemo(() => new Set(locked[selectedRole?.code ?? ''] ?? []), [locked, selectedRole])
  const modules = useMemo(() => (
    selectedRole ? Object.keys(permissions).filter((module) => module === selectedRole.code) : []
  ), [permissions, selectedRole])
  const hasChanges = Boolean(selectedRole && (
    [...new Set(selectedDraftPermissions)].sort().join('|') !== [...new Set(selectedRole.permissions)].sort().join('|')
  ))

  const loadPermissions = async () => {
    setIsLoading(true)
    try {
      const response = await apiGet<PermissionResponse>('/admin/permissions')
      setRoles(response.data.roles)
      setDraftPermissions(Object.fromEntries(response.data.roles.map((role) => [role.code, role.permissions])))
      setPermissions(response.data.permissions)
      setLocked(response.data.locked)
      setSelectedRoleCode((current) => response.data.roles.some((role) => role.code === current)
        ? current
        : response.data.roles[0]?.code ?? 'training_officer')
    } catch (error) {
      showAlert({
        title: 'Không tải được phân quyền',
        message: toMessage(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPermissions()
  }, [])

  const saveRolePermissions = async (role: Role) => {
    setSavingCode(role.code)
    try {
      const response = await apiPut<SyncResponse>(`/admin/permissions/roles/${role.id}`, {
        permissions: draftPermissions[role.code] ?? role.permissions,
      })

      setRoles((items) => items.map((item) => (
        item.id === role.id ? { ...item, permissions: response.data.role.permissions } : item
      )))
      setDraftPermissions((items) => ({
        ...items,
        [role.code]: response.data.role.permissions,
      }))
      showAlert({
        title: 'Đã cập nhật phân quyền',
        message: `Quyền của ${roleLabels[role.code] ?? role.name} đã được lưu.`,
        variant: 'success',
      })
    } catch (error) {
      showAlert({
        title: 'Không lưu được phân quyền',
        message: toMessage(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    } finally {
      setSavingCode(null)
    }
  }

  const togglePermission = (permissionCode: string) => {
    if (!selectedRole || lockedPermissions.has(permissionCode) || savingCode) return

    const next = activePermissions.has(permissionCode)
      ? selectedDraftPermissions.filter((code) => code !== permissionCode)
      : [...selectedDraftPermissions, permissionCode]

    setDraftPermissions((items) => ({
      ...items,
      [selectedRole.code]: next,
    }))
  }

  const setModuleEnabled = (module: string, enabled: boolean) => {
    if (!selectedRole || savingCode) return

    const moduleCodes = (permissions[module] ?? []).map((permission) => permission.code)
    const next = new Set(selectedDraftPermissions)
    moduleCodes.forEach((code) => {
      if (lockedPermissions.has(code)) return
      if (enabled) next.add(code)
      else next.delete(code)
    })

    setDraftPermissions((items) => ({
      ...items,
      [selectedRole.code]: Array.from(next),
    }))
  }

  return (
    <main className="ap-page">
      <div className="ap-header">
        <div>
          <p className="ap-eyebrow">Phân quyền hệ thống</p>
          <h1>Bật/tắt chức năng người dùng</h1>
        </div>
      </div>

      <section className="ap-shell">
        <div className="ap-roles" role="tablist" aria-label="Vai trò người dùng">
          {roles.map((role) => (
            <button
              type="button"
              key={role.code}
              className={`ap-role${selectedRoleCode === role.code ? ' active' : ''}`}
              onClick={() => setSelectedRoleCode(role.code)}
              role="tab"
              aria-selected={selectedRoleCode === role.code}
            >
              <span>{roleLabels[role.code] ?? role.name}</span>
              <small>{(draftPermissions[role.code] ?? role.permissions).length} quyền đang bật</small>
            </button>
          ))}
        </div>

        <section className="ap-panel">
          {isLoading ? (
            <div className="ap-state">Đang tải phân quyền...</div>
          ) : selectedRole ? (
            <>
              <div className="ap-modules">
                {modules.map((module) => {
                  const list = permissions[module] ?? []
                  const enabledCount = list.filter((permission) => activePermissions.has(permission.code)).length
                  const allEnabled = enabledCount === list.length

                  return (
                    <section className="ap-module" key={module}>
                      <div className="ap-module-head">
                        <div>
                          <h3>{moduleLabels[module] ?? module}</h3>
                          <span>{enabledCount}/{list.length} chức năng đang bật</span>
                        </div>
                        <button type="button" onClick={() => setModuleEnabled(module, !allEnabled)}>
                          {allEnabled ? 'Tắt nhóm' : 'Bật nhóm'}
                        </button>
                      </div>

                      <div className="ap-permissions">
                        {list.map((permission) => {
                          const enabled = activePermissions.has(permission.code)
                          const isLocked = lockedPermissions.has(permission.code)

                          return (
                            <label className={`ap-permission${enabled ? ' enabled' : ''}${isLocked ? ' locked' : ''}`} key={permission.code}>
                              <input
                                type="checkbox"
                                checked={enabled}
                                disabled={isLocked || Boolean(savingCode)}
                                onChange={() => togglePermission(permission.code)}
                              />
                              <span className="ap-toggle" aria-hidden="true" />
                              <span className="ap-permission-text">
                                <strong>{permission.name}</strong>
                                <small>{permission.code}{isLocked ? ' · luôn bật' : ''}</small>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>

              <div className="ap-footer-actions">
                <button
                  type="button"
                  className="ap-save"
                  onClick={() => selectedRole && void saveRolePermissions(selectedRole)}
                  disabled={!selectedRole || !hasChanges || Boolean(savingCode)}
                >
                  {savingCode === selectedRole?.code ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </>
          ) : (
            <div className="ap-state">Chưa có vai trò nào.</div>
          )}
        </section>
      </section>
    </main>
  )
}
