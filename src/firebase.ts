import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCEbUWhl_500iD--54dPY9sPNnUMMZHgbY",
  authDomain: "dorochatto.firebaseapp.com",
  databaseURL: "https://dorochatto-default-rtdb.firebaseio.com",
  projectId: "dorochatto",
  storageBucket: "dorochatto.firebasestorage.app",
  messagingSenderId: "785608369636",
  appId: "1:785608369636:web:2bab63974e0e84b50dd3f1"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);