import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Box,
  Mail,
  Lock,
  User,
  UserPlus,
  ChevronsUpDown,
  Building2,
  Globe,
  Wrench,
} from 'lucide-react'
import { motion } from 'motion/react'
import { auth } from '#/lib/auth'
import { COMPANY_PREFIX_DIRECTORY } from '#/lib/gs1/company-prefixes'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '#/components/ui/command'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import {
  COMPANY_DEMO_DATA,
  subdomainFromName,
} from '#/features/create/lib/demoData'
import Gs1ThailandForm from '../components/Gs1ThailandForm'
import { EMPTY_GS1_APPLICATION, type GS1ApplicationData } from '../types'

const FLAGS: Record<string, string> = {
  US: '\u{1F1FA}\u{1F1F8}', TH: '\u{1F1F9}\u{1F1ED}', JP: '\u{1F1EF}\u{1F1F5}',
  GB: '\u{1F1EC}\u{1F1E7}', DE: '\u{1F1E9}\u{1F1EA}', FR: '\u{1F1EB}\u{1F1F7}',
  KR: '\u{1F1F0}\u{1F1F7}', CN: '\u{1F1E8}\u{1F1F3}', AU: '\u{1F1E6}\u{1F1FA}',
  IN: '\u{1F1EE}\u{1F1F3}', BR: '\u{1F1E7}\u{1F1F7}', CH: '\u{1F1E8}\u{1F1ED}',
  IT: '\u{1F1EE}\u{1F1F9}', ES: '\u{1F1EA}\u{1F1F8}', NL: '\u{1F1F3}\u{1F1F1}',
  SE: '\u{1F1F8}\u{1F1EA}', TW: '\u{1F1F9}\u{1F1FC}',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [prefix, setPrefix] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [domain, setDomain] = useState('')
  const [gs1, setGs1] = useState<GS1ApplicationData>(EMPTY_GS1_APPLICATION)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const subdomain = useMemo(
    () =>
      subdomainFromName(gs1.memberName || companyName) ||
      subdomainFromName(name),
    [gs1.memberName, companyName, name],
  )
  const fullSubdomain = subdomain ? `${subdomain}.thingdaddy.com` : ''
  const emailLocalPart = email.includes('@')
    ? email.split('@')[0]
    : email || 'admin'
  const loginPreview = subdomain ? `${emailLocalPart}@${fullSubdomain}` : ''

  useEffect(() => {
    if (auth.isAuthenticated()) navigate({ to: '/dashboard', replace: true })
  }, [navigate])

  const handleSelectPrefix = (p: string) => {
    setPrefix(p)
    const entry = COMPANY_PREFIX_DIRECTORY.find((c) => c.prefix === p)
    const cName = entry?.name || `Company ${p}`
    setCompanyName(cName)
    setOpen(false)
    // Auto-fill memberName if user hasn't typed one yet
    if (!gs1.memberName) {
      setGs1((prev) => ({ ...prev, memberName: cName }))
    }
  }

  const handleFillDemo = () => {
    const d = COMPANY_DEMO_DATA
    setPrefix(d.companyPrefix)
    setCompanyName(d.name)
    setName(d.userName)
    setEmail(d.email)
    setPassword(d.password)
    setConfirmPassword(d.password)
    setDomain(d.domain)
    setGs1(d.gs1Application)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!prefix) {
      setError('Please select a company code')
      return
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (domain && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(domain.trim())) {
      setError('Please enter a valid domain (e.g. example.com)')
      return
    }

    setIsLoading(true)
    try {
      await auth.register({
        name: name.trim(),
        email: email.trim(),
        password,
        companyPrefix: prefix,
        domain: domain.trim() || undefined,
        subdomain: fullSubdomain || undefined,
        gs1Application: gs1,
      })
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const selected = COMPANY_PREFIX_DIRECTORY.find((c) => c.prefix === prefix)

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Brand link */}
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
              <Box className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">
              Thing<span className="text-indigo-600">Daddy</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center justify-end mb-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFillDemo}
            className="gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5" />
            Fill Demo Data
          </Button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
            {error}
          </motion.div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Account panel */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Account
            </h3>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Company Code
              </label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border-0 py-2 px-3 text-sm shadow-sm ring-1 ring-inset ring-gray-300 transition-all focus:ring-2 focus:ring-indigo-600',
                      !prefix && 'text-gray-400',
                    )}
                  >
                    {selected ? (
                      <span className="truncate">
                        {FLAGS[selected.country] || ''} {selected.name} —{' '}
                        {selected.prefix}
                      </span>
                    ) : (
                      'Search company...'
                    )}
                    <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[420px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name or prefix..." />
                    <CommandList>
                      <CommandEmpty>No company found.</CommandEmpty>
                      <CommandGroup>
                        {COMPANY_PREFIX_DIRECTORY.map((c) => (
                          <CommandItem
                            key={c.prefix}
                            value={`${c.name} ${c.prefix} ${c.nameLocal || ''}`}
                            onSelect={() => handleSelectPrefix(c.prefix)}
                            className="flex items-center gap-2"
                          >
                            <span className="text-base leading-none">
                              {FLAGS[c.country] || ''}
                            </span>
                            <span className="flex-1 truncate text-sm">
                              {c.name}
                            </span>
                            <span className="font-mono text-xs text-gray-400">
                              {c.prefix}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {companyName && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Company Name
                </label>
                <div className="flex items-center gap-2 rounded-lg py-2 px-3 bg-gray-50 ring-1 ring-inset ring-gray-200 text-sm text-gray-700">
                  <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                  {companyName}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    className="block w-full rounded-lg border-0 py-2 pl-9 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600"
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
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="block w-full rounded-lg border-0 py-2 pl-9 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="block w-full rounded-lg border-0 py-2 pl-9 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="block w-full rounded-lg border-0 py-2 pl-9 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* GS1 Thailand-style form */}
          <Gs1ThailandForm value={gs1} onChange={setGs1} companyPrefix={prefix} />

          {/* ThingDaddy Domain Setup */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              ThingDaddy Domain Setup
            </h3>

            <div>
              <label
                htmlFor="domain"
                className="block text-[11px] font-semibold text-gray-700 mb-1"
              >
                Your Domain
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="abc.com"
                  className="block w-full rounded-lg border-0 py-2 pl-9 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Your registered Things will be accessible at warranty pages
                mapped to this domain.
              </p>
            </div>

            {fullSubdomain && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                    Your ThingDaddy Subdomain
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-indigo-900 break-all">
                    {fullSubdomain}
                  </p>
                  <p className="mt-1 text-[10px] text-indigo-700/80">
                    This subdomain will host warranty and Thing information
                    pages for your organization.
                  </p>
                </div>
                {loginPreview && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                      Your login will be
                    </p>
                    <p className="mt-1 font-mono text-sm text-indigo-900 break-all">
                      {loginPreview}
                    </p>
                    <p className="mt-1 text-[10px] text-indigo-700/80">
                      This is your subdomain identity — no email is created.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={isLoading}
            className="group flex w-full justify-center items-center gap-2 rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-70"
          >
            {isLoading ? 'Creating account...' : 'Submit Application'}
            {!isLoading && <UserPlus className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Sign in here
          </Link>
        </p>
      </motion.div>
    </main>
  )
}
