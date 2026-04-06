// const express = require("express");
// const { GoogleGenAI } = require("@google/genai");
// const pool = require("../../server/db");

// const airouter = express.Router();


// const ai = new GoogleGenAI({
//     apiKey: process.env.GEMINI_KEY,
// });

// airouter.post("/chat", async (req, res) => {
//     const {message} = req.body;
//     const chatbotRules = `
//             You are a assistant for a boba resturant be polite to the customer.
//             Rules:
//             - Do not use more than 200 words.
//             - Do not write Python code.
//             - Only recommend, explain, or suggest things in plain English.
//             - If the user asks for code, politely refuse and give a non-code recommendation instead.
//             - Keep answers concise and helpful.
//             `;
//     try{    
//         console.log("route hit");
//         console.log("user message:", message);
//         console.log("hello");

//     const result = await pool.query(`
//       SELECT name, base_price, description, category_name
//       FROM product 
//       LIMIT 50

//         `);
//         console.log("hello again");

//     console.log(result.rows.slice(0, 3));

//     const menuText = result.rows
//       .map(
//         (item) =>      
//          `${item.name} - ${item.category_name} - $${item.base_price} - ${item.description || "No description available"}`
//       )
//       .join("\n");
//         const response = await ai.models.generateContent({
//             model: "gemini-2.5-flash",
//             contents: `${chatbotRules}\n\n Menu:${menuText} Customer Request: ${message}`,
//         });
//         console.log("gemini call worked");
//         console.log(response);
//         res.json({text: response.text});
          
//     }
//     catch(e){
//         console.error("FULL BACKEND ERROR:");
//         console.error(e);
//         res.status(500).json({error: "Gemni failed"});
//     }

// });

// module.exports = airouter;
const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const pool = require("../../server/db");

const airouter = express.Router();

const geminiKey = process.env.GEMINI_KEY || "";
const ai = geminiKey
    ? new GoogleGenAI({
        apiKey: geminiKey,
    })
    : null;

airouter.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!ai) {
        return res.status(503).json({
            error: "Gemini is not configured on this server. Set GEMINI_KEY in Vercel environment variables.",
        });
    }

    const chatbotRules = `
You are an assistant for a boba restaurant. Be polite to the customer.

Rules:
- Do not use more than 200 words.
- Do not write Python code.
- Only recommend, explain, or suggest things in plain English.
- If the user asks for code, politely refuse and give a non-code recommendation instead.
- Keep answers concise and helpful.
- Only recommend items from the menu below.
- Do not invent menu items, prices, or descriptions.
`;

    try {
        console.log("route hit");
        console.log("message:", message);
        console.log("has GEMINI_KEY:", !!process.env.GEMINI_KEY);

        const result = await pool.query(`
            SELECT name, base_price, description, category_name
            FROM product
            WHERE is_active = true
            LIMIT 50
        `);

        console.log("db query worked");
        console.log(result.rows.slice(0, 3));

        const menuText = result.rows
            .map(
                (item) =>
                    `${item.name} - ${item.category_name} - $${item.base_price} - ${item.description || "No description available"}`
            )
            .join("\n");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `${chatbotRules}

Menu:
${menuText}

Customer Request:
${message}`,
        });

        console.log("gemini call worked");
        console.log("response text:", response.text);

        res.json({ text: response.text });
    } catch (e) {
        console.error("BACKEND ERROR:", e);
        res.status(500).json({
            error: e.message || "Gemini failed",
        });
    }
});

module.exports = airouter;