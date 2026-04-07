-- Populate Database with Gong Cha Menu and Inventory

TRUNCATE TABLE OrderModifier, OrderDetail, "order", ProductModifier, ProductIngredient, ModifierOption, Product, Inventory, Employee RESTART IDENTITY CASCADE;

INSERT INTO Employee (name, role, pin_hash) VALUES 
('Vivian', 'Manager', 'hash123'),
('Noah', 'Cashier', 'hash456'),
('Abel', 'Cashier', 'hash789'),
('Nitheesh', 'Cashier', 'hash1011'),
('Long', 'Cashier', 'hash1213'),
('Sanjit', 'Cashier', 'hash1415');
--I EDITED THIS TO HAVE A VALUE CALLED TARGET_VAL NEEDED FOR INVETORY MENU (ABEL)
INSERT INTO Inventory (item_name, quantity, unit_type, expiration_date, target_val) VALUES 
('Black Tea Leaves', 500.0, 'grams', NOW() + INTERVAL '1 year',0),
('Green Tea Leaves', 500.0, 'grams', NOW() + INTERVAL '1 year',0),
('Earl Grey Tea Leaves', 500.0, 'grams', NOW() + INTERVAL '1 year',0),
('Oolong Tea Leaves', 500.0, 'grams', NOW() + INTERVAL '1 year',0),
('Wintermelon Syrup', 200.0, 'liters', NOW() + INTERVAL '6 months',0),
('Milk', 100.0, 'gallons', NOW() + INTERVAL '1 week',0),
('Non-Dairy Creamer', 50.0, 'kg', NOW() + INTERVAL '6 months',0),
('Almond Milk', 20.0, 'gallons', NOW() + INTERVAL '2 weeks',0),
('Oat Milk', 20.0, 'gallons', NOW() + INTERVAL '2 weeks',0),
('Soy Milk', 20.0, 'gallons', NOW() + INTERVAL '2 weeks',0),
('Brown Sugar Syrup', 50.0, 'liters', NOW() + INTERVAL '6 months',0),
('Wintermelon Syrup', 200.0, 'liters', NOW() + INTERVAL '6 months',0),
('Honey', 20.0, 'liters', NOW() + INTERVAL '1 year',0),
('Lemon Juice', 30.0, 'liters', NOW() + INTERVAL '1 month',0),
('Strawberry Jam', 20.0, 'kg', NOW() + INTERVAL '3 months',0),
('Mango Puree', 20.0, 'kg', NOW() + INTERVAL '3 months',0),
('Passionfruit Jam', 20.0, 'kg', NOW() + INTERVAL '3 months',0),
('Lychee Syrup', 20.0, 'liters', NOW() + INTERVAL '6 months',0),
('Hibiscus Syrup', 20.0, 'liters', NOW() + INTERVAL '6 months',0),
('Peach Syrup', 20.0, 'liters', NOW() + INTERVAL '6 months',0),
('Ginger Syrup', 10.0, 'liters', NOW() + INTERVAL '6 months',0), 
('Tapioca Pearls', 100.0, 'kg', NOW() + INTERVAL '2 days',0),
('White Pearls', 50.0, 'kg', NOW() + INTERVAL '5 days',0),
('Pudding', 30.0, 'kg', NOW() + INTERVAL '5 days',0),
('Herbal Jelly', 30.0, 'kg', NOW() + INTERVAL '5 days',0),
('Coconut Jelly', 30.0, 'kg', NOW() + INTERVAL '30 days',0),
('Basil Seeds', 10.0, 'kg', NOW() + INTERVAL '1 year',0),
('Ai-Yu Jelly', 20.0, 'kg', NOW() + INTERVAL '5 days',0),
('Oreo Crumbs', 20.0, 'kg', NOW() + INTERVAL '3 months',0),
('Milk Foam Powder', 50.0, 'kg', NOW() + INTERVAL '1 year',0),
('Red Bean', 20.0, 'kg', NOW() + INTERVAL '10 days',0), 
('Coffee Beans', 50.0, 'kg', NOW() + INTERVAL '3 months',0),
('Taro Powder', 40.0, 'kg', NOW() + INTERVAL '1 year',0),
('Matcha Powder', 30.0, 'kg', NOW() + INTERVAL '1 year',0),
('Chocolate Powder', 30.0, 'kg', NOW() + INTERVAL '1 year',0),
('Ice', 1000.0, 'kg', NOW() + INTERVAL '1 day',0),
('Sugar', 500.0, 'kg', NOW() + INTERVAL '1 year',0),
('Cane Sugar Syrup', 100.0, 'liters', NOW() + INTERVAL '1 year',0);

-- Milk Foam Series
INSERT INTO Product (name, base_price, category_name, can_be_served_hot, description, color_code, is_active, image_url) VALUES
('Milk Foam Green Tea', 5.75, 'Milk Foam Series', TRUE, 'Jasmine green tea topped with signature milk foam.', '#E6E6FA', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E5%A5%B6%E8%93%8B%E7%B6%A0%E8%8C%B6-Milk-Foam-Green-Tea-web.png'),
('Milk Foam Black Tea', 5.75, 'Milk Foam Series', TRUE, 'Rich black tea topped with signature milk foam.', '#E6E6FA', TRUE, 'https://gongchausa.com/wp-content/uploads/2022/01/Milk-Foam-Black-Tea.png'),
('Milk Foam Earl Grey Tea', 5.75, 'Milk Foam Series', TRUE, 'Citrusy Earl Grey tea topped with signature milk foam.', '#E6E6FA', TRUE, 'https://gongchausa.com/wp-content/uploads/2022/01/Milk-Foam-Earl-Grey-Tea.png'),
('Milk Foam Wintermelon', 5.75, 'Milk Foam Series', TRUE, 'Caffeine-free wintermelon drink with salty-sweet foam.', '#E6E6FA', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E5%A5%B6%E8%93%8B%E5%86%AC%E7%93%9C-Milk-Foam-Wintermelon-web.png'),
('Creme Brulee Brown Sugar Milk Tea', 7.00, 'Milk Foam Series', TRUE, 'Milk tea with brown sugar pearls and torched creme brulee foam.', '#E6E6FA', TRUE, 'https://gongchausa.com/wp-content/uploads/2022/01/Creme-Brulee-Brown-Sugar-Milk-Tea.png');

-- Milk Tea Series
INSERT INTO Product (name, base_price, category_name, can_be_served_hot, description, color_code, is_active, image_url) VALUES
('Pearl Milk Tea', 5.70, 'Milk Tea Series', TRUE, 'The classic. Black milk tea with tapioca pearls included.', '#F5DEB3', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E7%8F%8D%E7%8F%A0%E5%A5%B6%E8%8C%B6-Pearl-Milk-Tea-web.png'),
('Black Milk Tea', 4.90, 'Milk Tea Series', TRUE, 'Smooth and creamy black tea.', '#F5DEB3', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E5%A5%B6%E8%8C%B6-Milk-Tea-web.png'),
('Taro Milk Tea', 5.70, 'Milk Tea Series', TRUE, 'Creamy purple taro root drink.', '#F5DEB3', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E8%8A%8B%E9%A0%AD%E7%89%B9%E8%AA%BF-Taro-Milk-Drink-w.png'),
('Earl Grey Milk Tea w/ 3J', 6.50, 'Milk Tea Series', TRUE, 'Earl Grey milk tea with Pearls, Pudding, and Herbal Jelly.', '#F5DEB3', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E5%A5%B6%E8%8C%B6-Milk-Tea-web.png'),
('Brown Sugar Milk Tea', 5.40, 'Milk Tea Series', TRUE, 'Milk tea sweetened with rich brown sugar syrup.', '#F5DEB3', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E9%BB%91%E7%B3%96%E5%A5%B6%E8%8C%B6-Brown-Sugar-Milk-Tea-web.png'),
('Strawberry Milk Tea', 5.70, 'Milk Tea Series', TRUE, 'Sweet strawberry jam blended with milk tea.', '#F5DEB3', TRUE, 'https://gongchausa.com/wp-content/uploads/2022/01/Strawberry-Milk-Tea.png'),
('Oolong Milk Tea', 4.90, 'Milk Tea Series', TRUE, 'Roasted oolong tea with milk.', '#F5DEB3', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E5%A5%B6%E8%8C%B6-Milk-Tea-web.png');

-- Creative Mix Series
INSERT INTO Product (name, base_price, category_name, can_be_served_hot, description, color_code, is_active, image_url) VALUES
('Mango Green Tea', 5.40, 'Creative Mix Series', FALSE, 'Jasmine green tea with mango puree.', '#FFB6C1', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E8%8D%89%E8%8E%93%E7%B6%A0%E8%8C%B6-Strawberry-Green-Tea-w.png'),
('Passionfruit Green Tea', 5.40, 'Creative Mix Series', FALSE, 'Tart passionfruit jam with green tea and seeds.', '#FFB6C1', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E8%8D%89%E8%8E%93%E7%B6%A0%E8%8C%B6-Strawberry-Green-Tea-w.png'),
('Lemon Wintermelon w/ Basil Seeds', 5.95, 'Creative Mix Series', FALSE, 'Sweet wintermelon, tart lemon, and crunchy basil seeds.', '#FFB6C1', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E6%AA%B8%E6%AA%AC%E5%86%AC%E7%93%9C%E5%B0%8F%E7%B4%AB%E8%98%87-Lemon-Wintermelon-with-Basil-Seeds-w.png'),
('Lychee Oolong Tea', 5.40, 'Creative Mix Series', FALSE, 'Roasted oolong tea with sweet lychee syrup.', '#FFB6C1', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E8%8D%94%E6%9E%9D%E7%83%8F%E9%BE%8D-Lychee-Oolong-Tea-w.png'),
('Hibiscus Green Tea', 5.40, 'Creative Mix Series', FALSE, 'Tart ruby-red hibiscus flower tea.', '#FFB6C1', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E6%B4%9B%E7%A5%9E%E7%B6%A0%E8%8C%B6-Hibiscus-Green-Tea-w.png'),
('Lemon Ai-Yu w/ White Pearl', 5.95, 'Creative Mix Series', FALSE, 'Lemon green tea with Ai-Yu jelly and crystal boba.', '#FFB6C1', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E5%AF%92%E5%A4%A9%E6%84%9B%E7%8E%89-Lemon-Ai-Yu-with-White-Pearl-w.png');

-- Brewed Tea Series
INSERT INTO Product (name, base_price, category_name, can_be_served_hot, description, color_code, is_active, image_url) VALUES
('Jasmine Green Tea', 4.50, 'Brewed Tea Series', TRUE, 'Pure jasmine green tea.', '#90EE90', TRUE, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpRJxBkx9zpO92ypmnHAaDSUJLtj_rhzX7wA&s'),
('Black Tea', 4.50, 'Brewed Tea Series', TRUE, 'Classic brewed black tea.', '#90EE90', TRUE, 'https://gongcha.co.nz/images/website_thumbnail/1/a36f0449b02b834e02d62ad78728e615.jpg'),
('Oolong Tea', 4.50, 'Brewed Tea Series', TRUE, 'Roasted oolong tea.', '#90EE90', TRUE, 'https://tb-static.uber.com/prod/image-proc/processed_images/daf2bb901ccd09dc6e0c14d5c0d5fab2/5954bcb006b10dbfd0bc160f6370faf3.jpeg'),
('Earl Grey Tea', 4.50, 'Brewed Tea Series', TRUE, 'Citrusy earl grey tea.', '#90EE90', TRUE, 'https://gong-cha.ca/wp-content/uploads/2020/06/Taiwan-Earl-Grey-Tea.png.webp');

-- Coffee Series
INSERT INTO Product (name, base_price, category_name, can_be_served_hot, description, color_code, is_active, image_url) VALUES
('Milk Foam Black Coffee', 5.95, 'Coffee Series', TRUE, 'Iced black coffee topped with milk foam.', '#D2691E', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E5%A5%B6%E8%93%8B%E9%BB%91%E5%92%96%E5%95%A1-Milk-Foam-Black-Coffee-w.png'),
('Coffee Milk Tea', 5.40, 'Coffee Series', TRUE, 'A blend of black coffee and milk tea.', '#D2691E', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E9%B4%9B%E9%B4%A6%E5%A5%B6%E8%8C%B6-Coffe-Milk-Tea-w.png');

-- Slush Series
INSERT INTO Product (name, base_price, category_name, can_be_served_hot, description, color_code, is_active, image_url) VALUES
('Taro Slush', 6.25, 'Slush Series', FALSE, 'Iced blended taro drink.', '#ADD8E6', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/Taro-Slush-web.png'),
('Matcha Milk Slush', 6.75, 'Slush Series', FALSE, 'Japanese matcha powder blended with ice and milk.', '#ADD8E6', TRUE, 'https://gongchausa.com/wp-content/uploads/2021/12/%E6%8A%B9%E8%8C%B6%E9%AE%AE%E5%A5%B6%E5%86%B0%E6%B2%99-Matcha-Milk-Slush-web.png'),
('Peach Slush', 6.75, 'Slush Series', FALSE, 'Sweet peach syrup blended with ice.', '#ADD8E6', TRUE, 'https://gongchausa.com/wp-content/uploads/2022/07/Peach-Slush.png');


-- Toppings
INSERT INTO ModifierOption (name, category, price_adjustment, inventory_item_id, image_url)
VALUES 
('Pearl (Boba)', 'Topping', 0.50, (SELECT item_id FROM Inventory WHERE item_name = 'Tapioca Pearls'), 'https://gongchausa.com/wp-content/uploads/2021/12/%E7%8F%8D%E7%8F%A0-Pearl-w.png'),
('White Pearl (Crystal)', 'Topping', 0.75, (SELECT item_id FROM Inventory WHERE item_name = 'White Pearls'), 'https://gongchausa.com/wp-content/uploads/2021/12/%E7%99%BD%E6%99%B6%E7%90%83-Kanten-Jelly-White-Pearl-w.png'),
('Milk Foam', 'Topping', 0.75, (SELECT item_id FROM Inventory WHERE item_name = 'Milk Foam Powder'), 'https://gongchausa.com/wp-content/uploads/2021/12/%E8%8D%89%E8%8E%93%E5%A5%B6%E8%93%8BStrawberry-Milk-Foam-w.png'),
('Pudding', 'Topping', 0.50, (SELECT item_id FROM Inventory WHERE item_name = 'Pudding'), 'https://gongchausa.com/wp-content/uploads/2021/12/%E5%B8%83%E4%B8%81%E5%87%8D-Pudding-Jelly-w.png'),
('Herbal Jelly', 'Topping', 0.50, (SELECT item_id FROM Inventory WHERE item_name = 'Herbal Jelly'), 'https://gongchausa.com/wp-content/uploads/2021/12/%E4%BB%99%E8%8D%89%E5%87%8D-Grass-Jelly-Herbal-Jelly-w.png'),
('Coconut Jelly', 'Topping', 0.50, (SELECT item_id FROM Inventory WHERE item_name = 'Coconut Jelly'), 'https://gongchausa.com/wp-content/uploads/2021/12/%E6%A4%B0%E6%9E%9C-Coconut-Jelly-w.png'),
('Basil Seeds', 'Topping', 0.50, (SELECT item_id FROM Inventory WHERE item_name = 'Basil Seeds'), 'https://gongchausa.com/wp-content/uploads/2021/12/%E5%B0%8F%E7%B4%AB%E8%98%87-Basil-Seeds-w.png'),
('Ai-Yu Jelly', 'Topping', 0.50, (SELECT item_id FROM Inventory WHERE item_name = 'Ai-Yu Jelly'), 'https://gongchausa.com/wp-content/uploads/2021/12/%E6%84%9B%E7%8E%89-Ai-Yu-Jelly-w.png'),
('Oreo Crumbs', 'Topping', 0.50, (SELECT item_id FROM Inventory WHERE item_name = 'Oreo Crumbs'), 'https://gongchausa.com/wp-content/uploads/2021/12/Oreo-w.png');

-- Sugar Levels
INSERT INTO ModifierOption (name, category, price_adjustment, is_default, inventory_item_id)
VALUES 
('100% Sugar', 'Sugar Level', 0.0, TRUE, (SELECT item_id FROM Inventory WHERE item_name = 'Cane Sugar Syrup')),
('70% Sugar', 'Sugar Level', 0.0, FALSE, (SELECT item_id FROM Inventory WHERE item_name = 'Cane Sugar Syrup')),
('50% Sugar', 'Sugar Level', 0.0, FALSE, (SELECT item_id FROM Inventory WHERE item_name = 'Cane Sugar Syrup')),
('30% Sugar', 'Sugar Level', 0.0, FALSE, (SELECT item_id FROM Inventory WHERE item_name = 'Cane Sugar Syrup')),
('0% Sugar', 'Sugar Level', 0.0, FALSE, NULL);

-- Ice Levels
INSERT INTO ModifierOption (name, category, price_adjustment, is_default)
VALUES 
('Regular Ice', 'Ice Level', 0.0, TRUE),
('Less Ice', 'Ice Level', 0.0, FALSE),
('No Ice', 'Ice Level', 0.0, FALSE),
('Extra Ice', 'Ice Level', 0.0, FALSE);

-- Cup Sizes
INSERT INTO ModifierOption (name, category, price_adjustment, is_default)
VALUES 
('Medium', 'Size', 0.0, TRUE),
('Large', 'Size', 0.75, FALSE);

-- Milk Options
INSERT INTO ModifierOption (name, category, price_adjustment, is_default, inventory_item_id)
VALUES 
('Whole Milk', 'Milk Type', 0.0, TRUE, (SELECT item_id FROM Inventory WHERE item_name = 'Milk')),
('Almond Milk', 'Milk Type', 0.50, FALSE, (SELECT item_id FROM Inventory WHERE item_name = 'Almond Milk')),
('Oat Milk', 'Milk Type', 0.50, FALSE, (SELECT item_id FROM Inventory WHERE item_name = 'Oat Milk')),
('Soy Milk', 'Milk Type', 0.50, FALSE, (SELECT item_id FROM Inventory WHERE item_name = 'Soy Milk'));


-- General Modifiers apply to ALL products
INSERT INTO ProductModifier (product_id, option_id)
SELECT p.product_id, m.option_id
FROM Product p
CROSS JOIN ModifierOption m
WHERE m.category IN ('Sugar Level', 'Ice Level', 'Topping', 'Size');

-- Milk Type Modifiers 
INSERT INTO ProductModifier (product_id, option_id)
SELECT p.product_id, m.option_id
FROM Product p
CROSS JOIN ModifierOption m
WHERE m.category = 'Milk Type'
  AND (
      p.category_name = 'Milk Tea Series' 
      OR p.category_name = 'Slush Series' 
      OR p.name LIKE '%Milk Tea%' 
      OR p.name LIKE '%Latte%'
  );