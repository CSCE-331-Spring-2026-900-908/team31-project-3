import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cashier from "./Cashier";
import "./Manager.css";
import API_BASE_URL from "../config/apiBaseUrl";


const TABS = ["Orders", "Menu", "Employees", "Inventory", "Reports"];
const ROLE_OPTIONS = ["Cashier", "Manager"];
const DEFAULT_TAB = "Orders";

const getInitialTab = (search) => {
  const requestedTab = new URLSearchParams(search).get("tab");
  return TABS.includes(requestedTab) && requestedTab !== "Reports"
    ? requestedTab
    : DEFAULT_TAB;
};

const Manager = () => {
  const location = useLocation();
  const [tab, setTab] = useState(() => getInitialTab(location.search));
  const navigate = useNavigate();

  useEffect(() => {
    setTab(getInitialTab(location.search));
  }, [location.search]);

  return (
    <div className="manager-layout">
      <nav className="manager-navbar">
        {TABS.map((t) => (
          <button
            key={t}
            className={`manager-nav-btn${tab === t ? " active" : ""}`}
            onClick={() => {
              if (t === "Reports") {
                navigate("/reports");
                return;
              }
              setTab(t);
            }}
          >
            {t}
          </button>
        ))}
        <button className="manager-signout-btn" onClick={() => navigate("/")}>
          Sign Out
        </button>
      </nav>

      {tab === "Orders" ? (
        <Cashier />
      ) : (
        <div className="manager-content">
          {tab === "Menu"      && <Section title="Menu Items" />}
          {tab === "Employees" && <EmployeesSection />}
          {tab === "Inventory" && <Section title="Inventory" />}
          {tab === "Reports"   && <Section title="Reports" />}
        </div>
      )}
    </div>
  );
};

const Section = ({ title }) => (
  <div className="manager-section">
    <h2>{title}</h2>
  </div>
);

const EmployeesSection = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Cashier");
  const [newPin, setNewPin] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("Cashier");
  const [editPin, setEditPin] = useState("");

  const loadEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/employees`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load employees.");
      }
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((emp) => String(emp.name || "").toLowerCase().includes(query));
  }, [employees, search]);

  const handleAddEmployee = async (event) => {
    event.preventDefault();
    const trimmedName = newName.trim();
    const trimmedPin = newPin.trim();
    if (!trimmedName || !trimmedPin) {
      setError("Name and PIN are required to add an employee.");
      return;
    }

    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          role: newRole,
          pin_hash: trimmedPin,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add employee.");
      }
      setEmployees((prev) => [data, ...prev]);
      setNewName("");
      setNewRole("Cashier");
      setNewPin("");
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || "Failed to add employee.");
    }
  };

  const startEdit = (employee) => {
    setEditingId(employee.id);
    setEditName(employee.name || "");
    setEditRole(employee.role || "Cashier");
    setEditPin("");
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditRole("Cashier");
    setEditPin("");
  };

  const handleSaveEdit = async (employeeId) => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setError("Employee name cannot be empty.");
      return;
    }

    setError("");
    try {
      const payload = { name: trimmedName, role: editRole };
      if (editPin.trim()) {
        payload.pin_hash = editPin.trim();
      }

      const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update employee.");
      }

      setEmployees((prev) =>
        prev.map((emp) => (emp.id === employeeId ? data : emp))
      );
      cancelEdit();
    } catch (err) {
      setError(err.message || "Failed to update employee.");
    }
  };

  const handleDelete = async (employeeId) => {
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete employee.");
      }
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
      if (editingId === employeeId) {
        cancelEdit();
      }
    } catch (err) {
      setError(err.message || "Failed to delete employee.");
    }
  };

  return (
    <div className="manager-section">
      <h2>Employees</h2>

      <div className="employees-controls">
        <input
          className="manager-input"
          type="text"
          placeholder="Search employees"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          type="button"
          className="manager-add-btn"
          onClick={() => {
            setError("");
            setShowAddModal(true);
          }}
        >
          Add Employee
        </button>
      </div>

      {error ? <p className="manager-error">{error}</p> : null}
      {loading ? <p className="manager-muted">Loading employees...</p> : null}

      <div className="manager-table-wrap">
        <table className="manager-table">
          <thead>
            <tr>
              <th className="employees-col-name">Name</th>
              <th className="employees-col-role">Role</th>
              <th className="employees-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => {
              const isEditing = editingId === employee.id;
              return (
                <tr key={employee.id}>
                  <td>
                    {isEditing ? (
                      <input
                        className="manager-input manager-inline-input"
                        type="text"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                      />
                    ) : (
                      employee.name
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select
                        className="manager-input manager-select manager-inline-input"
                        value={editRole}
                        onChange={(event) => setEditRole(event.target.value)}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      employee.role
                    )}
                  </td>
                  <td className="manager-actions-cell">
                    {isEditing ? (
                      <div className="manager-actions-group">
                        <input
                          className="manager-input manager-inline-input manager-pin-input"
                          type="password"
                          placeholder="New PIN (optional)"
                          value={editPin}
                          onChange={(event) => setEditPin(event.target.value)}
                        />
                        <button
                          type="button"
                          className="manager-add-btn manager-small-btn"
                          onClick={() => handleSaveEdit(employee.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="manager-remove-btn"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="manager-actions-group manager-actions-group-compact">
                        <button
                          type="button"
                          className="manager-remove-btn"
                          onClick={() => startEdit(employee)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="manager-remove-btn manager-danger-btn"
                          onClick={() => handleDelete(employee.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={3} className="manager-empty">
                  No employees found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {showAddModal ? (
        <div className="manager-modal-overlay" role="presentation">
          <div
            className="manager-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-employee-title"
          >
            <h3 id="add-employee-title">Add Employee</h3>
            <form className="manager-modal-form" onSubmit={handleAddEmployee}>
              <label className="manager-modal-label" htmlFor="add-employee-name">
                Name
              </label>
              <input
                id="add-employee-name"
                className="manager-input"
                type="text"
                placeholder="Employee name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />

              <label className="manager-modal-label" htmlFor="add-employee-role">
                Role
              </label>
              <select
                id="add-employee-role"
                className="manager-input manager-select"
                value={newRole}
                onChange={(event) => setNewRole(event.target.value)}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <label className="manager-modal-label" htmlFor="add-employee-pin">
                PIN
              </label>
              <input
                id="add-employee-pin"
                className="manager-input"
                type="password"
                placeholder="PIN"
                value={newPin}
                onChange={(event) => setNewPin(event.target.value)}
              />

              <div className="manager-modal-actions">
                <button type="submit" className="manager-add-btn">
                  Add Employee
                </button>
                <button
                  type="button"
                  className="manager-remove-btn"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewName("");
                    setNewRole("Cashier");
                    setNewPin("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Manager;
