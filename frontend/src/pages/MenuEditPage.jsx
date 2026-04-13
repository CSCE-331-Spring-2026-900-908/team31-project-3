import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Manager.css";
import API_BASE_URL from "../config/apiBaseUrl";

const MANAGER_TABS = ["Orders", "Menu", "Employees", "Inventory", "Reports"];

const MenuEditPage = () => {
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCanBeServedHot, setNewCanBeServedHot] = useState(false);
  const [newActive, setNewActive] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCanBeServedHot, setEditCanBeServedHot] = useState(false);
  const [editActive, setEditActive] = useState(true);

  const loadMenuItems = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/product`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load menu items.");
      }
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load menu items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return menuItems;
    return menuItems.filter(
      (item) =>
        String(item.name || "").toLowerCase().includes(query) ||
        String(item.category_name || "").toLowerCase().includes(query)
    );
  }, [menuItems, search]);

  const handleAddItem = async (event) => {
    event.preventDefault();
    const trimmedName = newName.trim();
    const parsedPrice = parseFloat(newPrice);

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Please enter a valid price.");
      return;
    }

    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          base_price: parsedPrice,
          category_name: newCategory.trim() || null,
          can_be_served_hot: newCanBeServedHot,
          is_active: newActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add menu item.");
      }
      setMenuItems((prev) => [data, ...prev]);
      setNewName("");
      setNewCategory("");
      setNewPrice("");
      setNewCanBeServedHot(false);
      setNewActive(true);
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || "Failed to add menu item.");
    }
  };

  const startEdit = (item) => {
    setEditingId(item.product_id);
    setEditName(item.name || "");
    setEditCategory(item.category_name || "");
    setEditPrice(String(item.base_price ?? ""));
    setEditCanBeServedHot(item.can_be_served_hot === true);
    setEditActive(item.is_active !== false);
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditCategory("");
    setEditPrice("");
    setEditCanBeServedHot(false);
    setEditActive(true);
  };

  const handleSaveEdit = async (productId) => {
    const trimmedName = editName.trim();
    const parsedPrice = parseFloat(editPrice);

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Please enter a valid price.");
      return;
    }

    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/product/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          base_price: parsedPrice,
          category_name: editCategory.trim() || null,
          can_be_served_hot: editCanBeServedHot,
          is_active: editActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update menu item.");
      }
      setMenuItems((prev) =>
        prev.map((item) => (item.product_id === productId ? data : item))
      );
      cancelEdit();
    } catch (err) {
      setError(err.message || "Failed to update menu item.");
    }
  };

  const handleDelete = async (productId) => {
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/product/${productId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error ||
            "Cannot delete this item. It may be referenced in existing orders. Consider deactivating it instead."
        );
      }
      setMenuItems((prev) => prev.filter((item) => item.product_id !== productId));
      if (editingId === productId) {
        cancelEdit();
      }
    } catch (err) {
      setError(err.message || "Failed to delete menu item.");
    }
  };

  const handleManagerTabClick = (t) => {
    if (t === "Menu") return;
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
            className={`manager-nav-btn${t === "Menu" ? " active" : ""}`}
            onClick={() => handleManagerTabClick(t)}
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
          <h2>Edit Menu</h2>

          <div className="employees-controls">
            <input
              className="manager-input"
              type="text"
              placeholder="Search by name or category"
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
              Add Item
            </button>
          </div>

          {error ? <p className="manager-error">{error}</p> : null}
          {loading ? <p className="manager-muted">Loading menu items...</p> : null}

          <div className="manager-table-wrap">
            <table className="manager-table">
              <thead>
                <tr>
                  <th className="menu-col-name">Name</th>
                  <th className="menu-col-category">Category</th>
                  <th className="menu-col-price">Price</th>
                  <th className="menu-col-active">Hot</th>
                  <th className="menu-col-active">Active</th>
                  <th className="menu-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isEditing = editingId === item.product_id;
                  return (
                    <tr key={item.product_id}>
                      <td>
                        {isEditing ? (
                          <input
                            className="manager-input manager-inline-input"
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          item.name
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="manager-input manager-inline-input"
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                          />
                        ) : (
                          item.category_name || <span className="manager-muted">—</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="manager-input menu-price-input"
                            type="number"
                            step="0.01"
                            min="0"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                          />
                        ) : (
                          `$${Number(item.base_price).toFixed(2)}`
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editCanBeServedHot}
                            onChange={(e) => setEditCanBeServedHot(e.target.checked)}
                          />
                        ) : (
                          item.can_be_served_hot ? "Yes" : "No"
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                          />
                        ) : (
                          item.is_active ? "Yes" : "No"
                        )}
                      </td>
                      <td className="manager-actions-cell">
                        {isEditing ? (
                          <div className="manager-actions-group">
                            <button
                              type="button"
                              className="manager-add-btn manager-small-btn"
                              onClick={() => handleSaveEdit(item.product_id)}
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
                              onClick={() => handleDelete(item.product_id)}
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
                      No menu items found.
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
                aria-labelledby="add-menu-item-title"
              >
                <h3 id="add-menu-item-title">Add Menu Item</h3>
                <form className="manager-modal-form" onSubmit={handleAddItem}>
                  <label className="manager-modal-label" htmlFor="add-item-name">
                    Name
                  </label>
                  <input
                    id="add-item-name"
                    className="manager-input"
                    type="text"
                    placeholder="Item name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />

                  <label className="manager-modal-label" htmlFor="add-item-category">
                    Category
                  </label>
                  <input
                    id="add-item-category"
                    className="manager-input"
                    type="text"
                    placeholder="e.g. Milk Tea, Fruit Tea"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />

                  <label className="manager-modal-label" htmlFor="add-item-price">
                    Base Price ($)
                  </label>
                  <input
                    id="add-item-price"
                    className="manager-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />

                  <label className="manager-modal-label" htmlFor="add-item-served-hot">
                    Hot
                  </label>
                  <input
                    id="add-item-served-hot"
                    type="checkbox"
                    checked={newCanBeServedHot}
                    onChange={(e) => setNewCanBeServedHot(e.target.checked)}
                  />

                  <label className="manager-modal-label" htmlFor="add-item-active">
                    Active
                  </label>
                  <input
                    id="add-item-active"
                    type="checkbox"
                    checked={newActive}
                    onChange={(e) => setNewActive(e.target.checked)}
                  />

                  <div className="manager-modal-actions">
                    <button type="submit" className="manager-add-btn">
                      Add Item
                    </button>
                    <button
                      type="button"
                      className="manager-remove-btn"
                      onClick={() => {
                        setShowAddModal(false);
                        setNewName("");
                        setNewCategory("");
                        setNewPrice("");
                        setNewCanBeServedHot(false);
                        setNewActive(true);
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

export default MenuEditPage;
