"use client"

import { useSocket } from "@/lib/hooks/webSocket.hook"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from 'alex-evo-sh-ui-kit'
import PairModal from "./DevicesModal"

export default function Page(){ 
    
    const [message, setMessage] = useState<Record<string, unknown>>({})
    const [pairModal, setPairModal] = useState<boolean>(false)

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
            {
                pairModal?
                <PairModal onHide={()=>setPairModal(false)}/>:
                <Button onClick={()=>setPairModal(true)}>pair</Button>
            }
            </div>
            <table>

            </table>
        </div>
    )
}