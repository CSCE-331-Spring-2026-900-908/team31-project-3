import './Chatbot.css';
import {useEffect, useState, useRef } from 'react';
import { sendGemniMessage } from './ChatbotGemni';
import bobamascot from "../assets/bobamascot.png";
import sendIcon from "../assets/sendIcon.png";
import cancelIcon from "../assets/cancelIcon.png";

const BASE_URL = 'https://jsonplaceholder.typicode.com';


// chat bot function
const Chatbot = () => {

    const [userPosts, setUserPosts] = useState([]);
    const [aiPosts, setAiPosts] = useState([]);
    // const [isLoading, setLoading] = useState(false);
    // const [error, setError] = useState();
    const [userInput, setUserInput] = useState("");
    const [aiOutput, setaiOutput] = useState("");
    const [isVisible, setVisible] = useState(false);
    // const abortControllerRef = useRef(null);
    const combinedMessages = [];

    for (let i = 0; i < userPosts.length; i++) {
        combinedMessages.push({ sender: "user", text: userPosts[i] });

        if (aiPosts[i] !== undefined) {
            combinedMessages.push({ sender: "ai", text: aiPosts[i] });
            }
    }
    async function handleSend(){
        if (!userInput.trim()) return;
        const currentMessage = userInput;
        try{
        const reply = await sendGemniMessage(userInput);
        setUserPosts((prev) => [...prev, userInput]);
        setaiOutput(reply);
        setAiPosts((prev) => [...prev,reply]);
        console.log(reply);
        setUserInput("");
        }
        catch(error){
        if (error.message.includes("429") || error.message.includes("quota")) {
        setaiOutput("The chatbot is temporarily busy because the Gemini API quota was exceeded. Please wait a bit and try again.");
        }
        }
        
    }

    function handleEnter(e){
        if(e.key === "Enter"){
            handleSend();
        }
    }

    function toggleVisible(){
        if(isVisible === true)
            setVisible(false);
        else{
            setVisible(true);
        }
    }

  return (
    <div className = "root-of-chatbot">
      <div>
            {isVisible &&
            <div className="Chatbot-Wrapper">

                <div>
                    <button onClick ={toggleVisible} className = "Xbutton"><img src ={cancelIcon} ></img></button>
                    <h1>Talk to Boju!</h1>
                    <hr></hr>
                </div>

                <div>
                    <ul>    
                        {/* {userPosts.map((post) => {
                            return (<><li className='userMessage' key = {post}><span>{post}</span><img src={bobamascot}></img> </li></>)
                        })}
                        {aiPosts.map((post) => {
                            return (<><li className='aiMessage' key = {post}><img src={bobamascot}></img><span>{post}</span> </li></>)
                        })} */}
                       {combinedMessages.map((msg, index) => (
                        <li 
                            key={index}
                            className={msg.sender === "user" ? "userMessage" : "aiMessage"}
                            >
                            {msg.sender === "user" ? (
                                <>
                                <span>{msg.text}</span>
                                <img src={bobamascot} alt="boba mascot" />
                                </>
                            ) : (
                                <>
                                <img src={bobamascot} alt="boba mascot" />
                                <span>{msg.text}</span>
                                </>
                            )}
                        </li>
                    ))}
                    </ul>
                </div>

                <div className='inputHandling'>
                    <input 
                        placehodler = "Hello there"
                        type = 'text'
                        value = {userInput}
                        onChange ={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleEnter}
                        ></input>
                        <button className='sendIcon' onClick = {handleSend} ><img src= {sendIcon} className='sendIconimg' ></img></button>
                </div>

            </div>
            }
            {!isVisible &&
            <div className = "masscot-icon">
                <button onClick = {toggleVisible}>
                    <img src ={bobamascot}></img>
                </button>
            </div>
            }
      </div>
        
        

        {/* <ul>
            {posts.map((post) => {
                return <li key ={post.id}>{post.title}</li>
            })}
        </ul> */}
      
    </div>
  )
}

export default Chatbot
