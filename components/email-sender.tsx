"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, X, Send, Code, Link2, Users, Sparkles, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function EmailSender() {
  const [emails, setEmails] = useState<string[]>([])
  const [singleEmail, setSingleEmail] = useState("")
  const [bulkEmails, setBulkEmails] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const addSingleEmail = () => {
    const trimmed = singleEmail.trim()
    if (trimmed && validateEmail(trimmed) && !emails.includes(trimmed)) {
      setEmails([...emails, trimmed])
      setSingleEmail("")
    }
  }

  const addBulkEmails = () => {
    const newEmails = bulkEmails
      .split(/[\s,;\n]+/)
      .map((e) => e.trim())
      .filter((e) => validateEmail(e) && !emails.includes(e))
    setEmails([...emails, ...newEmails])
    setBulkEmails("")
  }

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email))
  }

  const clearAllEmails = () => {
    setEmails([])
  }

  const handleSend = async () => {
  if (emails.length === 0 || !subject || !content) return
  setIsSending(true)
  
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emails,
        subject,
        html: content,
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    // Clear form on success
    setEmails([])
    alert('Email sent successfully!')
  } catch (error: any) {
    console.error('Error sending email:', error)
    alert(`Error: ${error.message || 'Failed to send email. Please try again.'}`)
  } finally {
    setIsSending(false)
  }
}

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Recipients Panel */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Recipients</h2>
          </div>
          <Badge variant="secondary" className="font-mono">
            {emails.length}
          </Badge>
        </div>

        <Tabs defaultValue="single" className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="single">Single</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
          </TabsList>
          <TabsContent value="single" className="mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="email@example.com"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSingleEmail()}
                className="bg-secondary border-border"
              />
              <Button onClick={addSingleEmail} size="icon" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="bulk" className="mt-4 space-y-3">
            <Textarea
              placeholder="Paste emails separated by comma, space, or new line..."
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              className="min-h-24 bg-secondary border-border resize-none"
            />
            <Button onClick={addBulkEmails} variant="secondary" className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Add All Valid Emails
            </Button>
          </TabsContent>
        </Tabs>

        {emails.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Added emails</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllEmails}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {emails.map((email) => (
                <div key={email} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2 group">
                  <span className="text-sm truncate">{email}</span>
                  <button
                    onClick={() => removeEmail(email)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {emails.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No recipients added yet</p>
            <p className="text-xs mt-1">Add emails to get started</p>
          </div>
        )}
      </Card>

      {/* Compose Panel */}
      <Card className="lg:col-span-2 p-6 bg-card border-border flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Send className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Compose Email</h2>
        </div>

        <div className="space-y-4 flex-1 flex flex-col">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Subject Line</label>
            <Input
              placeholder="Enter a compelling subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted-foreground">Email Content</label>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Code className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              placeholder="Write your email content here... HTML is supported."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 min-h-64 bg-secondary border-border resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {emails.length > 0 ? (
                <>
                  Ready to send to <span className="text-primary font-medium">{emails.length}</span> recipient
                  {emails.length !== 1 && "s"}
                </>
              ) : (
                "Add recipients to send"
              )}
            </p>
            <Button
              onClick={handleSend}
              disabled={emails.length === 0 || !subject || !content || isSending}
              className={cn("min-w-36", isSending && "animate-pulse")}
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {emails.length > 0 && `(${emails.length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
