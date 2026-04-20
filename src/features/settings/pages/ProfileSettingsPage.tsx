import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Mail, User as UserIcon, Lock, AlertTriangle, Save } from 'lucide-react'
import { auth, type User } from '#/lib/auth'
import { mockDb } from '#/lib/mockDb'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { subdomainFromName } from '#/features/create/lib/demoData'

const inputCls =
  'block w-full rounded-lg border-0 py-2 pl-9 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 transition-all'

export default function ProfileSettingsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSaved, setPwdSaved] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const u = auth.getCurrentUser()
    setUser(u)
    if (u) {
      setName(u.name)
      setEmail(u.email)
    }
  }, [])

  if (!user) {
    return (
      <main className="p-8">
        <p className="text-sm text-gray-500">Loading profile…</p>
      </main>
    )
  }

  const org = mockDb.getOrgById(user.orgId)
  const subdomain = org
    ? org.subdomain ?? `${subdomainFromName(org.name)}.thingdaddy.com`
    : ''
  const localPart = email.includes('@')
    ? email.split('@')[0]
    : name.toLowerCase().replace(/\s+/g, '.')
  const loginIdentity = subdomain ? `${localPart}@${subdomain}` : ''

  const saveProfile = () => {
    setProfileError('')
    if (name.trim().length < 2) {
      setProfileError('Name must be at least 2 characters')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setProfileError('Please enter a valid email')
      return
    }
    try {
      const updated = auth.updateCurrentUser({ name: name.trim(), email: email.trim() })
      setUser(updated)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch (err: any) {
      setProfileError(err.message ?? 'Failed to update profile')
    }
  }

  const savePassword = async () => {
    setPwdError('')
    if (newPwd !== confirmPwd) {
      setPwdError('New passwords do not match')
      return
    }
    try {
      await auth.changePassword(currentPwd, newPwd)
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setPwdSaved(true)
      setTimeout(() => setPwdSaved(false), 2000)
    } catch (err: any) {
      setPwdError(err.message ?? 'Failed to change password')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await auth.deleteAccount()
      setDeleteOpen(false)
      window.location.href = '/'
    } catch (err) {
      setDeleting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Personal Profile</h1>
        <p className="text-sm text-gray-500">
          Update your account info, password, or delete your account.
        </p>
      </div>

      {/* Personal info */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Personal Information
        </h2>

        {profileError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
            {profileError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Role
            </label>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-indigo-100 text-indigo-700 border-indigo-200 capitalize">
              {user.role === 'admin' ? 'Owner' : user.role}
            </span>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Organization
            </label>
            <div className="rounded-lg py-2 px-3 bg-gray-50 ring-1 ring-inset ring-gray-200 text-sm text-gray-700 truncate">
              {org?.name ?? '—'}
            </div>
          </div>
        </div>

        {loginIdentity && (
          <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
              Login identity
            </p>
            <p className="mt-1 font-mono text-sm text-indigo-900 break-all">
              {loginIdentity}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          {profileSaved && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
              Saved
            </span>
          )}
          <Button onClick={saveProfile} className="gap-1.5">
            <Save className="w-3.5 h-3.5" />
            Save changes
          </Button>
        </div>
      </section>

      {/* Password */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Change Password
        </h2>

        {pwdError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
            {pwdError}
          </div>
        )}

        <div className="space-y-3">
          {[
            { label: 'Current password', value: currentPwd, set: setCurrentPwd },
            { label: 'New password', value: newPwd, set: setNewPwd },
            { label: 'Confirm new password', value: confirmPwd, set: setConfirmPwd },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                {f.label}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {pwdSaved && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
              Password updated
            </span>
          )}
          <Button onClick={savePassword} className="gap-1.5">
            <Save className="w-3.5 h-3.5" />
            Update password
          </Button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border-2 border-red-200 bg-red-50/40 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-red-700">
            Danger Zone
          </h2>
        </div>
        <p className="text-sm text-red-800">
          Deleting your account will permanently remove your user, your
          organization, and all of its registered Things from the registry. This
          action cannot be undone.
        </p>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete account?</DialogTitle>
              <DialogDescription>
                This permanently removes your user, the organization{' '}
                <strong>{org?.name}</strong>, and every Thing registered under
                it. There is no undo.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, delete everything'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </main>
  )
}
