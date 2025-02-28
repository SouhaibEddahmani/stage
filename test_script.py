import requests
import mysql.connector
from mysql.connector import Error
import base64
from datetime import datetime

# Jira API details
API_URL = "https://souhaibeddahmani2.atlassian.net/rest/api/3/search"
API_EMAIL = "souhaibeddahmani2@gmail.com"  # Your Atlassian email
API_TOKEN = "ATATT3xFfGF0NzF3alonnZZ-YnE_Z1LjYfKq-dVcd7EeYmhik0TaAPzpVaBJPZBgBJSoLKpb7rlbn5yPBn_pBHWo_xUeQaQBjeVmM3IRynrjLHYxa4D_dRqj1kYIeQ9cWyq_ohY0JDfhpuWK304O-ZgDuIdAE2St2B_FhHpu_HPssCydSdfmTOg=01BEF861"

# MySQL Connection Details
DB_CONFIG = {
    'host': 'mysql-1da10591-souhaibeddahmani2-0320.c.aivencloud.com',
    'port': 11746,
    'user': 'avnadmin',
    'password': 'AVNS_4GW5dfHHy2b1hFoGm74',
    'database': 'new_database'
}

# Jira API Authentication
auth = base64.b64encode(f"{API_EMAIL}:{API_TOKEN}".encode()).decode()
headers = {
    "Authorization": f"Basic {auth}",
    "Accept": "application/json"
}

# Function to fetch Jira issues with pagination
def fetch_jira_issues(start_at=0, max_results=100):
    params = {
        'jql': 'ORDER BY created DESC',  # Modify this if needed
        'startAt': start_at,
        'maxResults': max_results,
        'fields': 'key,summary,priority,status,created,updated,project,assignee,reporter,issuetype'
    }
    response = requests.get(API_URL, headers=headers, params=params)
    response.raise_for_status()  # Raise error if request fails
    return response.json()

# Function to format Jira datetime fields to MySQL format
def format_jira_datetime(jira_date):
    try:
        dt = datetime.strptime(jira_date[:-5], "%Y-%m-%dT%H:%M:%S.%f")
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception as e:
        print(f"❌ Error formatting date: {e}")
        return None

def test_connection():
    try:
        # Connect to MySQL
        connection = mysql.connector.connect(**DB_CONFIG)
        
        if connection.is_connected():
            print("Connected to MySQL server successfully!")
            cursor = connection.cursor()

            # Create the table if it doesn't exist, making `key` unique
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS issues (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    `key` VARCHAR(255) UNIQUE,  # Set `key` to UNIQUE to avoid duplication
                    summary TEXT,
                    priority VARCHAR(100),
                    _status VARCHAR(100),
                    created DATETIME,
                    updated DATETIME,
                    project VARCHAR(100),
                    assignee VARCHAR(100),
                    reporter VARCHAR(100),
                    issuetype VARCHAR(100)
                );
            """)

            # Fetch issues from Jira with pagination
            start_at = 0
            while True:
                data = fetch_jira_issues(start_at)

                if not data.get('issues'):
                    break  # No more issues, exit the loop

                # Insert Jira issues into MySQL
                for issue in data['issues']:
                    created = format_jira_datetime(issue['fields']['created'])
                    updated = format_jira_datetime(issue['fields']['updated'])

                    sql = """
                        INSERT INTO issues (`key`, summary, priority, _status, created, updated, project, assignee, reporter, issuetype)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    values = (
                        issue['key'],
                        issue['fields']['summary'],
                        issue['fields']['priority']['name'] if issue['fields'].get('priority') else None,
                        issue['fields']['status']['name'],
                        created,  # Use formatted date
                        updated,  # Use formatted date
                        issue['fields']['project']['name'],
                        issue['fields']['assignee']['displayName'] if issue['fields'].get('assignee') else None,
                        issue['fields']['reporter']['displayName'],
                        issue['fields']['issuetype']['name']
                    )
                    cursor.execute(sql, values)

                connection.commit()
                print(f"✅ Inserted issues starting from {start_at}")

                # Move to the next page (startAt increment)
                start_at += 100  # Adjust this based on the max results per request

            print("✅ All Jira issues successfully inserted into MySQL!")

            cursor.close()
    
    except Error as e:
        print("Error while connecting to MySQL:", e)
    
    finally:
        if connection.is_connected():
            connection.close()
            print("MySQL connection is closed")

if __name__ == "__main__":
    test_connection()
