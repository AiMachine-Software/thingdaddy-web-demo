import { Box } from "lucide-react";

export default function AppFooter() {
  return (
    <footer className="py-8 px-6 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-indigo-400" />
            <span>ThingDaddy © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              API Docs
            </a>
            <a
              href="https://github.com/noppakunNpk/thing_daddy_core_web"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
  )
}
