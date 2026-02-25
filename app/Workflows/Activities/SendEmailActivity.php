<?php

namespace App\Workflows\Activities;

use Illuminate\Support\Facades\Mail;
use Workflow\Activity;

class SendEmailActivity extends Activity
{
    public function execute(string $email, string $subject, string $body): bool
    {
        Mail::raw($body, function ($message) use ($email, $subject) {
            $message->to($email)
                ->subject($subject);
        });

        return true;
    }
}
