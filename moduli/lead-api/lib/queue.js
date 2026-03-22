/**
 * Upstash Redis Queue
 * Gestione code per invio email e job asincroni
 */

const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Aggiunge email alla coda di invio
 * @param {object} emailData - Dati email (to, subject, html, attachments)
 * @returns {Promise<string>} Job ID
 */
async function queueEmail(emailData) {
  const jobId = `email:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  
  await redis.lpush('queue:emails', JSON.stringify({
    id: jobId,
    data: emailData,
    createdAt: new Date().toISOString(),
    attempts: 0,
  }));

  return jobId;
}

/**
 * Processa prossima email dalla coda
 * @returns {Promise<object|null>} Email job o null se coda vuota
 */
async function dequeueEmail() {
  const job = await redis.rpop('queue:emails');
  if (!job) return null;
  
  return JSON.parse(job);
}

/**
 * Aggiunge job generico alla coda
 * @param {string} queueName - Nome coda
 * @param {object} jobData - Dati job
 * @returns {Promise<string>} Job ID
 */
async function queueJob(queueName, jobData) {
  const jobId = `${queueName}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  
  await redis.lpush(`queue:${queueName}`, JSON.stringify({
    id: jobId,
    data: jobData,
    createdAt: new Date().toISOString(),
    attempts: 0,
  }));

  return jobId;
}

/**
 * Processa prossimo job dalla coda
 * @param {string} queueName - Nome coda
 * @returns {Promise<object|null>} Job o null
 */
async function dequeueJob(queueName) {
  const job = await redis.rpop(`queue:${queueName}`);
  if (!job) return null;
  
  return JSON.parse(job);
}

/**
 * Ottiene lunghezza coda
 * @param {string} queueName - Nome coda
 * @returns {Promise<number>} Numero job in coda
 */
async function getQueueLength(queueName) {
  return await redis.llen(`queue:${queueName}`);
}

/**
 * Cache semplice con TTL
 * @param {string} key - Chiave cache
 * @param {any} value - Valore da cachare
 * @param {number} ttl - TTL in secondi (default 1 ora)
 */
async function setCache(key, value, ttl = 3600) {
  await redis.set(key, JSON.stringify(value), { ex: ttl });
}

/**
 * Legge dalla cache
 * @param {string} key - Chiave cache
 * @returns {Promise<any|null>} Valore o null
 */
async function getCache(key) {
  const value = await redis.get(key);
  if (!value) return null;
  
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Rate limiting con Redis
 * @param {string} identifier - Identificatore (es. IP, user ID)
 * @param {number} limit - Numero max richieste
 * @param {number} window - Finestra temporale in secondi
 * @returns {Promise<boolean>} true se permesso, false se rate limited
 */
async function checkRateLimit(identifier, limit = 10, window = 60) {
  const key = `ratelimit:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window);
  }
  
  return current <= limit;
}

module.exports = {
  redis,
  queueEmail,
  dequeueEmail,
  queueJob,
  dequeueJob,
  getQueueLength,
  setCache,
  getCache,
  checkRateLimit,
};
