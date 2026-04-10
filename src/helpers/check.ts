import { ICommands } from "../matter/device/handlers/ICommands.js"



export function checkRecord(data: unknown): data is Record<string, unknown>{
    if(!data || typeof data !== 'object') return false
    return Object.keys(data).every(i=>typeof i === 'string')
}

export function checkValue(data: unknown): data is string | null | number | boolean | undefined | {hue: number, saturation: number}{
    return ["string", "number", "boolean", "null",  "undefined"].includes(typeof data) || checkColor(data)
}

export function checkCommand(data: unknown): data is ICommands{
    if(!data || typeof data !== 'object')return false
    if(!("name" in data) || typeof data.name === 'string')return false
    if(!("action" in data) || typeof data.action === 'string')return false
    if(!("value" in data) || !checkValue(data.value))return false
    return true
}

export function checkColor(data: unknown): data is {hue: number, saturation: number}{
    if(!data || typeof data !== 'object')return false
    if(!("hue" in data) || typeof data.hue !== 'number')return false
    if(!("saturation" in data) || typeof data.saturation !== 'number')return false
    return true
}
