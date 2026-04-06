export async function sendGemniMessage(message){
    const response = await fetch("http://localhost:3001/gemniAi/chat", {
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
//     const response = await fetch("http://localhost:3001/gemniAi/chat", {
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