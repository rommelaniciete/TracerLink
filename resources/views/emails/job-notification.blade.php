@php
    $deadlineDate = null;
    if (!empty($job->application_deadline)) {
        try {
            $deadlineDate = \Carbon\Carbon::parse($job->application_deadline);
        } catch (\Throwable $e) {
            $deadlineDate = null;
        }
    }

    $deadlineText = $deadlineDate ? $deadlineDate->format('F d, Y') : 'No deadline provided';
@endphp
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>Job Notification</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, Helvetica, sans-serif; color:#111827;">
    <span
        style="display:none!important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden;">
        New job opportunity: {{ $job->title }} at {{ $job->company_name }}.
    </span>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color:#f3f4f6;">
        <tr>
            <td align="center" style="padding:24px 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="max-width:600px; background-color:#ffffff; border:1px solid #e5e7eb;">
                    <tr>
                        <td style="padding:24px; background-color:#eff6ff; border-bottom:1px solid #dbeafe;">
                            <p
                                style="margin:0 0 8px 0; font-size:12px; line-height:16px; letter-spacing:0.08em; color:#1d4ed8; text-transform:uppercase;">
                                New Job Opportunity
                            </p>
                            <h1 style="margin:0; font-size:24px; line-height:30px; color:#111827;">
                                {{ $job->title }}
                            </h1>
                            <p style="margin:10px 0 0 0; font-size:14px; line-height:20px; color:#374151;">
                                Check the details below to see if this opportunity fits you.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:20px 24px 8px 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:0 8px 12px 0; vertical-align:top;">
                                        <p style="margin:0 0 4px 0; font-size:12px; line-height:16px; color:#6b7280;">
                                            Company</p>
                                        <p
                                            style="margin:0; font-size:16px; line-height:22px; color:#111827; font-weight:bold;">
                                            {{ $job->company_name }}
                                        </p>
                                    </td>
                                    <td style="padding:0 0 12px 8px; vertical-align:top;">
                                        <p style="margin:0 0 4px 0; font-size:12px; line-height:16px; color:#6b7280;">
                                            Apply Deadline</p>
                                        <p
                                            style="margin:0; font-size:16px; line-height:22px; color:#111827; font-weight:bold;">
                                            {{ $deadlineText }}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:8px 24px 20px 24px;">
                            <p style="margin:0; font-size:14px; line-height:22px; color:#374151;">
                                Please submit your application by
                                <strong style="color:#111827;">{{ $deadlineText }}</strong>.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 24px 24px 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="background-color:#f9fafb; border:1px solid #e5e7eb;">
                                @if(!empty($job->location))
                                    <tr>
                                        <td style="padding:14px 16px 0 16px;">
                                            <p style="margin:0; font-size:13px; line-height:19px; color:#374151;">
                                                <strong style="color:#111827;">Location:</strong> {{ $job->location }}
                                            </p>
                                        </td>
                                    </tr>
                                @endif

                                @if(!empty($job->location_link))
                                    <tr>
                                        <td style="padding:10px 16px 0 16px;">
                                            <p style="margin:0; font-size:13px; line-height:19px; color:#374151;">
                                                <strong style="color:#111827;">Map:</strong>
                                                <a href="{{ $job->location_link }}" target="_blank"
                                                    style="color:#1d4ed8; text-decoration:underline;">
                                                    View location map
                                                </a>
                                            </p>
                                        </td>
                                    </tr>
                                @endif

                                @if(!empty($job->description))
                                    <tr>
                                        <td style="padding:14px 16px 0 16px;">
                                            <p
                                                style="margin:0 0 6px 0; font-size:13px; line-height:19px; color:#111827; font-weight:bold;">
                                                Description</p>
                                            <p style="margin:0; font-size:13px; line-height:21px; color:#374151;">
                                                {!! nl2br(e($job->description)) !!}</p>
                                        </td>
                                    </tr>
                                @endif

                                @if(!empty($job->requirements))
                                    <tr>
                                        <td style="padding:14px 16px 0 16px;">
                                            <p
                                                style="margin:0 0 6px 0; font-size:13px; line-height:19px; color:#111827; font-weight:bold;">
                                                Requirements</p>
                                            <p style="margin:0; font-size:13px; line-height:21px; color:#374151;">
                                                {!! nl2br(e($job->requirements)) !!}</p>
                                        </td>
                                    </tr>
                                @endif

                                @if(!empty($job->responsibilities))
                                    <tr>
                                        <td style="padding:14px 16px 16px 16px;">
                                            <p
                                                style="margin:0 0 6px 0; font-size:13px; line-height:19px; color:#111827; font-weight:bold;">
                                                Responsibilities</p>
                                            <p style="margin:0; font-size:13px; line-height:21px; color:#374151;">
                                                {!! nl2br(e($job->responsibilities)) !!}</p>
                                        </td>
                                    </tr>
                                @else
                                    <tr>
                                        <td style="padding:0 16px 16px 16px;"></td>
                                    </tr>
                                @endif
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:0 24px 28px 24px;">
                            @if(!empty($job->apply_link))
                                <a href="{{ $job->apply_link }}" target="_blank"
                                    style="display:inline-block; padding:12px 28px; background-color:#2563eb; border:1px solid #2563eb; color:#ffffff; font-size:14px; font-weight:bold; text-decoration:none;">
                                    Apply Now
                                </a>
                            @else
                                <p style="margin:0; font-size:13px; line-height:20px; color:#374151;">
                                    Application link unavailable. Please contact the company directly for application steps.
                                </p>
                            @endif
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:16px 24px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
                            <p style="margin:0; font-size:12px; line-height:18px; color:#6b7280; text-align:center;">
                                You are receiving this email because you are registered on
                                <strong style="color:#374151;">Pampanga State U - LC TracerLink</strong>.
                            </p>
                            <p
                                style="margin:4px 0 0 0; font-size:12px; line-height:18px; color:#6b7280; text-align:center;">
                                &copy; {{ date('Y') }} Pampanga State U - LC TracerLink. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>