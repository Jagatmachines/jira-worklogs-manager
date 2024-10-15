import firebase_app from "../config/firebase";
import { getFirestore } from "firebase/firestore";

const db = getFirestore(firebase_app)


export default db;