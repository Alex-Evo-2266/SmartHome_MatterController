// app/modules/smarthome_zigbee_containers/configuration/page.tsx
"use client"

import { useEffect } from "react"
import { useSocket } from "@/lib/hooks/webSocket.hook"
import { Editor } from "./editor";


export default function ConfigurationPage() {

  const {connectSocket, closeSocket, publish} = useSocket()

  useEffect(() => {
        console.log('MessageService connected')
        connectSocket();
        return () => closeSocket(); // закрывать при размонтировании
    }, [connectSocket, closeSocket]);


  return (
    <div style={{ padding: 20 }}>
      <h1>Matter Configuration</h1>
      <Editor publish={publish}/>
    </div>
  )
}
