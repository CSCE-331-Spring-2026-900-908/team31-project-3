import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Manager.css";
import API_BASE_URL from "../config/apiBaseUrl";

const MANAGER_TABS = ["Orders", "Menu", "Employees", "Inventory", "Reports"];
const UNIT_OPTIONS = ["grams", "kg", "liters", "gallons"];

const stockLevel = (quantity, target) => {
  if (!target || target === 0) return null;
  return quantity / target;
};

const StockBar = ({ quantity, target }) => {
  const ratio = stockLevel(quantity, target);
  if (ratio === null) return <span className="manager-muted">—</span>;

  let color;
  if (ratio >= 0.81) color = "#2ecc71";
  else if (ratio >= 0.41) color = "#f1c40f";
  else if (ratio >= 0.16) color = "#e67e22";
  else color = "#e74c3c";

  const pct = Math.min(ratio, 1) * 100;
  return (
    <div className="inv-bar-track">
      <div className="inv-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
};

const InventoryPage = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newUnit, setNewUnit] = useState("kg");

  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState("");
  const [editTarget, setEditTarget] = useState("");

  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/inventory`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load inventory.");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      String(item.item_name || "").toLowerCase().includes(query)
    );
  }, [items, search]);

  const handleAddItem = async (event) => {
    event.preventDefault();
    const trimmedName = newName.trim();
    const parsedQty = parseFloat(newQty);
    const parsedTarget = parseFloat(newTarget);

    if (!trimmedName) { setError("Name is required."); return; }
    if (isNaN(parsedQty) || parsedQty < 0) { setError("Please enter a valid quantity."); return; }
    if (isNaN(parsedTarget) || parsedTarget < 0) { setError("Please enter a valid target."); return; }

    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: trimmedName,
          quantity: parsedQty,
          target_val: parsedTarget,
          unit_type: newUnit,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add item.");
      setItems((prev) => [data, ...prev]);
      setNewName("");
      setNewQty("");
      setNewTarget("");
      setNewUnit("kg");
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || "Failed to add item.");
    }
  };

  const startEdit = (item) => {
    setEditingId(item.item_id);
    setEditQty(String(item.quantity ?? ""));
    setEditTarget(String(item.target_val ?? ""));
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQty("");
    setEditTarget("");
  };

  const handleSaveEdit = async (itemId) => {
    const parsedQty = parseFloat(editQty);
    const parsedTarget = parseFloat(editTarget);

    if (isNaN(parsedQty) || parsedQty < 0) { setError("Please enter a valid quantity."); return; }
    if (isNaN(parsedTarget) || parsedTarget < 0) { setError("Please enter a valid target."); return; }

    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: parsedQty, target_val: parsedTarget }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update item.");
      setItems((prev) => prev.map((item) => (item.item_id === itemId ? data : item)));
      cancelEdit();
    } catch (err) {
      setError(err.message || "Failed to update item.");
    }
  };

  const handleDelete = async (itemId) => {
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete item.");
      setItems((prev) => prev.filter((item) => item.item_id !== itemId));
      if (editingId === itemId) cancelEdit();
    } catch (err) {
      setError(err.message || "Failed to delete item.");
    }
  };

  const handleTabClick = (t) => {
    if (t === "Inventory") return;
    const params = new URLSearchParams({ tab: t });
    navigate(`/manager?${params.toString()}`);
  };

  return (
    <div className="manager-layout page">
      <nav className="manager-navbar">
        {MANAGER_TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`manager-nav-btn${t === "Inventory" ? " active" : ""}`}
            onClick={() => handleTabClick(t)}
          >
            {t}
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
        <div className="manager-section">
          <h2>Inventory</h2>

          <div className="employees-controls">
            <input
              className="manager-input"
              type="text"
              placeholder="Search inventory"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              className="manager-add-btn"
              onClick={() => { setError(""); setShowAddModal(true); }}
            >
              Add Item
            </button>
          </div>

          {error ? <p className="manager-error">{error}</p> : null}
          {loading ? <p className="manager-muted">Loading inventory...</p> : null}

          <div className="manager-table-wrap">
            <table className="manager-table">
              <thead>
                <tr>
                  <th className="inv-col-name">Name</th>
                  <th className="inv-col-qty">Quantity</th>
                  <th className="inv-col-target">Target</th>
                  <th className="inv-col-unit">Unit</th>
                  <th className="inv-col-stock">Stock Level</th>
                  <th className="inv-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isEditing = editingId === item.item_id;
                  return (
                    <tr key={item.item_id}>
                      <td>{item.item_name}</td>
                      <td>
                        {isEditing ? (
                          <input
                            className="manager-input inv-num-input"
                            type="number"
                            min="0"
                            step="1"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                          />
                        ) : (
                          Number(item.quantity).toLocaleString()
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="manager-input inv-num-input"
                            type="number"
                            min="0"
                            step="1"
                            value={editTarget}
                            onChange={(e) => setEditTarget(e.target.value)}
                          />
                        ) : (
                          Number(item.target_val).toLocaleString()
                        )}
                      </td>
                      <td>{item.unit_type || "—"}</td>
                      <td>
                        <StockBar
                          quantity={isEditing ? parseFloat(editQty) || 0 : item.quantity}
                          target={isEditing ? parseFloat(editTarget) || 0 : item.target_val}
                        />
                      </td>
                      <td className="manager-actions-cell">
                        {isEditing ? (
                          <div className="manager-actions-group">
                            <button
                              type="button"
                              className="manager-add-btn manager-small-btn"
                              onClick={() => handleSaveEdit(item.item_id)}
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
                              onClick={() => startEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="manager-remove-btn manager-danger-btn"
                              onClick={() => handleDelete(item.item_id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="manager-empty">
                      No inventory items found.
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
                aria-labelledby="add-inv-title"
              >
                <h3 id="add-inv-title">Add Inventory Item</h3>
                <form className="manager-modal-form" onSubmit={handleAddItem}>
                  <label className="manager-modal-label" htmlFor="add-inv-name">Name</label>
                  <input
                    id="add-inv-name"
                    className="manager-input"
                    type="text"
                    placeholder="Item name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />

                  <label className="manager-modal-label" htmlFor="add-inv-qty">Quantity</label>
                  <input
                    id="add-inv-qty"
                    className="manager-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                  />

                  <label className="manager-modal-label" htmlFor="add-inv-target">Target</label>
                  <input
                    id="add-inv-target"
                    className="manager-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                  />

                  <label className="manager-modal-label" htmlFor="add-inv-unit">Unit</label>
                  <select
                    id="add-inv-unit"
                    className="manager-input manager-select"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>

                  <div className="manager-modal-actions">
                    <button type="submit" className="manager-add-btn">Add Item</button>
                    <button
                      type="button"
                      className="manager-remove-btn"
                      onClick={() => {
                        setShowAddModal(false);
                        setNewName("");
                        setNewQty("");
                        setNewTarget("");
                        setNewUnit("kg");
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
      </div>
    </div>
  );
};

export default InventoryPage;
