import { promises as fs } from "fs"
import yaml from "js-yaml"

const CONFIG_PATH = "/app/config/config/config.yml"

export class ControllerConfig{
    controllerTopik: string | null

    constructor(){
        this.controllerTopik = null

        this._reloadTopik()
    }

    async _reloadTopik(): Promise<void> {
        this.readConf().then(res=>{
            if(typeof(res) === 'object' && res && "mqtt" in res){
                if(typeof(res.mqtt) === 'object' && res.mqtt && "base_topic" in res.mqtt && typeof(res.mqtt.base_topic) === "string"){
                this.controllerTopik = res.mqtt.base_topic
                }
            }
            return null
        })
    }

    async readConf(): Promise<unknown> {
        const file = await fs.readFile(CONFIG_PATH, "utf8")
        const data = yaml.load(file)
        return data
    }

    async saveConf(data: object): Promise<void> {
        const yamlString = yaml.dump(data)
        await fs.writeFile(CONFIG_PATH, yamlString, "utf8")
        await this._reloadTopik()
    }

}

export const controllerConfig = new ControllerConfig()

