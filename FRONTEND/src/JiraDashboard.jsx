import React, { useState, useEffect } from "react";
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
  const [jiraData, setJiraData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openIssue, setOpenIssue] = useState(null);
  const [showTickets, setShowTickets] = useState(false);
  const [filters, setFilters] = useState({
    projectName: "",
    issueType: "",
    status: "",
    priority: "",
  });

  const fetchJiraData = async () => {
    try {
      let allIssues = [];
      let startAt = 0;
      let total = null;

      // Loop to fetch data in pages
      while (total === null || startAt < total) {
        const response = await axios.get("http://localhost:8000/api/fetch-jira-data", {
          params: {
            startAt: startAt,
            maxResults: 100, // You can adjust this as needed
          },
        });

        const { issues, total: fetchedTotal } = response.data;

        if (total === null) total = fetchedTotal; // Set total only once

        allIssues = [...allIssues, ...issues]; // Accumulate issues
        startAt += issues.length; // Move pagination forward

        console.log(`Fetched ${issues.length} issues, total: ${total}, startAt: ${startAt}`);
      }

      setJiraData(allIssues);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching Jira data:", error);
      setError("Error fetching Jira data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJiraData();
    const interval = setInterval(fetchJiraData, 120000); // Fetch data every 120s
    return () => clearInterval(interval);
  }, []);

  // Calculate data for visualizations
  const statusCounts = jiraData.reduce((acc, issue) => {
    const status = issue.fields?.status?.name || "N/A";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const creationDates = jiraData.map((issue) => new Date(issue.fields?.created).toLocaleDateString());
  const dateCounts = creationDates.reduce((acc, date) => {
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const priorityCounts = jiraData.reduce((acc, issue) => {
    const priority = issue.fields?.priority?.name || "N/A";
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  const assigneeCounts = jiraData.reduce((acc, issue) => {
    const assignee = issue.fields?.assignee?.displayName || "Unassigned";
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {});

  const issueTypeCounts = jiraData.reduce((acc, issue) => {
    const type = issue.fields?.issuetype?.name || "N/A";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Calculate Resolution Time Distribution
  const resolutionTimeData = jiraData.map((issue) => {
    const created = new Date(issue.fields?.created);
    const resolved = new Date(issue.fields?.resolutiondate || new Date());
    const resolutionTime = (resolved - created) / (1000 * 60 * 60 * 24); // Convert to days
    return resolutionTime;
  });

  const resolutionTimeBuckets = resolutionTimeData.reduce((acc, time) => {
    if (time <= 1) acc["0-1 days"] = (acc["0-1 days"] || 0) + 1;
    else if (time <= 7) acc["1-7 days"] = (acc["1-7 days"] || 0) + 1;
    else if (time <= 30) acc["7-30 days"] = (acc["7-30 days"] || 0) + 1;
    else acc[">30 days"] = (acc[">30 days"] || 0) + 1;
    return acc;
  }, {});

  // Simulate Sprint Burndown Data
  const sprintDuration = 14; // 14-day sprint
  const totalWork = 100; // Total story points or tasks
  const burndownData = Array.from({ length: sprintDuration }, (_, i) => {
    const day = i + 1;
    const remainingWork = totalWork - (day * (totalWork / sprintDuration)); // Linear burndown
    return { day, remainingWork: Math.max(0, remainingWork) }; // Ensure remaining work doesn't go negative
  });

  // Data for Sprint Burndown Chart (Line Chart)
  const sprintBurndownData = {
    labels: burndownData.map((data) => `Day ${data.day}`),
    datasets: [
      {
        label: "Remaining Work",
        data: burndownData.map((data) => data.remainingWork),
        borderColor: "#36A2EB",
        fill: false,
      },
    ],
  };

  // Data for Pie Chart (Status Distribution)
  const statusData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: [
          "#FF6384", // Red
          "#36A2EB", // Blue
          "#FFCE56", // Yellow
          "#4BC0C0", // Teal
          "#FF9F40", // Orange
          "#9966FF", // Purple
        ],
      },
    ],
  };

  // Data for Line Chart (Issue Creation Over Time)
  const lineData = {
    labels: Object.keys(dateCounts),
    datasets: [
      {
        label: "Issues Created",
        data: Object.values(dateCounts),
        borderColor: "#36A2EB",
        fill: false,
      },
    ],
  };

  // Data for Bar Chart (Priority Distribution)
  const barData = {
    labels: Object.keys(priorityCounts),
    datasets: [
      {
        label: "Number of Issues",
        data: Object.values(priorityCounts),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
      },
    ],
  };

  // Data for Scatter Plot (Time Spent vs. Estimated Time)
  const scatterData = {
    datasets: [
      {
        label: "Time Spent vs. Estimated",
        data: jiraData.map((issue) => ({
          x: issue.fields?.timetracking?.timeSpentSeconds || 0,
          y: issue.fields?.timetracking?.timeEstimateSeconds || 0,
        })),
        backgroundColor: "#36A2EB",
      },
    ],
  };

  // Data for Horizontal Bar Chart (Assignee Workload)
  const assigneeData = {
    labels: Object.keys(assigneeCounts),
    datasets: [
      {
        label: "Number of Issues",
        data: Object.values(assigneeCounts),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
      },
    ],
  };

  // Data for Doughnut Chart (Issue Types Distribution)
  const issueTypeData = {
    labels: Object.keys(issueTypeCounts),
    datasets: [
      {
        data: Object.values(issueTypeCounts),
        backgroundColor: [
          "#4BC0C0", // Teal
          "#FF6384", // Red
          "#36A2EB", // Blue
          "#FFCE56", // Yellow
          "#FF9F40", // Orange
          "#9966FF", // Purple
        ],
      },
    ],
  };

  // Data for Resolution Time Distribution (Bar Chart)
  const resolutionTimeChartData = {
    labels: Object.keys(resolutionTimeBuckets),
    datasets: [
      {
        label: "Resolution Time (Days)",
        data: Object.values(resolutionTimeBuckets),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
      },
    ],
  };

  // Filter the tickets based on the filter criteria
  const filteredTickets = jiraData.filter((issue) => {
    return (
      (filters.projectName === "" || issue.fields?.project?.name?.toLowerCase().includes(filters.projectName.toLowerCase())) &&
      (filters.issueType === "" || issue.fields?.issuetype?.name?.toLowerCase().includes(filters.issueType.toLowerCase())) &&
      (filters.status === "" || issue.fields?.status?.name?.toLowerCase().includes(filters.status.toLowerCase())) &&
      (filters.priority === "" || issue.fields?.priority?.name?.toLowerCase().includes(filters.priority.toLowerCase()))
    );
  });

  if (loading) return (
    <div className="spinner">
      <Spinner animation="border" className="loading-spinner" />
    </div>
  );

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
                  data={sprintBurndownData}
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