// app/modules/smarthome_zigbee_containers/configuration/route.ts
import { controllerConfig } from "@/lib/configManager"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const data = await controllerConfig.readConf()
    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as {message: string}).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    await controllerConfig.saveConf(body)
    return NextResponse.json({ status: "ok" })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as {message: string}).message }, { status: 500 })
  }
}
