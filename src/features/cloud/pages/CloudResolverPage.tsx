import ResolverPanel from '../components/ResolverPanel'

export default function CloudResolverPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Cloud Resolver
        </h1>
        <p className="text-gray-500 mt-2">
          ThingDaddy is the "DNS for Things". Resolve any cloud-platform
          identifier back to a single ThingDaddy URI and view all connected
          clouds for that Thing.
        </p>
      </div>

      <ResolverPanel />
    </main>
  )
}
