"use client"

import { useSocket } from "@/lib/hooks/webSocket.hook"
import { useCallback, useEffect, useMemo, useState } from "react"
import {Button, TextField} from 'alex-evo-sh-ui-kit'

export default function Page(){ 
    
    const [message, setMessage] = useState<Record<string, unknown>>({})

    const setMqttMessage = useCallback((data: string) => {
        const parseData = JSON.parse(data)
        setMessage(parseData)
    },[])

    const colbacks = useMemo(()=>[
            {messageType: "message_service", callback: setMqttMessage},
    ],[setMqttMessage])

    const {connectSocket, closeSocket} = useSocket(colbacks)

    useEffect(() => {
          console.log('MessageService connected')
          connectSocket();
          return () => closeSocket(); // закрывать при размонтировании
      }, [connectSocket, closeSocket]);
  
    console.log(message)
    return (
        <div>
            <div>
                <TextField border placeholder="parscode"/>
                <Button>pair</Button>
            </div>
            <table>

            </table>
        </div>
    )
}