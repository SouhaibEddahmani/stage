<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JiraDataFetched implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $jiraData;

    public function __construct($jiraData)
    {
        $this->jiraData = $jiraData;
    }

    public function broadcastOn()
    {
        return new Channel('jira-data-channel');  // Channel name for broadcasting
    }

    public function broadcastWith()
    {
        return ['jiraData' => $this->jiraData];  // Data to broadcast
    }
}
