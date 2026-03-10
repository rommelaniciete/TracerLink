<?php

namespace App\Jobs;

use App\Mail\AlumniFormMail;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class SendAlumniFormEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $student;

    public function __construct($student)
    {
        $this->student = $student;
    }

    public function handle()
    {
        try {
            Mail::to($this->student->email)->send(new AlumniFormMail($this->student));
        } catch (\Exception $e) {
            Log::error('SendAlumniFormEmail failed: ' . $e->getMessage());
            throw $e; // Re-throw to fail the job properly
        }
    }
}
