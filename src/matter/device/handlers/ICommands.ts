// src/matter/device/handlers/ICommands.ts

export interface ICommands {
    attribute: string
    action: string
    value?: string | null | number | boolean | object
}