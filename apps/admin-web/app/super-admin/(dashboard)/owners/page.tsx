'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { superAdminApi } from '@/lib/api'
import type { Owner, PaginatedResponse } from '@/types'
import { AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'

const KYC_BADGE: Record<Owner['kycStatus'], string> = {
  pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
  submitted: 'bg-blue-900/50 text-blue-400 border-blue-700',
  verified: 'bg-green-900/50 text-green-400 border-green-700',
  rejected: 'bg-red-900/50 text-red-400 border-red-700',
}

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-gray-800 text-gray-400 border-gray-700',
  starter: 'bg-blue-900/50 text-blue-400 border-blue-700',
  pro: 'bg-purple-900/50 text-purple-400 border-purple-700',
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [kycFilter, setKycFilter] = useState('')

  const limit = 20

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (kycFilter) params.set('kycStatus', kycFilter)
    superAdminApi<PaginatedResponse<Owner>>(`/super-admin/owners?${params.toString()}`).then((res) => {
      if (res.ok) {
        setOwners(res.data.data)
        setTotal(res.data.total)
      } else {
        setError(res.error)
      }
      setLoading(false)
    })
  }, [page, search, kycFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Owners</h1>
          <p className="text-xs text-gray-400 mt-0.5">{total} total owners</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email…"
              className="h-8 rounded-md border border-gray-700 bg-gray-900 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none w-56"
            />
          </div>
          <button
            type="submit"
            className="h-8 rounded-md bg-red-700 px-3 text-xs font-medium text-white hover:bg-red-600"
          >
            Search
          </button>
          {(search || kycFilter) && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setKycFilter(''); setPage(1) }}
              className="h-8 rounded-md border border-gray-700 px-3 text-xs text-gray-300 hover:bg-gray-800"
            >
              Clear
            </button>
          )}
        </form>
        <select
          value={kycFilter}
          onChange={(e) => { setKycFilter(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 focus:border-red-500 focus:outline-none"
        >
          <option value="">All KYC</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

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
              <th className="px-3 py-2.5 text-left font-medium">KYC</th>
              <th className="px-3 py-2.5 text-left font-medium">Plan</th>
              <th className="px-3 py-2.5 text-left font-medium">Razorpay</th>
              <th className="px-3 py-2.5 text-left font-medium">Created</th>
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
            ) : owners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  No owners found
                </td>
              </tr>
            ) : (
              owners.map((owner) => (
                <tr key={owner.id} className="bg-gray-950 hover:bg-gray-900/50">
                  <td className="px-3 py-2.5 font-medium text-white">{owner.name}</td>
                  <td className="px-3 py-2.5 text-gray-300">{owner.email}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${KYC_BADGE[owner.kycStatus]}`}
                    >
                      {owner.kycStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${PLAN_BADGE[owner.subscriptionPlan] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}
                    >
                      {owner.subscriptionPlan}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`text-[10px] font-medium ${owner.razorpayConnected ? 'text-green-400' : 'text-gray-500'}`}
                    >
                      {owner.razorpayConnected ? 'Connected' : 'Not set'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">
                    {new Date(owner.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/super-admin/owners/${owner.id}`}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
    </div>
  )
}
