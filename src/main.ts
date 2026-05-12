import './style.css';
import { startApp } from './app';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('App root element was not found.');
}

startApp(root);
