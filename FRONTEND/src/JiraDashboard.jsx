import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Button, Spinner, Badge, Collapse, Container, Row, Col, Form } from "react-bootstrap";
import { FaChevronDown, FaChevronUp, FaClock, FaProjectDiagram, FaEye, FaBolt, FaCheckCircle } from "react-icons/fa";
import { Pie, Line, Bar, Scatter, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from "chart.js";
import "./JiraDashboard.css";

// Register Chart.js components
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title
);

const JiraDashboard = () => {
  const [jiraData, setJiraData] = useState([]); // All fetched tickets
  const [displayedTickets, setDisplayedTickets] = useState([]); // Tickets currently displayed
  const [loading, setLoading] = useState(true); // Initial loading state
  const [fetchingMore, setFetchingMore] = useState(false); // Loading state for additional tickets
  const [error, setError] = useState(null);
  const [openIssue, setOpenIssue] = useState(null);
  const [showTickets, setShowTickets] = useState(false);
  const [filters, setFilters] = useState({
    projectName: "",
    issueType: "",
    status: "",
    priority: "",
  });

  const fetchJiraData = async (startAt = 0, maxResults = 100) => {
    try {
      console.log(`Fetching data: startAt=${startAt}, maxResults=${maxResults}`); // Log the fetch parameters
  
      const response = await axios.get("http://localhost:8000/api/fetch-jira-data", {
        params: { startAt, maxResults },
      });
  
      const { issues, total: fetchedTotal } = response.data;
  
      console.log(`Fetched ${issues.length} issues out of ${fetchedTotal} total issues.`); // Log the fetched data
  
      // Avoid duplicating issues based on issue ID
      setJiraData((prev) => {
        const existingIds = new Set(prev.map(issue => issue.id)); // Assuming issue.id is unique
        const newIssues = issues.filter(issue => !existingIds.has(issue.id));
        console.log(`Adding ${newIssues.length} new issues to the state.`); // Log the number of new issues
        return [...prev, ...newIssues];
      });
  
      setDisplayedTickets((prev) => {
        const existingIds = new Set(prev.map(issue => issue.id));
        const newIssues = issues.filter(issue => !existingIds.has(issue.id));
        return [...prev, ...newIssues];
      });
  
      // If there are more tickets to fetch, fetch the next chunk
      if (startAt + maxResults < fetchedTotal) {
        console.log(`Fetching more issues...`); // Log that more issues are being fetched
        setFetchingMore(true); // Show loading spinner for additional tickets
        fetchJiraData(startAt + maxResults, maxResults);
      } else {
        console.log(`All issues fetched. Total issues: ${jiraData.length + issues.length}`); // Log completion
        setLoading(false); // All tickets fetched
        setFetchingMore(false);
      }
    } catch (error) {
      console.error("Error fetching Jira data:", error);
      setError("Error fetching Jira data.");
      setLoading(false);
      setFetchingMore(false);
    }
  };

  // Fetch data on initial render and set up auto-refresh
  useEffect(() => {
    fetchJiraData(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchJiraData(); // Auto-refresh every 30 seconds
    }, 15000);

    return () => {
      clearInterval(intervalId); // Cleanup interval on unmount
    };
  }, []);

  // Calculate data for visualizations (using all fetched tickets)
  const statusCounts = useMemo(() => jiraData.reduce((acc, issue) => {
    const status = issue.fields?.status?.name || "N/A";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}), [jiraData]);

  const creationDates = useMemo(() => jiraData.map((issue) => new Date(issue.fields?.created).toLocaleDateString()), [jiraData]);
  const dateCounts = useMemo(() => creationDates.reduce((acc, date) => {
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {}), [creationDates]);

  const priorityCounts = useMemo(() => jiraData.reduce((acc, issue) => {
    const priority = issue.fields?.priority?.name || "N/A";
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {}), [jiraData]);

  const assigneeCounts = useMemo(() => jiraData.reduce((acc, issue) => {
    const assignee = issue.fields?.assignee?.displayName || "Unassigned";
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {}), [jiraData]);

  const issueTypeCounts = useMemo(() => jiraData.reduce((acc, issue) => {
    const type = issue.fields?.issuetype?.name || "N/A";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {}), [jiraData]);

  const resolutionTimeData = useMemo(() => jiraData.map((issue) => {
    const created = new Date(issue.fields?.created);
    const resolved = new Date(issue.fields?.resolutiondate || new Date());
    return (resolved - created) / (1000 * 60 * 60 * 24); // Convert to days
  }), [jiraData]);

  const resolutionTimeBuckets = useMemo(() => resolutionTimeData.reduce((acc, time) => {
    if (time <= 1) acc["0-1 days"] = (acc["0-1 days"] || 0) + 1;
    else if (time <= 7) acc["1-7 days"] = (acc["1-7 days"] || 0) + 1;
    else if (time <= 30) acc["7-30 days"] = (acc["7-30 days"] || 0) + 1;
    else acc[">30 days"] = (acc[">30 days"] || 0) + 1;
    return acc;
  }, {}), [resolutionTimeData]);

  // Simulate Sprint Burndown Data
  const sprintBurndownData = useMemo(() => {
    const sprintDuration = 14; // 14-day sprint
    const totalWork = 100; // Total story points or tasks
    return Array.from({ length: sprintDuration }, (_, i) => {
      const day = i + 1;
      const remainingWork = totalWork - (day * (totalWork / sprintDuration)); // Linear burndown
      return { day, remainingWork: Math.max(0, remainingWork) }; // Ensure remaining work doesn't go negative
    });
  }, []);

  // Data for visualizations (unchanged)
  const statusData = useMemo(() => ({
    labels: Object.keys(statusCounts),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#FF9F40", "#9966FF"],
    }],
  }), [statusCounts]);

  const lineData = useMemo(() => ({
    labels: Object.keys(dateCounts),
    datasets: [{
      label: "Issues Created",
      data: Object.values(dateCounts),
      borderColor: "#36A2EB",
      fill: false,
    }],
  }), [dateCounts]);

  const barData = useMemo(() => ({
    labels: Object.keys(priorityCounts),
    datasets: [{
      label: "Number of Issues",
      data: Object.values(priorityCounts),
      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
    }],
  }), [priorityCounts]);

  const scatterData = useMemo(() => ({
    datasets: [{
      label: "Time Spent vs. Estimated",
      data: jiraData.map((issue) => ({
        x: issue.fields?.timetracking?.timeSpentSeconds || 0,
        y: issue.fields?.timetracking?.timeEstimateSeconds || 0,
      })),
      backgroundColor: "#36A2EB",
    }],
  }), [jiraData]);

  const assigneeData = useMemo(() => ({
    labels: Object.keys(assigneeCounts),
    datasets: [{
      label: "Number of Issues",
      data: Object.values(assigneeCounts),
      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
    }],
  }), [assigneeCounts]);

  const issueTypeData = useMemo(() => ({
    labels: Object.keys(issueTypeCounts),
    datasets: [{
      data: Object.values(issueTypeCounts),
      backgroundColor: ["#4BC0C0", "#FF6384", "#36A2EB", "#FFCE56", "#FF9F40", "#9966FF"],
    }],
  }), [issueTypeCounts]);

  const resolutionTimeChartData = useMemo(() => ({
    labels: Object.keys(resolutionTimeBuckets),
    datasets: [{
      label: "Resolution Time (Days)",
      data: Object.values(resolutionTimeBuckets),
      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
    }],
  }), [resolutionTimeBuckets]);

  const sprintBurndownChartData = useMemo(() => ({
    labels: sprintBurndownData.map((data) => `Day ${data.day}`),
    datasets: [{
      label: "Remaining Work",
      data: sprintBurndownData.map((data) => data.remainingWork),
      borderColor: "#36A2EB",
      fill: false,
    }],
  }), [sprintBurndownData]);

  // Filter the tickets based on the filter criteria (using displayedTickets)
  const filteredTickets = useMemo(() => displayedTickets.filter((issue) => {
    return (
      (filters.projectName === "" || issue.fields?.project?.name?.toLowerCase().includes(filters.projectName.toLowerCase())) &&
      (filters.issueType === "" || issue.fields?.issuetype?.name?.toLowerCase().includes(filters.issueType.toLowerCase())) &&
      (filters.status === "" || issue.fields?.status?.name?.toLowerCase().includes(filters.status.toLowerCase())) &&
      (filters.priority === "" || issue.fields?.priority?.name?.toLowerCase().includes(filters.priority.toLowerCase()))
    );
  }), [displayedTickets, filters]);

  if (error) return <div className="error-message">{error}</div>;

  return (
    <Container fluid className="jira-dashboard-container p-0">
      <div className="dashboard-content">
        <h1 className="dashboard-title text-center">Jira Dashboard</h1>

        {/* Metrics Cards Row */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="metric-card bg-danger">
              <Card.Body>
                <Card.Title>Total Issues</Card.Title>
                <Card.Text className="metric-value">{jiraData.length}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="metric-card bg-primary">
              <Card.Body>
                <Card.Title>To do Issues</Card.Title>
                <Card.Text className="metric-value">
                  {jiraData.filter((issue) => issue.fields?.status?.name === "À faire").length}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="metric-card bg-warning">
              <Card.Body>
                <Card.Title>Open Issues</Card.Title>
                <Card.Text className="metric-value">
                  {jiraData.filter((issue) => issue.fields?.status?.name === "Ouvert").length}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="metric-card bg-success">
              <Card.Body>
                <Card.Title>Done Issues</Card.Title>
                <Card.Text className="metric-value">
                  {jiraData.filter((issue) => issue.fields?.status?.name === "Terminé").length}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Visualization Row 1 */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="visualization-card">
              <Card.Body>
                <Card.Title>Issue Status Distribution</Card.Title>
                <Pie data={statusData} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="visualization-card">
              <Card.Body>
                <Card.Title>Issue Creation Over Time</Card.Title>
                <Line data={lineData} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="visualization-card">
              <Card.Body>
                <Card.Title>Priority Distribution</Card.Title>
                <Bar data={barData} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Visualization Row 2 */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="visualization-card">
              <Card.Body>
                <Card.Title>Time Spent vs. Estimated</Card.Title>
                <Scatter data={scatterData} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="visualization-card">
              <Card.Body>
                <Card.Title>Assignee Workload</Card.Title>
                <Bar
                  data={assigneeData}
                  options={{
                    indexAxis: "y", // Horizontal bar chart
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="visualization-card">
              <Card.Body>
                <Card.Title>Issue Types Distribution</Card.Title>
                <Doughnut data={issueTypeData} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Visualization Row 3 (New Charts) */}
        <Row className="mb-4">
          <Col md={6}>
            <Card className="visualization-card">
              <Card.Body>
                <Card.Title>Resolution Time Distribution</Card.Title>
                <Bar
                  data={resolutionTimeChartData}
                  options={{
                    indexAxis: "x", // Vertical bar chart
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="visualization-card">
              <Card.Body>
                <Card.Title>Sprint Burndown</Card.Title>
                <Line
                  data={sprintBurndownChartData}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Remaining Work",
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Sprint Days",
                        },
                      },
                    },
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Show Tickets Button */}
        <div className="text-center">
          <Button
            variant="primary"
            onClick={() => setShowTickets(!showTickets)}
            className="mb-4"
          >
            {showTickets ? "Hide Tickets" : "Show Tickets"}
          </Button>
        </div>

        {/* Issue Cards Row */}
        {showTickets && (
          <div>
            {/* Filter Controls */}
            <Row className="mb-4">
              <Col md={3}>
                <Form.Control
                  placeholder="Filter by Project Name"
                  value={filters.projectName}
                  onChange={(e) => setFilters({ ...filters, projectName: e.target.value })}
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  placeholder="Filter by Issue Type"
                  value={filters.issueType}
                  onChange={(e) => setFilters({ ...filters, issueType: e.target.value })}
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  placeholder="Filter by Status"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  placeholder="Filter by Priority"
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                />
              </Col>
            </Row>

            {/* Issue Cards */}
            <Row>
              {filteredTickets.map((issue) => (
                <Col key={issue.id} md={6} lg={4} className="issue-column">
                  <Card className="jira-card shadow-sm hover-effect">
                    <Card.Body>
                      {/* Card Header */}
                      <Card.Title className="card-title d-flex justify-content-between align-items-center">
                        <span className="issue-key">
                          <FaProjectDiagram className="me-2" /> {/* Project Icon */}
                          {issue.key} - {issue.fields?.summary || "No Summary"}
                        </span>
                        <Button
                          variant="outline-primary"
                          className="toggle-btn"
                          onClick={() => setOpenIssue(openIssue === issue.id ? null : issue.id)}
                        >
                          {openIssue === issue.id ? <FaChevronUp /> : <FaChevronDown />}
                        </Button>
                      </Card.Title>

                      {/* Card Subtitle */}
                      <Card.Subtitle className="card-subtitle mb-3">
                        <FaBolt className="me-2" /> {/* Priority Icon */}
                        Priority: {issue.fields?.priority?.name || "N/A"}
                      </Card.Subtitle>

                      {/* Status Badge */}
                      <Badge
                        bg={issue.fields?.status?.name === "Done" ? "success" : "warning"}
                        className="status-badge mb-3"
                      >
                        <FaCheckCircle className="me-2" /> {/* Status Icon */}
                        {issue.fields?.status?.name || "N/A"}
                      </Badge>

                      {/* Collapsible Details */}
                      <Collapse in={openIssue === issue.id}>
                        <div className="issue-details mt-3">
                          <Row>
                            <Col md={6}>
                              <p className="detail-item">
                                <FaClock className="icon me-2" /> {/* Created Icon */}
                                <strong>Created:</strong> {new Date(issue.fields?.created).toLocaleString()}
                              </p>
                              <p className="detail-item">
                                <FaClock className="icon me-2" /> {/* Updated Icon */}
                                <strong>Updated:</strong> {new Date(issue.fields?.updated).toLocaleString()}
                              </p>
                              <p className="detail-item">
                                <FaProjectDiagram className="icon me-2" /> {/* Project Icon */}
                                <strong>Project:</strong> {issue.fields?.project?.name || "N/A"}
                              </p>
                            </Col>
                            <Col md={6}>
                              <p className="detail-item">
                                <FaEye className="icon me-2" /> {/* Assignee Icon */}
                                <strong>Assignee:</strong> {issue.fields?.assignee?.displayName || "Unassigned"}
                              </p>
                              <p className="detail-item">
                                <FaBolt className="icon me-2" /> {/* Priority Icon */}
                                <strong>Priority:</strong> {issue.fields?.priority?.name || "N/A"}
                              </p>
                              <p className="detail-item">
                                <FaCheckCircle className="icon me-2" /> {/* Reporter Icon */}
                                <strong>Reporter:</strong> {issue.fields?.reporter?.displayName || "N/A"}
                              </p>
                            </Col>
                          </Row>
                        </div>
                      </Collapse>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>
    </Container>
  );
};

export default JiraDashboard;