import './Chatbot.css';
import {useEffect, useState, useRef } from 'react';
import { sendGemniMessage } from './ChatbotGemni';
import bobamascot from "../assets/bobamascot.png";

const BASE_URL = 'https://jsonplaceholder.typicode.com';


// chat bot function
const Chatbot = () => {

    // const [posts, setPosts] = useState([]);
    // const [isLoading, setLoading] = useState(false);
    // const [error, setError] = useState();
    const [userInput, setUserInput] = useState("");
    const [aiOutput, setaiOutput] = useState("");
    const [isVisible, setVisible] = useState(false);
    // const abortControllerRef = useRef(null);

    // useEffect(() => {
    //     const fetchPost = async () => {
    //         abortControllerRef.current?.abort();
    //         abortControllerRef.current = new AbortController();
    //         setLoading(true);
    //         try{
    //             const response = await fetch(`${BASE_URL}/posts`, {
    //                 signal: abortControllerRef.current?.signal
    //             });
    //             const data = await response.json();
    //             setPosts(data);
    //         }
    //         catch(e){
    //             if(e.name === 'AbortError'){
    //                 console.log('Aborted');
    //                 return;
    //             }
    //             setError(e);
    //         }
    //         finally{
    //             setLoading(false);
    //         }
    //     }

    //     fetchPost();
    // }, []); 

    // if(isLoading){
    //     return <div>Loading...</div>
    // }

    // if(error){
    //     return <div>iError in the database</div>
    // }
    
    async function handleSend(){
        const reply = await sendGemniMessage(userInput);
        setaiOutput(reply);
        console.log(aiOutput);
        setUserInput("");
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
                <button onClick ={toggleVisible} >X BUTTON</button>
                <h1>Hello</h1>
                <h1> YES {userInput} </h1>
                <h3>Response Ai: {aiOutput}</h3>
                <input 
                placehodler = "Hello there"
                type = 'text'
                value = {userInput}
                onChange ={(e) => setUserInput(e.target.value)}
                onKeyDown={handleEnter}
                ></input>
                <button onClick = {handleSend} >Submit</button>
                <button onClick ={toggleVisible} >X BUTTON</button>
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
