<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Notification</title>
</head>
<body style="background-color:#f9fafb; color:#1f2937; font-family: Arial, sans-serif; margin:0; padding:20px;">

  <div style="max-width:600px; margin:20px auto; background-color:#ffffff;overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background-color:#f3f4f6; padding:24px; text-align:center;">
      <h2 style="color:#111827; font-size:20px; font-weight:bold; margin:0 0 8px 0;">
        New Job Opportunity: {{ $job->title }}
      </h2>
      <p style="color:#6b7280; font-size:13px; margin:0;">Check the details below to see if this opportunity fits you</p>
    </div>

    <!-- Date Info -->
    <div style="display:flex; justify-content:center; gap:16px; padding:24px; flex-wrap:wrap;">
      <div style="color:#111827; padding:16px;  text-align:center; min-width:120px;">
        <div style="font-size:12px; opacity:0.7; margin-bottom:4px;">Apply deadline</div>
        <div style="font-size:16px">
          {{ \Carbon\Carbon::parse($job->application_deadline)->format('F d, Y') }}
        </div>
      </div>
    </div>

    <p style="text-align:center;color:#374151; padding:0 24px 24px 24px; margin:0;">
      Please submit your application on or before
      <span style="font-weight:600; color:#111827;">
        {{ \Carbon\Carbon::parse($job->application_deadline)->format('F d, Y') }}
      </span>.
    </p>

    <!-- Job Info -->
    <div style="background-color:#f9fafb; padding:24px; margin:0 24px 24px 24px; font-size:14px; line-height:1.5;">
      <p><strong>Company:</strong> {{ $job->company_name }}</p>
       
      @if($job->location)
        <p><strong>Location:</strong> {{ $job->location }}</p>
      @endif

      @if($job->location_link)
        <p><strong>Location:</strong> 
          <a href="{{ $job->location_link }}" target="_blank" style="color:#111827; text-decoration:underline;">
            📍 Click to view
          </a>
        </p>
      @endif

      @if($job->description)
        <p><strong>Description:</strong> {{ $job->description }}</p>
      @endif

      @if($job->requirements)
        <p><strong>Requirements:</strong> {{ $job->requirements }}</p>
      @endif

      @if($job->responsibilities)
        <p><strong>Responsibilities:</strong> {{ $job->responsibilities }}</p>
      @endif
    </div>

    <!-- Apply Button -->
    @if($job->apply_link)
    <div style="text-align:center; margin-bottom:32px;">
      <a href="{{ $job->apply_link }}" 
         style="display:inline-block; padding:16px 40px; background:linear-gradient(to bottom,#60a5fa,#3b82f6); color:#ffffff; font-weight:bold; font-size:16px; border-radius:9999px; text-decoration:none; border:2px solid #60a5fa; text-transform:uppercase; letter-spacing:1px; box-shadow:0 2px 6px rgba(0,0,0,0.2);">
        Apply Now
      </a>
    </div>
    @endif

    <!-- Footer -->
    <div style="background-color:#f3f4f6; text-align:center; color:#6b7280; font-size:12px; padding:16px; border-top:1px solid #d1d5db;">
      You are receiving this email because you are registered on <strong>Pampanga State U - LC TracerLink</strong>.<br>
      &copy; {{ date('Y') }} Pampanga State U - LC TracerLink. All rights reserved.
    </div>

  </div>
</body>
</html>
