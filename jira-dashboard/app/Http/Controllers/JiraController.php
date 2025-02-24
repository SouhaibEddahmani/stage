<?php

namespace App\Http\Controllers;
use App\Events\JiraDataFetched; // Import the event
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class JiraController extends Controller
{
    public function fetchJiraData(Request $request)
    {
        // Get the startAt and maxResults from the query parameters (default to 0 and 100 if not provided)
        $startAt = $request->query('startAt', 0);  // Default to 0 if not provided
        $maxResults = $request->query('maxResults', 100);  // Default to 100 if not provided
        
        
        // Define the URL for the Jira API
        $url = 'https://souhaibeddahmani2.atlassian.net/rest/api/3/search';
        
        // Send the request to the Jira API with the necessary headers and query parameters
        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . base64_encode('souhaibeddahmani2@gmail.com:ATATT3xFfGF0NzF3alonnZZ-YnE_Z1LjYfKq-dVcd7EeYmhik0TaAPzpVaBJPZBgBJSoLKpb7rlbn5yPBn_pBHWo_xUeQaQBjeVmM3IRynrjLHYxa4D_dRqj1kYIeQ9cWyq_ohY0JDfhpuWK304O-ZgDuIdAE2St2B_FhHpu_HPssCydSdfmTOg=01BEF861')
        ])->get($url, [
            'jql' => 'ORDER BY created DESC',  // Sort by creation date
            'maxResults' => $maxResults,  // Fetch the number of results defined by maxResults
            'startAt' => $startAt,  // Fetch results starting from the startAt index
            'fields' => 'id,key,summary,priority,status,created,updated,project,assignee,reporter,issuetype'

        ]);

        // Get the response as JSON
        $jiraData = $response->json();

        // Broadcasting the fetched Jira data
        broadcast(new JiraDataFetched($jiraData));  // Dispatch the event to the frontend
       
        // Return the data as a JSON response
        return response()->json($jiraData);
    }
    
}
//haka