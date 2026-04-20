"use client"

import { useSocket } from "@/lib/hooks/webSocket.hook"
import { BaseDialog, Button, TextField } from "alex-evo-sh-ui-kit"
import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react"

export default function Page() {
    const [pairCode, setPairCode] = useState("")
    const router = useRouter()

    const {connectSocket, closeSocket, publish} = useSocket([])

    const pair = useCallback(()=> {
        publish(JSON.stringify({
            type: "command",
            topic: "pair",
            message: {pairingCode: pairCode}
        }))
    },[publish, pairCode])
    
    useEffect(() => {
              console.log('MessageService connected')
              connectSocket();
              return () => closeSocket(); // закрывать при размонтировании
          }, [connectSocket, closeSocket]);

    return (
        <BaseDialog header="pair device" onHide={()=>router.back()} onSuccess={pair}>
            <TextField placeholder="paircode" onChange={setPairCode} value={pairCode}/>
        </BaseDialog>
    )
}