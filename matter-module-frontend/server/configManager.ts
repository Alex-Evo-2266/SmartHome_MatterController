import { promises as fs } from "fs"
import yaml from "js-yaml"
import path from "path"

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

    // async readConf(): Promise<unknown> {
    //     const file = await fs.readFile(CONFIG_PATH, "utf8")
    //     const data = yaml.load(file)
    //     return data
    // }

    async readConf(): Promise<unknown> {
        try {
            const file = await fs.readFile(CONFIG_PATH, "utf8");
            return yaml.load(file);
        } catch (err: unknown) {
            if (typeof err === "object" && err && "code" in err && err.code === "ENOENT") {
                // 🔹 создаём директории
                await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });

                // 🔹 дефолтный конфиг (можешь изменить)
                const defaultConfig = {
                    mqtt: {
                        url: "mqtt://localhost:1883",
                        baseTopik: "matter",
                        urlInDocker: "mqtt://mosquitto:1883",
                        user: "",
                        password: ""
                    },

                    matter:{
                        storagePath: "./matter-storage",
                        fabricLabel: "My Controller"
                    },

                    ble:{
                        enabled: true,
                        hciId: 0
                    },

                    wifi:{
                        ssid: "",
                        password: "",
                        networkInterface: "wlp1s0"
                    }
                };

                // 🔹 записываем файл
                await fs.writeFile(
                CONFIG_PATH,
                yaml.dump(defaultConfig),
                "utf8"
                );

                return defaultConfig;
            }

            throw err;
        }
    }

    async saveConf(data: object): Promise<void> {
        const yamlString = yaml.dump(data)
        await fs.writeFile(CONFIG_PATH, yamlString, "utf8")
        await this._reloadTopik()
    }

}

export const controllerConfig = new ControllerConfig()

