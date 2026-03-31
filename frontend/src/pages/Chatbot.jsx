import './Chatbot.css';
import {useEffect, useState, useRef } from 'react';
import { sendGemniMessage } from './ChatbotGemni';

const BASE_URL = 'https://jsonplaceholder.typicode.com';


// chat bot function
const Chatbot = () => {

    const [posts, setPosts] = useState([]);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState();
    const [userInput, setUserInput] = useState();
    const [aiOutput, setaiOutput] = useState();

    const abortControllerRef = useRef(null);

    useEffect(() => {
        const fetchPost = async () => {
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();
            setLoading(true);
            try{
                const response = await fetch(`${BASE_URL}/posts`, {
                    signal: abortControllerRef.current?.signal
                });
                const data = await response.json();
                setPosts(data);
            }
            catch(e){
                if(e.name === 'AbortError'){
                    console.log('Aborted');
                    return;
                }
                setError(e);
            }
            finally{
                setLoading(false);
            }
        }

        fetchPost();
    }, []); 

    if(isLoading){
        return <div>Loading...</div>
    }

    if(error){
        return <div>iError in the database</div>
    }
    
    function handleSend(){
        aiOutput = sendGemniMessage(userInput);
        setUserInput("");
    }

    function handleEnter(e){
        if(e.key === "Enter"){
            handleSend();
        }
    }


  return (
    <div className="Chatbot-Wrapper">
      <h1>Hello</h1>
      <h1> YES {userInput} </h1>
        <div>
            <input 
            placehodler = "Hello there"
            type = 'text'
            value = {userInput}
            onChange ={(e) => setUserInput(e.target.value)}
            onKeyDown={handleEnter}
            ></input>
            <button onClick = {handleSend} >Submit</button>
        </div>
        <h1>Response Ai: {aiOutput}</h1>
        <ul>
            {posts.map((post) => {
                return <li key ={post.id}>{post.title}</li>
            })}
        </ul>
      
    </div>
  )
}

export default Chatbot
