import { useState, useEffect } from "react";
import "./MenuBoard.css";
import API_BASE_URL from "../config/apiBaseUrl";

const TAG_ICON_MAP = {
  Vegan: { icon: "🌱", label: "Vegan", kind: "dietary" },
  Dairy: { icon: "🥛", label: "Dairy", kind: "allergen" },
  Nuts: { icon: "🥜", label: "Nuts", kind: "allergen" },
  Gluten: { icon: "🌾", label: "Gluten", kind: "allergen" },
  Egg: { icon: "🥚", label: "Egg", kind: "allergen" },
  Soy: { icon: "🫘", label: "Soy", kind: "allergen" },
};

const LEGEND_ORDER = ["Vegan", "Dairy", "Nuts", "Gluten", "Egg", "Soy"];

const MenuBoard = () => {
  const [products, setProducts] = useState([]);
  const [productModifiers, setProductModifiers] = useState([]);
  const [bestSellersNames, setBestSellersNames] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const normalizeTags = (tags) => {
    if (Array.isArray(tags)) return tags.filter(Boolean);
    return [];
  };

  const getIndicatorItems = (product) => {
    const rawTags = [...normalizeTags(product.dietary_tags), ...normalizeTags(product.allergen_tags)];
    return rawTags
      .filter((tag) => TAG_ICON_MAP[tag])
      .map((tag) => ({
        tag,
        ...TAG_ICON_MAP[tag],
      }));
  };

  const dedupeProducts = (categoryProducts) => {
    const deduped = new Map();

    categoryProducts.forEach((product) => {
      const key = `${String(product.name || "").trim().toLowerCase()}|${Number(product.base_price).toFixed(2)}|${String(product.category_name || "").trim().toLowerCase()}`;
      const existing = deduped.get(key);

      if (!existing) {
        deduped.set(key, {
          ...product,
          dietary_tags: normalizeTags(product.dietary_tags),
          allergen_tags: normalizeTags(product.allergen_tags),
        });
        return;
      }

      const dietary = new Set([...normalizeTags(existing.dietary_tags), ...normalizeTags(product.dietary_tags)]);
      const allergen = new Set([...normalizeTags(existing.allergen_tags), ...normalizeTags(product.allergen_tags)]);

      existing.dietary_tags = [...dietary];
      existing.allergen_tags = [...allergen];
    });

    return Array.from(deduped.values());
  };

  const fetchData = () => {
    fetch(`${API_BASE_URL}/product`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetch(`${API_BASE_URL}/productmodifier`)
      .then((r) => r.json())
      .then((data) => setProductModifiers(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetch(`${API_BASE_URL}/reports?report=Top%205%20Products&range=month`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.rows) {
          setBestSellersNames(data.rows.map((row) => row["Product Name"]).filter(Boolean));
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
    // Poll for updates every 60 seconds to keep the menu board live
    const dataInterval = setInterval(fetchData, 60000);
    // Update clock every second
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(clockInterval);
    };
  }, []);

  // Dynamically extract categories from products
  const categories = [...new Set(products.map((p) => p.category_name))].filter(Boolean).sort();
  const allDedupedProducts = dedupeProducts(products);

  const toppingItems = productModifiers.filter((modifier) =>
    String(modifier.category || "").toLowerCase().includes("topping")
  );

  const menuSections = categories.map((category) => {
    const dedupedCategoryProducts = allDedupedProducts.filter((p) => p.category_name === category);

    return {
      key: category,
      title: category,
      items: dedupedCategoryProducts,
    };
  });

  const bestSellerProducts = bestSellersNames
    .map((name) => allDedupedProducts.find((p) => p.name === name))
    .filter(Boolean);

  const bestSellerSection =
    bestSellerProducts.length > 0
      ? [{ key: "best-sellers", title: "Best Sellers ⭐", items: bestSellerProducts }]
      : [];

  const displaySections = [...bestSellerSection, ...menuSections];

  const toppingSections =
    toppingItems.length > 0
      ? [{ key: "toppings", title: "Toppings", items: toppingItems }]
      : [];

  return (
    <div className="menu-board-fullscreen">
      <div className="menu-header">
        <h1 className="menu-title">Menu</h1>
        <div className="menu-header-right">
          <div className="menu-clock">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="menu-legend" aria-label="Dietary and allergen icon legend">
            {LEGEND_ORDER.map((tag) => {
              const item = TAG_ICON_MAP[tag];
              return (
                <div key={tag} className="legend-item" title={item.label}>
                  <span className="indicator-icon">{item.icon}</span>
                  <span className="legend-label">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="menu-masonry">
        {displaySections.map((section) => (
          <div key={section.key} className="menu-column">
            <h2>{section.title}</h2>
            <table>
              <tbody>
                {section.items.map((product) => (
                  <tr key={`${product.product_id || product.name}-${Number(product.base_price).toFixed(2)}`}>
                    <td className="label">
                      <span className="item-name">{product.name}</span>
                      <span className="inline-indicators">
                        {getIndicatorItems(product).map((item) => (
                          <span
                            key={`${product.product_id || product.name}-indicator-${item.tag}`}
                            className="inline-emoji"
                            title={item.label}
                            aria-label={item.label}
                          >
                            {item.icon}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="price">${product.base_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {toppingSections.map((section) => (
          <div key={section.key} className="menu-column toppings-column">
            <h2>{section.title}</h2>
            <table>
              <tbody>
                {section.items.map((topping, idx) => (
                  <tr key={topping.option_id || topping.id || topping.name || idx}>
                    <td className="label">
                      <span className="item-name">{topping.name}</span>
                      <span className="inline-indicators">
                        {getIndicatorItems(topping).map((item) => (
                          <span
                            key={`${topping.option_id || topping.name}-indicator-${item.tag}`}
                            className="inline-emoji"
                            title={item.label}
                            aria-label={item.label}
                          >
                            {item.icon}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="price">${topping.price_adjustment.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuBoard;
