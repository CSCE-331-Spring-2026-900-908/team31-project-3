import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import "./Manager.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const DATE_RANGES = ["1 Week", "1 Month", "1 Year"];
const VIEW_MODES = ["Dashboard", "Table Only", "Chart Only"];
const MANAGER_TABS = ["Orders", "Menu", "Employees", "Inventory", "Reports"];

const REPORTS = [
  "Inventory Status",
  "Most Popular Modifiers",
  "Orders by Day of Week",
  "Revenue Over Time",
  "Sales by Category",
  "Top 5 Products",
  "Orders by Hour",
  "Revenue by Employee",
  "Product Usage Chart",
  "Sales Report",
  "X-Report",
  "Z-Report",
];

const FALLBACK_RESPONSE = {
  columns: ["Modifier", "Times Ordered"],
  rows: [
    { Modifier: "Whole Milk", "Times Ordered": 54 },
    { Modifier: "Medium", "Times Ordered": 48 },
    { Modifier: "100% Sugar", "Times Ordered": 48 },
    { Modifier: "Regular Ice", "Times Ordered": 44 },
    { Modifier: "Large", "Times Ordered": 10 },
  ],
  chart: [
    { label: "Whole Milk", value: 54 },
    { label: "Medium", value: 48 },
    { label: "100% Sugar", value: 48 },
    { label: "Regular Ice", value: 44 },
    { label: "Large", value: 10 },
  ],
};

const toRangeParam = (dateRange) => {
  if (dateRange === "1 Week") return "week";
  if (dateRange === "1 Year") return "year";
  return "month";
};

const ReportsPage = () => {
  const navigate = useNavigate();
  const [activeReport, setActiveReport] = useState("Most Popular Modifiers");
  const [activeRange, setActiveRange] = useState("1 Month");
  const [activeViewMode, setActiveViewMode] = useState("Dashboard");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [reportData, setReportData] = useState(FALLBACK_RESPONSE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadReport = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          report: activeReport,
          range: toRangeParam(activeRange),
        });

        const response = await fetch(`${API_BASE_URL}/reports?${params}`, {
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load report");
        }

        setReportData({
          columns: data.columns || [],
          rows: data.rows || [],
          chart: data.chart || [],
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Using fallback demo data (backend report unavailable)");
          setReportData(FALLBACK_RESPONSE);
        }
      } finally {
        setLoading(false);
      }
    };

    loadReport();
    return () => controller.abort();
  }, [activeReport, activeRange]);

  const chartData = reportData.chart || [];
  const chartRows = useMemo(
    () =>
      chartData.map((item) => ({
        label: String(item.label ?? ""),
        value: Number(item.value) || 0,
      })),
    [chartData]
  );
  const chartHeight = Math.max(220, chartRows.length * 32 + 120);
  const tableColumns = useMemo(
    () =>
      (reportData.columns || []).map((column) => ({
        field: column,
        headerName: column,
        minWidth: 140,
      })),
    [reportData.columns]
  );

  const pagedRows = useMemo(() => {
    const allRows = reportData.rows || [];
    const start = page * rowsPerPage;
    return allRows.slice(start, start + rowsPerPage);
  }, [reportData.rows, page, rowsPerPage]);

  useEffect(() => {
    // Reset pagination when report or range changes.
    setPage(0);
  }, [activeReport, activeRange]);

  const handleManagerTabClick = (tab) => {
    if (tab === "Reports") return;
    navigate("/manager");
  };

  return (
    <div className="manager-layout page">
      <nav className="manager-navbar">
        {MANAGER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`manager-nav-btn${tab === "Reports" ? " active" : ""}`}
            onClick={() => handleManagerTabClick(tab)}
          >
            {tab}
          </button>
        ))}
        <button
          type="button"
          className="manager-signout-btn"
          onClick={() => navigate("/")}
        >
          Sign Out
        </button>
      </nav>

      <div className="manager-content">
        <div className="reports-page">
          <aside className="reports-sidebar">
            <h3>Select a Report:</h3>
            <nav className="reports-nav">
              {REPORTS.map((reportName) => (
                <button
                  key={reportName}
                  type="button"
                  className={`report-link ${
                    activeReport === reportName ? "active" : ""
                  }`}
                  onClick={() => setActiveReport(reportName)}
                >
                  {reportName}
                </button>
              ))}
            </nav>
          </aside>

          <main className="reports-main">
            <h1>Manager Reports View</h1>

            <div className="reports-header">
              <h3>Date Range:</h3>
              <div className="filter-group">
                {DATE_RANGES.map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={`chip ${activeRange === range ? "active" : ""}`}
                    onClick={() => setActiveRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="view-toggle">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`chip alt ${
                    activeViewMode === mode ? "active" : ""
                  }`}
                  onClick={() => setActiveViewMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>

            <h2 className="report-title">{activeReport}</h2>
            {loading ? <p className="report-state">Loading report...</p> : null}
            {error ? <p className="report-state warning">{error}</p> : null}

            {activeViewMode !== "Table Only" ? (
              <section className="graph-card">
                {chartRows.length > 0 ? (
                  <BarChart
                    dataset={chartRows}
                    yAxis={[
                      {
                        scaleType: "band",
                        dataKey: "label",
                        width: 180,
                      },
                    ]}
                    series={[
                      {
                        dataKey: "value",
                        label: activeReport,
                      },
                    ]}
                    layout="horizontal"
                    height={chartHeight}
                    margin={{ top: 8, right: 16, bottom: 24, left: 0 }}
                    grid={{ vertical: true }}
                    borderRadius={8}
                  />
                ) : (
                  <p className="report-state">No chart data available.</p>
                )}
              </section>
            ) : null}

            {activeViewMode !== "Chart Only" ? (
              <section className="table-card">
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    overflow: "hidden",
                    backgroundColor: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: 440,
                  }}
                >
                  <TableContainer
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflow: "auto",
                    }}
                  >
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          {(reportData.columns || []).map((column) => (
                            <TableCell
                              key={column}
                              sx={{
                                backgroundColor: "#f8fafc",
                                borderBottom: "1px solid #e5e7eb",
                                fontWeight: 700,
                                color: "#6b7280",
                                minWidth: 140,
                              }}
                            >
                              {column}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {pagedRows.map((row, rowIndex) => (
                          <TableRow key={`${activeReport}-${page}-${rowIndex}`}>
                            {(reportData.columns || []).map((column) => (
                              <TableCell
                                key={`${column}-${rowIndex}`}
                                sx={{
                                  borderBottom: "1px solid #f3f4f6",
                                  fontSize: "0.95rem",
                                  color: "#111827",
                                }}
                                size="small"
                              >
                                {String(row?.[column] ?? "")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                </Paper>
              </section>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

