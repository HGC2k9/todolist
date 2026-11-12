import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.todolist.app',
  appName: 'ToDoList',
  webDir: 'dist',
  server: {
    url: 'https://app.todolists.workers.dev/',
    cleartext: true
  }
};

export default config;