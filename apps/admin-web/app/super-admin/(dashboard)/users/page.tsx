'use client'

import { useEffect, useState, useCallback } from 'react'
import { superAdminApi } from '@/lib/api'
import type { User, PaginatedResponse } from '@/types'
import { AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface ActionDialogProps {
  user: User
  onConfirm: (reason: string) => Promise<void>
  onClose: () => void
  action: 'block' | 'unblock'
}

function UserActionDialog({ user, onConfirm, onClose, action }: ActionDialogProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onConfirm(reason.trim())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="text-sm font-semibold text-white">
          {action === 'block' ? 'Block User' : 'Unblock User'}
        </h3>
        <p className="mt-1 text-xs text-gray-400">
          {action === 'block'
            ? `Blocking ${user.name ?? user.email} will revoke all their sessions immediately.`
            : `Unblocking ${user.name ?? user.email} will restore their access.`}
        </p>
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-gray-300">
            Reason <span className="text-red-400">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Enter reason (min 5 chars)…"
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none resize-none"
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${
              action === 'block' ? 'bg-red-700 hover:bg-red-600' : 'bg-green-700 hover:bg-green-600'
            }`}
          >
            {loading ? 'Processing…' : action === 'block' ? 'Block User' : 'Unblock User'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [blockedFilter, setBlockedFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogAction, setDialogAction] = useState<'block' | 'unblock' | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const limit = 20

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (blockedFilter) params.set('isBlocked', blockedFilter)
    superAdminApi<PaginatedResponse<User>>(`/super-admin/users?${params.toString()}`).then((res) => {
      if (res.ok) {
        setUsers(res.data.data)
        setTotal(res.data.total)
      } else {
        setError(res.error)
      }
      setLoading(false)
    })
  }, [page, search, blockedFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleAction = async (action: string, user: User, reason: string) => {
    const res = await superAdminApi<{ message?: string }>(`/super-admin/users/${user.id}/${action}`, {
      method: 'POST',
      actionReason: reason,
      body: { reason },
    })
    if (!res.ok) throw new Error(res.error)
    setActionSuccess(res.data.message ?? 'Action completed')
    setSelectedUser(null)
    setDialogAction(null)
    load()
  }

  const openDialog = (user: User, action: 'block' | 'unblock') => {
    setSelectedUser(user)
    setDialogAction(action)
  }

  const totalPages = Math.ceil(total / limit)

  const maskPhone = (phone?: string) => {
    if (!phone) return '—'
    return phone.slice(0, -4).replace(/\d/g, '•') + phone.slice(-4)
  }

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-white">Users</h1>
        <p className="text-xs text-gray-400 mt-0.5">{total} total users</p>
      </div>

      <div className="rounded-lg border border-yellow-800 bg-yellow-950/20 px-4 py-2 text-xs text-yellow-400">
        Cannot read OTPs or PII beyond what is stored. Phone numbers are masked.
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, phone…"
              className="h-8 rounded-md border border-gray-700 bg-gray-900 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none w-56"
            />
          </div>
          <button
            type="submit"
            className="h-8 rounded-md bg-red-700 px-3 text-xs font-medium text-white hover:bg-red-600"
          >
            Search
          </button>
          {(search || blockedFilter) && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setBlockedFilter(''); setPage(1) }}
              className="h-8 rounded-md border border-gray-700 px-3 text-xs text-gray-300 hover:bg-gray-800"
            >
              Clear
            </button>
          )}
        </form>
        <select
          value={blockedFilter}
          onChange={(e) => { setBlockedFilter(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 focus:border-red-500 focus:outline-none"
        >
          <option value="">All users</option>
          <option value="true">Blocked only</option>
          <option value="false">Active only</option>
        </select>
      </div>

      {actionSuccess && (
        <div className="rounded-lg border border-green-800 bg-green-950/40 px-4 py-2 text-xs text-green-400">
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-800">
        <table className="w-full text-xs">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Name</th>
              <th className="px-3 py-2.5 text-left font-medium">Email</th>
              <th className="px-3 py-2.5 text-left font-medium">Phone</th>
              <th className="px-3 py-2.5 text-left font-medium">Bookings</th>
              <th className="px-3 py-2.5 text-left font-medium">Status</th>
              <th className="px-3 py-2.5 text-left font-medium">Joined</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-red-800 border-t-red-500" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="bg-gray-950 hover:bg-gray-900/50">
                  <td className="px-3 py-2.5 font-medium text-white">{user.name || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-300">{user.email}</td>
                  <td className="px-3 py-2.5 font-mono text-gray-400">{maskPhone(user.phone)}</td>
                  <td className="px-3 py-2.5 text-gray-300">{user.totalBookings}</td>
                  <td className="px-3 py-2.5">
                    {user.isBlocked ? (
                      <span className="inline-flex rounded border border-red-700 bg-red-950/40 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                        Blocked
                      </span>
                    ) : (
                      <span className="inline-flex rounded border border-green-800 bg-green-950/30 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {user.isBlocked ? (
                      <button
                        onClick={() => openDialog(user, 'unblock')}
                        className="text-green-400 hover:text-green-300 text-xs"
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => openDialog(user, 'block')}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Block
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-700 disabled:opacity-40 hover:bg-gray-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-7 items-center px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-700 disabled:opacity-40 hover:bg-gray-800"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {selectedUser && dialogAction && (
        <UserActionDialog
          user={selectedUser}
          action={dialogAction}
          onClose={() => { setSelectedUser(null); setDialogAction(null) }}
          onConfirm={(reason) => handleAction(dialogAction, selectedUser, reason)}
        />
      )}
    </div>
  )
}
