// src/matter/device/handlers/ICommands.ts

export interface ICommands {
    type: string
    action: string
    value?: string | null | number | boolean
}