import { EmailSender } from "@/components/email-sender"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-6">
        <EmailSender />
      </main>
    </div>
  )
}
