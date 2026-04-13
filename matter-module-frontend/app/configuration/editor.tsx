import { PREFIX_API } from "@/lib/envVar"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import YAML from "js-yaml"

const YamlEditor = dynamic(() => import("./yaml-editor"), { ssr: false, loading: () => <p>Загрузка редактора...</p> })

export const Editor = ({publish}:{publish: (data: string)=>void}) => {

    const [yamlText, setYamlText] = useState("")
    // const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState("")

    useEffect(() => {
        fetch(`${PREFIX_API}/api/configurate`)
        .then(res => res.json())
        .then(data => {
            setYamlText(YAML.dump(data))
            // setLoading(false)
        })
        .catch(err => {
            console.error(err)
            // setLoading(false)
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
        publish(JSON.stringify({type: "command", data: "restart"}))
        } catch (e) {
        console.error(e)
        setStatus("⚠️ Неверный YAML")
        }
    }

    return(
        <>
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
        </>
    )
}