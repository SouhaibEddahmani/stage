<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JiraDataUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $jiraData; // The data to broadcast

    // The constructor receives the Jira data and stores it in the class property
    public function __construct($jiraData)
    {
        $this->jiraData = $jiraData;
    }

    // The broadcastOn method defines the channel for broadcasting
    public function broadcastOn()
    {
        return new Channel('jira-data-channel'); // Channel name where the data will be broadcasted
    }

    // The broadcastWith method defines the data to be sent with the event
    public function broadcastWith()
    {
        return ['jiraData' => $this->jiraData]; // The data to send
    }
}
