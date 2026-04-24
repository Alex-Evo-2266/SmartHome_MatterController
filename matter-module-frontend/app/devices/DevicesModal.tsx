"use client"

import { useSocket } from "@/lib/hooks/webSocket.hook"
import { BaseDialog, TextField } from "alex-evo-sh-ui-kit"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

// export const dynamic = "force-dynamic"

interface PairModalProps{
    onHide: ()=>void
}

export default function PairModal({onHide}:PairModalProps) {
    const [pairCode, setPairCode] = useState("")

    const { connectSocket, closeSocket, publish } = useSocket([])

    useEffect(() => {
        connectSocket()
        return () => closeSocket()
    }, [connectSocket, closeSocket])

    const pair = useCallback(() => {
        publish(JSON.stringify({
            type: "command",
            topic: "pair",
            message: { pairingCode: pairCode }
        }))
    }, [publish, pairCode])

    return (
        <BaseDialog
            header="pair device"
            onHide={onHide}
            onSuccess={pair}
        >
            <TextField
                placeholder="paircode"
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value)}
            />
        </BaseDialog>
    )
}