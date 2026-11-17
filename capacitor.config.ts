import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.todolist.app',
  appName: 'ToDoList',
  webDir: 'dist',
  server: {
    url: 'https://app.todolists.workers.dev',
    allowNavigation: ['app.todolists.workers.dev'],
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  plugins: {
    CapacitorCookies: {
      enabled: true
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true
    },
    CapacitorUpdater: {
      autoUpdate: false,
      resetWhenUpdate: false
    }
  }
};

export default config;
