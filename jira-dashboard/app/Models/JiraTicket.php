<?php
// app/Models/JiraTicket.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JiraTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'key', 'summary', 'issuetype_name', 'status_name', 'created', 
        'updated', 'project_name', 'priority_name', 'watch_count', 
        'resolution_name', 'assignee_name', 'reporter_name', 'labels', 
        'sprint_name', 'time_spent_seconds'
    ];

    protected $casts = [
        'labels' => 'array', // Cast 'labels' as an array
    ];
}
