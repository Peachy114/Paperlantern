<?php

namespace App\Exports;

use App\Models\Ticket;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class TicketsExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Ticket::with('user:id,name,email')->latest()->get();
    }

    public function headings(): array
    {
        return ['ID', 'User', 'Email', 'Category', 'Subject', 'Message', 'Status', 'Admin Notes', 'Created At', 'Resolved At'];
    }

    public function map($ticket): array
    {
        return [
            $ticket->id,
            $ticket->user->name ?? 'Deleted User',
            $ticket->user->email ?? '-',
            $ticket->category,
            $ticket->subject,
            $ticket->message,
            $ticket->status,
            $ticket->admin_notes,
            $ticket->created_at,
            $ticket->resolved_at,
        ];
    }
}