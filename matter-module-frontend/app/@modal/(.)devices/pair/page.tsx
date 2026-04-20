"use client"

import { useSocket } from "@/lib/hooks/webSocket.hook"
import { BaseDialog, TextField } from "alex-evo-sh-ui-kit"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

export const dynamic = "force-dynamic"

export default function Page() {
    const [mounted, setMounted] = useState(false)
    const [pairCode, setPairCode] = useState("")
    const router = useRouter()

    const { connectSocket, closeSocket, publish } = useSocket([])

    useEffect(() => {
        setMounted(true)
        connectSocket()
        return () => closeSocket()
    }, [connectSocket, closeSocket])

    if (!mounted) return null // 🔥 фикс

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
            onHide={() => router.back()}
            onSuccess={pair}
        >
            <TextField
                placeholder="paircode"
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value)} // ⚠️ фикс
            />
        </BaseDialog>
    )
}