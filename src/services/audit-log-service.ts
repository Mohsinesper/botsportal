
// src/services/audit-log-service.ts
'use server'; // For potential use in server actions directly or called from them

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import type { AuditLogEntry, User } from '@/types'; // Ensure User type is available if needed

interface LoggableEventDetails {
  action: string;
  userId: string;
  userName: string;
  details?: Record<string, any> | string;
  ipAddress?: string;
  location?: string;
  callCenterId?: string;
  callCenterName?: string;
}

export async function addAuditLog(eventData: LoggableEventDetails): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'auditLogs'), {
      ...eventData,
      timestamp: Timestamp.now(), // Use Firestore Timestamp
    });
    console.log('Audit log added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding audit log: ', error);
    return null;
  }
}

interface FetchAuditLogsParams {
    searchTerm?: string;
    filterUserId?: string | "all";
    filterActionTerm?: string;
    filterCallCenterIdAudit?: string | "all";
    // Date range filtering would be more complex with Firestore queries and typically done with start/end timestamps
}

export async function getAuditLogs(params?: FetchAuditLogsParams): Promise<AuditLogEntry[]> {
  try {
    let q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100)); // Get latest 100

    // Basic filtering examples (more complex filtering can be added)
    if (params?.filterUserId && params.filterUserId !== "all") {
        q = query(q, where("userId", "==", params.filterUserId));
    }
    if (params?.filterCallCenterIdAudit && params.filterCallCenterIdAudit !== "all") {
        q = query(q, where("callCenterId", "==", params.filterCallCenterIdAudit));
    }
    // Note: Firestore text search on 'action' or 'details' is not straightforward without third-party tools like Algolia/Elasticsearch
    // or by creating composite fields. For 'filterActionTerm' or 'searchTerm', client-side filtering might be used after fetching a broader set,
    // or more specific query fields would be needed.

    const querySnapshot = await getDocs(q);
    const logs: AuditLogEntry[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        timestamp: (data.timestamp as Timestamp).toDate().toISOString(), // Convert Firestore Timestamp to ISO string
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        details: data.details,
        ipAddress: data.ipAddress,
        location: data.location,
        callCenterId: data.callCenterId,
        callCenterName: data.callCenterName,
      });
    });
    return logs;
  } catch (error) {
    console.error('Error fetching audit logs: ', error);
    return [];
  }
}
