/**
 * Web Worker for High-Performance Async Data Processing (20,000+ records)
 * Prevents Main-Thread UI Freezing during bulk operations, deduplication, and alert scanning.
 */

export interface WorkerInputMessage {
  type: 'PROCESS_BATCH';
  newItems: any[];
  existingIds: string[];
  adminEmails: string;
  isOnline: boolean;
}

export interface WorkerProgressMessage {
  type: 'PROGRESS';
  processedCount: number;
  totalCount: number;
  percent: number;
}

export interface WorkerCompleteMessage {
  type: 'COMPLETE';
  deduplicatedItems: any[];
  negativeEmailLogs: any[];
  duplicatesCount: number;
  totalProcessed: number;
}

self.onmessage = (event: MessageEvent<WorkerInputMessage>) => {
  const { type, newItems, existingIds, adminEmails, isOnline } = event.data;

  if (type === 'PROCESS_BATCH') {
    const existingIdSet = new Set(existingIds || []);
    const deduplicatedItems: any[] = [];
    const negativeEmailLogs: any[] = [];
    let duplicatesCount = 0;
    const totalCount = newItems.length;
    const adminEmailsList = (adminEmails || '').split(',').map(e => e.trim()).filter(Boolean);
    const nowStr = new Date().toISOString();

    const chunkSize = 2500; // Process in chunks of 2,500 items to send progress ticks
    let processedCount = 0;

    for (let i = 0; i < totalCount; i++) {
      const item = newItems[i];
      if (item && item.id && existingIdSet.has(item.id)) {
        duplicatesCount++;
      } else {
        if (item && item.id) {
          existingIdSet.add(item.id);
        }
        deduplicatedItems.push(item);

        // Check for negative feedback alert
        const staffSat = Number(item.staffSatisfaction) || 0;
        const receptionSat = Number(item.receptionSatisfaction) || 0;
        if ((staffSat > 0 && staffSat < 3) || (receptionSat > 0 && receptionSat < 3)) {
          adminEmailsList.forEach((email, emailIdx) => {
            negativeEmailLogs.push({
              id: `EML-WORKER-${Date.now()}-${i}-${emailIdx}`,
              surveyId: item.id,
              beneficiaryName: item.beneficiaryName || 'مستفيد',
              recipientEmail: email,
              subject: `⚠️ تنبيه فوري: تقييم سلبي من مستفيد (${item.beneficiaryName || 'مستفيد'})`,
              sentAt: nowStr,
              status: isOnline ? 'sent' : 'pending',
              triggerReason: `Batch Worker Alert (Staff: ${staffSat} / Reception: ${receptionSat})`
            });
          });
        }
      }

      processedCount++;

      // Send progress report every chunk or at completion
      if (processedCount % chunkSize === 0 || processedCount === totalCount) {
        const percent = Math.min(100, Math.round((processedCount / totalCount) * 100));
        self.postMessage({
          type: 'PROGRESS',
          processedCount,
          totalCount,
          percent
        } as WorkerProgressMessage);
      }
    }

    self.postMessage({
      type: 'COMPLETE',
      deduplicatedItems,
      negativeEmailLogs,
      duplicatesCount,
      totalProcessed: totalCount
    } as WorkerCompleteMessage);
  }
};
