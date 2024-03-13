import React, {useState, useRef, useEffect} from "react";
import { addMessage, fetchMessages } from "../../api_calls/messageAPI";
import InputEmoji from 'react-input-emoji';


export default function ChatBox({sessionUserID, gameID, socketCurrent, token}) {
  const frostedGlass = ` bg-gradient-to-r from-gray-300/30 via-purple-100/20 to-purple-900/20 backdrop-blur-sm
  shadow-lg shadow-[#363b54] border-[3px] border-white/10 `

  // ======================= LOADING MESSAGES =============================================
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [receivedMessage, setReceivedMessage] = useState("");
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchMessages(gameID, token)
    .then(messagesData => {
        setMessages(messagesData.allMessages);
        setLoading(false);
    })
  }, [])

  // Scroll to the last message when messages change
  const messagesEndRef = useRef(null);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);
  
  // ======================= RECIEVING MESSAGES =============================================
  // useEffect(() => {
  //   socketCurrent.on("receive-message", ({gameID, receivedMessage}) => {
  //     console.log("received message from socket", receivedMessage);
  //     // const newMessage = {
  //     //     _id: receivedMessage._id,
  //     //     gameID: receivedMessage.gameID,
  //     //     author: receivedMessage.author,
  //     //     body: receivedMessage.body
  //     // }
  //     setMessages([...messages, receivedMessage])

  //     // setMessages((prevMessages) => prevMessages.concat(newMessage));
  //     // setMessages(currentMessages)
  // })
  // }, [sessionUserID])

  // ======================= RECIEVING MESSAGES =============================================
  // Change newMessage when something is written to InputEmoji 
  const handleChange=(newMessage)=>{
    setNewMessage(newMessage); // --> Don't need to use event.target because it is not a 'form'
}

// Sending a message to both the Backend API and socket.io 
const handleSend = async (event) => {

    const messageToSend = {
        gameID: gameID,
        author: sessionUserID,
        body: newMessage
    }

    console.log(messageToSend)

// Send the message to the database:
if (newMessage.trim()) { // check that there is a conversationPartner and that newMessage is not all whitespaces
    addMessage(messageToSend, token)
        .then(sentMessageData => {
            const sentMessage = sentMessageData.newMessage
            // add newMessage to the messages array:
            setMessages([...messages, sentMessage]);
            // send message to the socket server:
            // socketCurrent.emit("send-message", {gameID, sentMessage})
            // clear newMessage: -- check if this needs to be after
            setNewMessage("");
  })
}
}
  // =================================== JSX FOR UI ==============================================================
  return (
    <>
    {/* MESSAGES container */}
    <div className='flex flex-col h-[22%]'>
      <h3 className='text-3xl text-white font-extrabold ml-5 -translate-y-2'>
        Messages
      </h3>
      {/* MESSAGES BOX */}
      <div className="flex flex-col bg-gray-600/40 rounded-[1rem] h-full overflow-y-auto px-4 py-2 border-2 space-y-1 border-white/20">
        {/* MESSAGES */}
        {
          loading ? 
          (<div className="flex flex-col h-full overflow-auto px-1 ">
            <p className="text-yellow-400/80"
            >Loading...</p>
          </div>) : (
          <div className="flex flex-col h-full overflow-auto px-1 ">
            {messages?.length === 0 ? (
              <p className="text-white/80">Write a message...</p>
              ) : (
              messages?.map(message => (
              <p key={message._id} className={'' + (message.author._id === sessionUserID ? 'text-yellow-400/80' : '')}>
                <span className="font-bold">{message.author.username}:</span> {' '}{message.body}
              </p>
              ))
            )}
          {/* Empty div to scroll to the last message */}
          <div ref={messagesEndRef}></div>
          </div>

          )
        }
      
        {/* Input Field from React Lib for writing a new message, can add emojis */}
        <div className="flex flex-col h-2/5">
          <InputEmoji 
            value={newMessage? newMessage : ""}
            cleanOnEnter
            onChange={handleChange}
            onEnter={handleSend}
            placeholder='Type a message...'
          />
        </div>
      </div>
    </div>
    </>
  )
}
