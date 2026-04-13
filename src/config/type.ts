// config/types.ts
export interface Config {
  mqtt: {
    url: string;
    baseTopik: string;
    user: string;
    password: string;
  };

  matter: {
    storagePath?: string;
    fabricLabel: string;
  };

  ble: {
    enabled: boolean;
    hciId: number;
  };

  wifi: {
    ssid: string;
    password: string;
    networkInterface: string
  };
}