<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   // database/migrations/xxxx_xx_xx_create_jira_tickets_table.php

// database/migrations/xxxx_xx_xx_create_jira_tickets_table.php

public function up()
{
    Schema::create('jira_tickets', function (Blueprint $table) {
        $table->id();
        $table->string('key')->unique();  // Unique key for Jira issue
        $table->string('summary')->nullable();
        $table->string('issuetype_name')->nullable();
        $table->string('status_name')->nullable();
        $table->timestamp('created')->nullable();
        $table->timestamp('updated')->nullable();
        $table->string('project_name')->nullable();
        $table->string('priority_name')->nullable();
        $table->integer('watch_count')->default(0); // Watch count as integer
        $table->string('resolution_name')->nullable();
        $table->string('assignee_name')->nullable();
        $table->string('reporter_name')->nullable();
        $table->text('labels')->nullable(); // Store labels as JSON
        $table->string('sprint_name')->nullable();
        $table->integer('time_spent_seconds')->default(0); // Time spent in seconds
        $table->timestamps();
    });
}



    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jira_tickets');
    }
};
