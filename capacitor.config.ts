import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.todolist.app',
  appName: 'ToDoList',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  plugins: {
    CapacitorCookies: {
      enabled: true
    }
  }
};

export default config;
