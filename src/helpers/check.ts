import { ICommands } from "../matter/device/handlers/ICommands.js"



export function checkRecord(data: unknown): data is Record<string, unknown>{
    if(!data || typeof data !== 'object') return false
    return Object.keys(data).every(i=>typeof i === 'string')
}

export function checkValue(data: unknown): data is string | null | number | boolean | undefined{
    return ["string", "number", "boolean", "null",  "undefined"].includes(typeof data)
}

export function checkCommand(data: unknown): data is ICommands{
    if(!data || typeof data !== 'object')return false
    if(!("name" in data) || typeof data.name === 'string')return false
    if(!("action" in data) || typeof data.action === 'string')return false
    if(!("value" in data) || !checkValue(data.value))return false
    return true
}
