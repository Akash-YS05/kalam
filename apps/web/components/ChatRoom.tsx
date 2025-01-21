import axios from 'axios'
import React from 'react'
import { BACKEND_URL } from '../app/config'
import ChatRoomClient from './ChatRoomCLient'

async function getChat(roomId: string) {
    const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`)
    return response.data.messages
}

export default async function ChatRoom({id} : {
    id: string
}) {
  const messages = await getChat(id);  
  return (
    <ChatRoomClient id={id} messages={messages}/>
  )
}
