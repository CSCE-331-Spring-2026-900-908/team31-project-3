import { Link } from "react-router-dom";

const views = [
  { label: "Menu Board", path: "/menu-board", desc: "Non-interactive display" },
  { label: "Customer", path: "/customer", desc: "Self-service kiosk" },
  { label: "Cashier", path: "/login?role=cashier", desc: "Point-of-sale system" },
  { label: "Manager", path: "/manager", desc: "Point-of-sale system" },
];

const Portal = () => (
  <div style={styles.container}>
    <div style={styles.grid}>
      {views.map(({ label, path, desc }) => (
        <Link key={path} to={path} style={styles.card}>
          <span style={styles.cardLabel}>{label}</span>
          <span style={styles.cardDesc}>{desc}</span>
        </Link>
      ))}
    </div>
  </div>
);

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 200px)",
    gridTemplateRows: "repeat(2, 200px)",
    gap: "16px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    aspectRatio: "1 / 1",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    textDecoration: "none",
    color: "#111827",
    boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
    transition: "box-shadow 0.15s",
  },
  cardLabel: {
    fontWeight: 600,
    fontSize: "1.1rem",
  },
  cardDesc: {
    fontSize: "0.8rem",
    color: "#6b7280",
  },
};

export default Portal;
