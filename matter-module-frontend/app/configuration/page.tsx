// app/modules/smarthome_zigbee_containers/configuration/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import YAML from "js-yaml"
import { PREFIX_API } from "@/lib/envVar"
import { useSocket } from "@/lib/hooks/webSocket.hook"

// Подгружаем CodeMirror динамически (без SSR)
const YamlEditor = dynamic(() => import("./yaml-editor"), { ssr: false, loading: () => <p>Загрузка редактора...</p> })

export default function ConfigurationPage() {
  const [yamlText, setYamlText] = useState("")
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")


  const {connectSocket, closeSocket, publish} = useSocket()

  useEffect(() => {
        console.log('MessageService connected')
        connectSocket();
        return () => closeSocket(); // закрывать при размонтировании
    }, [connectSocket, closeSocket]);

  useEffect(() => {
    fetch(`${PREFIX_API}/api/configurate`)
      .then(res => res.json())
      .then(data => {
        setYamlText(YAML.dump(data))
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    try {
      const parsed = YAML.load(yamlText)
      const res = await fetch(`${PREFIX_API}/api/configurate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })
      if (res.ok) setStatus("✅ Сохранено!")
      else setStatus("❌ Ошибка сохранения")
      publish(JSON.stringify({command: "restart"}))
    } catch (e) {
      console.error(e)
      setStatus("⚠️ Неверный YAML")
    }
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>Matter Configuration</h1>
      <div style={{ height: "70vh", border: "1px solid #ddd", marginBottom: 10, overflowY: "auto", background: "#282c34" }}>
        <YamlEditor value={yamlText} onChange={setYamlText} />
      </div>
      <button
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          height: "45px",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
        onClick={handleSave}
      >
        Сохранить
      </button>
      <span style={{ marginLeft: 10 }}>{status}</span>
    </div>
  )
}
