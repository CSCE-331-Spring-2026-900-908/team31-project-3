import { Link } from "react-router-dom";
import bobamascot from "../assets/relaxing-rainbow.gif";
import { useEffect, useState } from "react";
const views = [
  { label: "Menu Board", path: "/menu-board", desc: "Non-interactive display" },
  { label: "Customer", path: "/customer", desc: "Self-service kiosk" },
  { label: "Cashier", path: "/login?role=cashier", desc: "Point-of-sale system" },
  { label: "Manager", path: "/manager", desc: "Point-of-sale system" },
];

 

const Portal = () => {

   const [showImages, setShowImages] = useState(true);

  useEffect(() => {
    function handleResize() {
      setShowImages(window.innerWidth > 1300);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);


return(
  <>
    {showImages && (
        <>
          <img style={styles.imgleft} src={bobamascot}/>
          <img style={styles.imgright} src={bobamascot}/>
        </>
      )}
   
    <div style={styles.container}>
    <h1 style={styles.heading}>Project 3 Portal</h1>
    <div style={styles.grid}>
      {views.map(({ label, path, desc }) => (
        <Link key={path} to={path} style={styles.card}>
          <span style={styles.cardLabel}>{label}</span>
          <span style={styles.cardDesc}>{desc}</span>
        </Link>
      ))}
    </div>
   
  </div>
  </>
  );
    };

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    // background: "#b5ebf1",
    background: "#DAF9EF",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 300px)",
    gridTemplateRows: "repeat(2, 300px)",
    gap: "16px",
    

    

  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    aspectRatio: "1 / 1",
    // background: "#fff",
    background: "#86C99D",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    textDecoration: "none",
    // color: "#171b16",
    boxShadow: "15px 15px 15px rgba(0,0,0,0.12)",
    transition: "box-shadow 0.2s ease",

    color: "#3d5f38",
    transition: "box-shadow 0.15s",
  

  },
  cardLabel: {
    fontWeight: 600,
    fontSize: "1.4rem",
  },
  cardDesc: {
    fontSize: "1.0rem",
    color: "#0B7374",
  },

  heading:{
    fontWeight: 600,
    fontSize: "2 rem",
    color: "#3d5f38",
    
  },
  imgright:{
    width: "300px",
    position:"absolute",
    height:"100%",
    left:"0%"
  },
  imgleft:{
    width: "300px",
    position:"absolute",
    height:"100%",
    right:"0%"
  }
};


export default Portal;
