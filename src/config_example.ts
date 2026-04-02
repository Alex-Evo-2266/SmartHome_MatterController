
// config/config.ts
export const config = {
  mqtt: {
    url: "",
    baseTopik: "matter",
    user: "",
    password: ""
  },

  matter: {
    storagePath: "./matter-storage",
    fabricLabel: "My Controller",
  },

  ble: {
    enabled: true,
    hciId: 0,
  },

  wifi: {
    ssid: "",
    password: ""
  }
};