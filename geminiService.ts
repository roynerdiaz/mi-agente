import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Guarda una sesión de lectura en Firestore
 */
export async function guardarSesionDB(sesion: any) {
  try {
    const docRef = await addDoc(collection(db, "lecturas"), {
      ...sesion,
      fecha: new Date().toISOString()
    });
    console.log("Sesión guardada con ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error al guardar sesión: ", e);
    throw e;
  }
}

/**
 * Obtiene el historial de lecturas desde Firestore
 */
export async function obtenerHistorialDB() {
  try {
    const q = query(collection(db, "lecturas"), orderBy("fecha", "desc"), limit(10));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (e) {
    console.error("Error al obtener historial: ", e);
    return [];
  }
}
