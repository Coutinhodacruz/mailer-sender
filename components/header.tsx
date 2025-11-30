import { Mail } from "lucide-react"

export function Header() {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
          <Mail className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-semibold">MailFlow</span>
      </div>
      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
        JD
      </div>
    </header>
  )
}
