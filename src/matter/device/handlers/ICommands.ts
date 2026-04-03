// src/matter/device/handlers/ICommands.ts

export interface ICommands {
    name: string
    action: string
    value?: string | null | number | boolean
}