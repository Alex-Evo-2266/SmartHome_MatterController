"use client"

import { useEffect, useRef } from "react"
import { EditorView, basicSetup } from "codemirror"
import { yaml } from "@codemirror/lang-yaml"
import { oneDark } from "@codemirror/theme-one-dark"

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function YamlEditor({ value, onChange }: Props) {
  const container = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!container.current) return

    const view = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        yaml(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
      ],
      parent: container.current,
    })

    viewRef.current = view
    return () => view.destroy()
  }, [])

  return <div ref={container} style={{ height: "100%", fontSize: 14 }} />
}
