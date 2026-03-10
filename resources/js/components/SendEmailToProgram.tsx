"use client"

import * as React from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import axios from "axios"
import { FileInput, Share2Icon, Loader2, ListIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

type Student = {
  id: number
  student_number: string
  student_name: string
  email?: string
}

interface Props {
  selectedStudents: Student[]
  disabled?: boolean
  onEmailSent?: () => void // Add this callback prop
}

export function SendEmailToSelected({ selectedStudents, disabled = false, onEmailSent }: Props) {
  const [open, setOpen] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)

  // Calculate the number of students with valid emails
  const studentsWithEmails = React.useMemo(() => {
    return selectedStudents.filter(s => s.email && s.email.trim() !== "").length
  }, [selectedStudents])

  const handleSend = async () => {
    const emails = selectedStudents.map(s => s.email).filter((e): e is string => Boolean(e))
    if (!emails.length) {
      toast.error("Selected students have no email addresses!")
      return
    }

    setIsSending(true)
    try {
      const response = await axios.post("/students/send-email", { emails })
      const { queued, failed } = response.data

      if (failed?.length > 0) {
        toast.warning(`Some emails failed: ${failed.join(", ")}`)
      }

      if (queued?.length > 0) {
        toast.success(`Sent to ${queued.length} email(s) successfully!`)
      }

      // Call the callback after successful email sending
      if (onEmailSent) {
        onEmailSent()
      }

      setOpen(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || "Failed to send emails")
    } finally {
      setIsSending(false)
    }
  }

  const handleShareLink = () => {
    const link = `${window.location.origin}/alumni-form-link`
    navigator.clipboard.writeText(link)
    toast.success("Form link copied to clipboard! 📎")
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleShareLink}>
        <Share2Icon className="w-4 h-4 mr-2" />
        Copy Link
      </Button>

      <Dialog open={open} onOpenChange={(isOpen) => {
        if (isSending) return; // Prevent closing when loading
        setOpen(isOpen);
      }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block"> {/* Wrap in div for tooltip to work on disabled button */}
              <Button 
                variant="default" 
                disabled={disabled || selectedStudents.length === 0}
                onClick={() => setOpen(true)}
              >
                <FileInput className="w-4 h-4 mr-2" />
                Send Form Link
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {disabled 
                ? ""
                : selectedStudents.length === 0 
                  ? "This will be sent to selected year or student" 
                  : "This will be sent to selected year or student"
              }
            </p>
          </TooltipContent>
        </Tooltip>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>Send email form to {selectedStudents.length} selected students?</p>
            <p className="text-sm text-muted-foreground mt-2">
              {studentsWithEmails} students have valid email addresses
            </p>
            {studentsWithEmails === 0 && (
              <p className="text-sm text-destructive mt-2">
                Cannot send emails: No valid email addresses found
              </p>
            )}
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button 
              onClick={handleSend} 
              disabled={isSending || studentsWithEmails === 0}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : "Send"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setOpen(false)} 
              disabled={isSending}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}