import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { registerSW } from 'virtual:pwa-register';
import App from './App.vue';
import router from './router';
import { useSessionStore } from './stores/session';
import './style.css';

registerSW({ immediate: true });

const app = createApp(App);
app.use(createPinia());
app.use(VueQueryPlugin);

const session = useSessionStore();
await session.init();

app.use(router);
app.mount('#app');
