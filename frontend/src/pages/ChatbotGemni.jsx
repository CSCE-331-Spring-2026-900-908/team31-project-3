import API_BASE_URL from "../config/apiBaseUrl";

export async function sendGemniMessage(message){
    const response = await fetch(`${API_BASE_URL}/gemniAi/chat`, {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
    });

    const data = await response.json();
    
    if(!response.ok){
        throw new Error(data.error ||  "Request from backend failed");
        
    }

    
    return data.text;

 }
// export async function sendGemniMessage(message) {
//     const response = await fetch(`${API_BASE_URL}/gemniAi/chat`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ message }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//         throw new Error(data.error || "Request from backend failed");
//     }

//     return data.text;
// }