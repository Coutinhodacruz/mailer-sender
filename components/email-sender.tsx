"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, X, Send, Code, Link2, Users, Sparkles, Trash2, Link as LinkIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useRef } from "react"

export function EmailSender() {
  const [emails, setEmails] = useState<string[]>([])
  const [singleEmail, setSingleEmail] = useState("")
  const [bulkEmails, setBulkEmails] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wrapInTemplate = () => {
    const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || 'Email Template'}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    h1 {
      color: #007BFF;
      font-size: 20px;
    }
    p {
      font-size: 15px;
      margin: 10px 0;
    }
    .button {
      display: inline-block;
      background-color: #007BFF;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 20px;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #666666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Dear {{recipientName}},</h1>
    ${content}
    <div class="footer">
      © ${new Date().getFullYear()} .
    </div>
  </div>
</body>
</html>`
    setContent(template)
  }

  const insertLink = () => {
    if (!linkUrl) return

    const textToInsert = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText || linkUrl}</a>`

    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const newContent = content.substring(0, start) + textToInsert + content.substring(end)
      setContent(newContent)

      // Reset and close
      setLinkUrl("")
      setLinkText("")
      setIsLinkDialogOpen(false)

      // Restore focus (optional, might need setTimeout)
      textareaRef.current.focus()
    } else {
      // Fallback if ref is not available
      setContent(content + textToInsert)
      setLinkUrl("")
      setLinkText("")
      setIsLinkDialogOpen(false)
    }
  }

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
      toast.success('Email sent successfully!')
    } catch (error: any) {
      console.error('Error sending email:', error)
      toast.error(`Error: ${error.message || 'Failed to send email. Please try again.'}`)
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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={wrapInTemplate} title="Wrap in HTML Template">
                  <Code className="h-4 w-4" />
                </Button>
                <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Insert Link">
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Insert Link</DialogTitle>
                      <DialogDescription>
                        Add a hyperlink to your email content.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="link-url" className="text-right">
                          URL
                        </Label>
                        <Input
                          id="link-url"
                          placeholder="https://example.com"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="link-text" className="text-right">
                          Text
                        </Label>
                        <Input
                          id="link-text"
                          placeholder="Click here"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={insertLink}>Insert Link</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Textarea
              ref={textareaRef}
              placeholder="Write your content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 min-h-64 bg-secondary border-border resize-y font-mono text-sm field-sizing-fixed"
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
