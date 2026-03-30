const PROD_API_URL = "https://api-team31-project3.vercel.app";
const DEV_API_URL = "http://localhost:3001";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API_URL : DEV_API_URL);

export default API_BASE_URL;
