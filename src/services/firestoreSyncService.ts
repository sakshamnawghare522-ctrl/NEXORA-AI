import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase.ts';
import { MonitoredCompetitor, CompetitorsStore } from './competitorsStore.ts';
import { RadarAlert, RadarService } from './radarService.ts';

let competitorsUnsub: Unsubscribe | null = null;
let alertsUnsub: Unsubscribe | null = null;

export class FirestoreSyncService {
  /**
   * Initializes real-time Firestore synchronization for the authenticated user
   */
  static initRealtimeSync(userId: string, onUpdate?: () => void): () => void {
    // Unsubscribe any previous listeners
    this.stopRealtimeSync();

    if (!userId) return () => {};

    const competitorsPath = `users/${userId}/competitors`;
    const alertsPath = `users/${userId}/radarAlerts`;

    try {
      // 1. Real-time Competitors Listener
      const competitorsRef = collection(db, 'users', userId, 'competitors');
      competitorsUnsub = onSnapshot(
        competitorsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreCompetitors: MonitoredCompetitor[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as MonitoredCompetitor;
              firestoreCompetitors.push(data);
            });

            // Merge with local store
            firestoreCompetitors.forEach((comp) => {
              CompetitorsStore.addCompetitorTarget(comp);
            });

            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('nexora-competitors-updated'));
            }
            onUpdate?.();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, competitorsPath);
        }
      );

      // 2. Real-time Radar Alerts Listener
      const alertsRef = collection(db, 'users', userId, 'radarAlerts');
      alertsUnsub = onSnapshot(
        alertsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as RadarAlert;
              RadarService.addRadarAlert(data);
            });

            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('nexora-radar-alert-new'));
            }
            onUpdate?.();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, alertsPath);
        }
      );
    } catch (err) {
      console.warn('[FirestoreSync] Failed to attach realtime listener', err);
    }

    return () => this.stopRealtimeSync();
  }

  static stopRealtimeSync(): void {
    if (competitorsUnsub) {
      competitorsUnsub();
      competitorsUnsub = null;
    }
    if (alertsUnsub) {
      alertsUnsub();
      alertsUnsub = null;
    }
  }

  /**
   * Save a competitor document in Firestore for the current user
   */
  static async saveCompetitor(competitor: MonitoredCompetitor): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const path = `users/${user.uid}/competitors/${competitor.id}`;
    try {
      const compRef = doc(db, 'users', user.uid, 'competitors', competitor.id);
      await setDoc(
        compRef,
        {
          ...competitor,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Save a radar alert document in Firestore for the current user
   */
  static async saveAlert(alert: RadarAlert): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const path = `users/${user.uid}/radarAlerts/${alert.id}`;
    try {
      const alertRef = doc(db, 'users', user.uid, 'radarAlerts', alert.id);
      await setDoc(
        alertRef,
        {
          ...alert,
          userId: user.uid,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Delete a competitor document in Firestore
   */
  static async removeCompetitor(competitorId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const path = `users/${user.uid}/competitors/${competitorId}`;
    try {
      const compRef = doc(db, 'users', user.uid, 'competitors', competitorId);
      await deleteDoc(compRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}
