import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Box, Lock, ArrowRight, Mail } from 'lucide-react'
import { motion } from 'motion/react'
import { auth } from '#/lib/auth'

const DEMO_ACCOUNTS = [
  { email: 'admin@thingdaddy.dev', password: 'password', label: 'ThingDaddy Admin' },
  { email: 'somchai@cp.co.th', password: 'password', label: 'CP Group Demo' },
  { email: 'liwei@milesight.com', password: 'password', label: 'Milesight IoT' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as {
    redirect?: string
    thingType?: string
  }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectAfterLogin = () => {
    const target = search?.redirect
    const thingType = search?.thingType
    if (target) {
      navigate({
        to: target,
        search: thingType ? ({ thingType } as any) : ({} as any),
        replace: true,
      })
      return
    }
    navigate({ to: '/dashboard', replace: true })
  }

  useEffect(() => {
    if (auth.isAuthenticated()) redirectAfterLogin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await auth.login(email, password)
      redirectAfterLogin()
    } catch (err: any) {
      setError(err.message || 'Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-indigo-600/5 rotate-[-10deg] transform -translate-y-20 scale-150 origin-top-left -z-10" />
      <div className="absolute bottom-0 right-0 w-full h-96 bg-emerald-600/5 rotate-[10deg] transform translate-y-20 scale-150 origin-bottom-right -z-10" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm"><Box className="w-6 h-6 text-white" /></div>
            <span className="text-3xl font-bold text-gray-900 tracking-tight">Thing<span className="text-indigo-600">Daddy</span></span>
          </Link>
        </div>
        <h2 className="mt-8 text-center text-2xl font-bold text-gray-900">Sign in to ThingDaddy</h2>
        <p className="mt-2 text-center text-sm text-gray-500">Use your email to access the console</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-10 shadow-xl shadow-gray-200/50 sm:rounded-3xl sm:px-12 border border-gray-100">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />{error}
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">Email</label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-xl border-0 py-2.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 sm:text-sm transition-all"
                  placeholder="admin@thingdaddy.dev" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">Password</label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-xl border-0 py-2.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 sm:text-sm transition-all"
                  placeholder="Enter password" />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="group flex w-full justify-center items-center gap-2 rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-70">
              {isLoading ? 'Signing in...' : 'Sign in'}
              {!isLoading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-center mb-3">Demo accounts</p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(account => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-700">{account.label}</p>
                    <p className="text-xs text-gray-400 font-mono">{account.email} / {account.password}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">Create account</Link>
        </p>
      </motion.div>
    </main>
  )
}
