'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface InboxUI {
  id: number;
  job_title: string;
  company_name: string;
  description: string;
  status: 'pending' | 'accepted' | 'declined';
}

export default function JobInboxUI() {
  const [inboxes, setInboxes] = useState<InboxUI[]>([
    { id: 1, job_title: 'Frontend Developer', company_name: 'Acme Inc.', description: 'Build awesome UIs', status: 'pending' },
    { id: 2, job_title: 'Backend Developer', company_name: 'Beta LLC', description: 'APIs and databases', status: 'accepted' },
    { id: 3, job_title: 'UI/UX Designer', company_name: 'Gamma Co.', description: 'Design amazing experiences', status: 'declined' },
  ]);

  const handleStatus = (id: number, newStatus: 'accepted' | 'declined') => {
    setInboxes((prev) =>
      prev.map((inbox) => (inbox.id === id ? { ...inbox, status: newStatus } : inbox))
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">Inbox</h1>

      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Job Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inboxes.map((inbox) => (
            <TableRow key={inbox.id}>
              <TableCell>{inbox.job_title}</TableCell>
              <TableCell>{inbox.company_name}</TableCell>
              <TableCell>{inbox.description}</TableCell>
              <TableCell className="capitalize">{inbox.status}</TableCell>
              <TableCell className="space-x-2">
                {inbox.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => handleStatus(inbox.id, 'accepted')}>Accept</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleStatus(inbox.id, 'declined')}>Decline</Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
