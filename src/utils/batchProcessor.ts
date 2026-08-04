/**
 * High-Performance Async Batch Processor & Web Worker Manager
 * Engineered to process 20,000+ items without UI freeze (60 FPS maintained)
 */

import { SurveyResponse, EmailLog } from '../types';

export interface BatchProcessingOptions {
  newItems: SurveyResponse[];
  existingSurveys: SurveyResponse[];
  adminEmails: string;
  isOnline: boolean;
  onProgress?: (percent: number, processedCount: number, totalCount: number) => void;
}

export interface BatchProcessingResult {
  deduplicatedItems: SurveyResponse[];
  negativeEmailLogs: EmailLog[];
  duplicatesCount: number;
  totalProcessed: number;
}

/**
 * Process a massive array of surveys using Web Worker or Chunked Micro-Tasks
 */
export async function processSurveysInBatchAsync(
  options: BatchProcessingOptions
): Promise<BatchProcessingResult> {
  const { newItems, existingSurveys, adminEmails, isOnline, onProgress } = options;

  if (!newItems || newItems.length === 0) {
    return {
      deduplicatedItems: [],
      negativeEmailLogs: [],
      duplicatesCount: 0,
      totalProcessed: 0,
    };
  }

  // Attempt Web Worker Execution
  try {
    return await executeInWebWorker(options);
  } catch (workerErr) {
    console.warn('Web Worker execution unavailable or restricted, switching to Chunked Async Micro-Tasks:', workerErr);
    return await executeInAsyncChunks(options);
  }
}

/**
 * Web Worker Executor
 */
function executeInWebWorker(options: BatchProcessingOptions): Promise<BatchProcessingResult> {
  return new Promise((resolve, reject) => {
    const { newItems, existingSurveys, adminEmails, isOnline, onProgress } = options;
    const existingIds = existingSurveys.map(s => s.id);

    // Create Inline Worker Blob to avoid cross-origin / URL bundle issues
    const workerCode = `
      self.onmessage = function(e) {
        var data = e.data;
        var newItems = data.newItems || [];
        var existingIds = new Set(data.existingIds || []);
        var adminEmailsList = (data.adminEmails || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
        var isOnline = data.isOnline;
        var nowStr = new Date().toISOString();

        var deduplicatedItems = [];
        var negativeEmailLogs = [];
        var duplicatesCount = 0;
        var totalCount = newItems.length;
        var chunkSize = 1500;

        for (var i = 0; i < totalCount; i++) {
          var item = newItems[i];
          if (item && item.id && existingIds.has(item.id)) {
            duplicatesCount++;
          } else {
            if (item && item.id) {
              existingIds.add(item.id);
            }
            deduplicatedItems.push(item);

            var staffSat = Number(item.staffSatisfaction) || 0;
            var receptionSat = Number(item.receptionSatisfaction) || 0;
            if ((staffSat > 0 && staffSat < 3) || (receptionSat > 0 && receptionSat < 3)) {
              for (var k = 0; k < adminEmailsList.length; k++) {
                negativeEmailLogs.push({
                  id: 'EML-WORKER-' + Date.now() + '-' + i + '-' + k,
                  surveyId: item.id,
                  beneficiaryName: item.beneficiaryName || 'مستفيد',
                  recipientEmail: adminEmailsList[k],
                  subject: '⚠️ تنبيه فوري: تقييم سلبي من مستفيد (' + (item.beneficiaryName || 'مستفيد') + ')',
                  sentAt: nowStr,
                  status: isOnline ? 'sent' : 'pending',
                  triggerReason: 'Batch Worker Alert'
                });
              }
            }
          }

          if ((i + 1) % chunkSize === 0 || (i + 1) === totalCount) {
            self.postMessage({
              type: 'PROGRESS',
              processedCount: i + 1,
              totalCount: totalCount,
              percent: Math.min(100, Math.round(((i + 1) / totalCount) * 100))
            });
          }
        }

        self.postMessage({
          type: 'COMPLETE',
          deduplicatedItems: deduplicatedItems,
          negativeEmailLogs: negativeEmailLogs,
          duplicatesCount: duplicatesCount,
          totalProcessed: totalCount
        });
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'PROGRESS') {
        if (onProgress) {
          onProgress(msg.percent, msg.processedCount, msg.totalCount);
        }
      } else if (msg.type === 'COMPLETE') {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        resolve({
          deduplicatedItems: msg.deduplicatedItems,
          negativeEmailLogs: msg.negativeEmailLogs,
          duplicatesCount: msg.duplicatesCount,
          totalProcessed: msg.totalProcessed,
        });
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(err);
    };

    worker.postMessage({
      newItems,
      existingIds,
      adminEmails,
      isOnline,
    });
  });
}

/**
 * Fallback: Asynchronous Micro-Chunking Batch Processor (uses setTimeout / requestAnimationFrame)
 * Yields event loop control back to browser every 1,500 items so UI thread never freezes.
 */
function executeInAsyncChunks(options: BatchProcessingOptions): Promise<BatchProcessingResult> {
  return new Promise((resolve) => {
    const { newItems, existingSurveys, adminEmails, isOnline, onProgress } = options;
    const existingIdSet = new Set(existingSurveys.map(s => s.id));
    const deduplicatedItems: SurveyResponse[] = [];
    const negativeEmailLogs: EmailLog[] = [];
    let duplicatesCount = 0;
    const totalCount = newItems.length;
    const adminEmailsList = adminEmails.split(',').map(e => e.trim()).filter(Boolean);
    const nowStr = new Date().toISOString();

    const chunkSize = 1500;
    let currentIndex = 0;

    function processChunk() {
      const end = Math.min(currentIndex + chunkSize, totalCount);

      for (let i = currentIndex; i < end; i++) {
        const item = newItems[i];
        if (item && item.id && existingIdSet.has(item.id)) {
          duplicatesCount++;
        } else {
          if (item && item.id) {
            existingIdSet.add(item.id);
          }
          deduplicatedItems.push(item);

          const staffSat = Number(item.staffSatisfaction) || 0;
          const receptionSat = Number(item.receptionSatisfaction) || 0;
          if ((staffSat > 0 && staffSat < 3) || (receptionSat > 0 && receptionSat < 3)) {
            adminEmailsList.forEach((email, emailIdx) => {
              negativeEmailLogs.push({
                id: `EML-CHUNK-${Date.now()}-${i}-${emailIdx}`,
                surveyId: item.id,
                beneficiaryName: item.beneficiaryName || 'مستفيد',
                recipientEmail: email,
                subject: `⚠️ تنبيه فوري: تقييم سلبي من مستفيد (${item.beneficiaryName || 'مستفيد'})`,
                sentAt: nowStr,
                status: isOnline ? 'sent' : 'pending',
                triggerReason: `Batch Chunk Alert`
              });
            });
          }
        }
      }

      currentIndex = end;
      const percent = Math.min(100, Math.round((currentIndex / totalCount) * 100));

      if (onProgress) {
        onProgress(percent, currentIndex, totalCount);
      }

      if (currentIndex < totalCount) {
        // Yield control to UI thread
        setTimeout(processChunk, 0);
      } else {
        resolve({
          deduplicatedItems,
          negativeEmailLogs,
          duplicatesCount,
          totalProcessed: totalCount,
        });
      }
    }

    processChunk();
  });
}
