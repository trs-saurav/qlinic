'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import toast from 'react-hot-toast'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

import { Shield, Link2, KeyRound, RefreshCw } from 'lucide-react'

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession()

  const [providers, setProviders] = useState(null)
  const [loadingProviders, setLoadingProviders] = useState(false)

  const [pw, setPw] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingPw, setSavingPw] = useState(false)

  const user = session?.user

  const initials = useMemo(() => {
    const name = user?.name || user?.email || 'User'
    return name.slice(0, 1).toUpperCase()
  }, [user])

  const fetchProviders = async () => {
    setLoadingProviders(true)
    try {
      const res = await fetch('/api/auth/providers')
      const json = await res.json()
      setProviders(json)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load sign-in providers')
    } finally {
      setLoadingProviders(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  const connectProvider = async (providerId) => {
    // When already signed in, this becomes a "link provider" flow in NextAuth setups that support linking [web:2][web:6].
    await signIn(providerId, { callbackUrl: '/user/settings/security' })
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (!pw.newPassword || pw.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (pw.newPassword !== pw.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setSavingPw(true)
    const t = toast.loading('Updating password...')
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pw.currentPassword,
          newPassword: pw.newPassword,
        }),
      })
      const json = await res.json()

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed')
      }

      toast.success('Password updated', { id: t })
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err?.message || 'Failed to update password', { id: t })
    } finally {
      setSavingPw(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="h-9 w-40 bg-slate-100 rounded mb-4" />
        <div className="h-28 bg-slate-100 rounded" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Security & Account</h1>
          <p className="text-sm text-slate-500">Manage sign-in methods and password.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchProviders} disabled={loadingProviders}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Account summary */}
      <Card className="border-slate-200">
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{user?.name || 'Account'}</p>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Protected
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Connected accounts */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Connected accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">
            Connect Google/GitHub to sign in faster and keep access even if you forget your password.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!providers ? (
              <>
                <div className="h-10 bg-slate-100 rounded" />
                <div className="h-10 bg-slate-100 rounded" />
              </>
            ) : (
              Object.values(providers)
                .filter((p) => p.id !== 'credentials') // only show OAuth buttons
                .map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    className="justify-between"
                    onClick={() => connectProvider(p.id)}
                  >
                    <span className="font-medium">Connect {p.name}</span>
                    <span className="text-xs text-slate-500">Link</span>
                  </Button>
                ))
            )}
          </div>

          <Separator />

          <p className="text-xs text-slate-500">
            If your NextAuth setup supports linking, signing in with another provider while logged in links it to the same user account [web:2][web:6].
          </p>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            Change password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleChangePassword}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Current password</label>
                <Input
                  type="password"
                  value={pw.currentPassword}
                  onChange={(e) => setPw((s) => ({ ...s, currentPassword: e.target.value }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">New password</label>
                <Input
                  type="password"
                  value={pw.newPassword}
                  onChange={(e) => setPw((s) => ({ ...s, newPassword: e.target.value }))}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Confirm new password</label>
                <Input
                  type="password"
                  value={pw.confirmPassword}
                  onChange={(e) => setPw((s) => ({ ...s, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={savingPw}>
                {savingPw ? 'Saving...' : 'Update password'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPw({ currentPassword: '', newPassword: '', confirmPassword: '' })}
              >
                Reset
              </Button>
            </div>

            <p className="text-xs text-slate-500">
              If the user originally signed up only with OAuth, you may want to show a “Set password” flow instead of requiring current password.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
