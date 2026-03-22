#!/usr/bin/env node

/**
 * Test R2 Storage & Redis Cache Staging
 * Verifica funzionalità storage e cache per ambiente staging
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Redis } from '@upstash/redis';
import 'dotenv/config';

// R2 Client
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Redis Client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function testR2() {
  console.log('📦 Testing R2 Storage...\n');
  
  const testKey = `test/staging-test-${Date.now()}.txt`;
  const testContent = 'Hello from RescueManager staging!';
  
  try {
    // Test 1: Upload
    console.log('Test 1: Upload file to R2');
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    }));
    console.log('✅ Upload successful\n');
    
    // Test 2: Download
    console.log('Test 2: Download file from R2');
    const response = await s3.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: testKey,
    }));
    const body = await response.Body.transformToString();
    
    if (body === testContent) {
      console.log('✅ Download successful, content matches\n');
    } else {
      throw new Error('Content mismatch!');
    }
    
    // Test 3: Delete
    console.log('Test 3: Delete file from R2');
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: testKey,
    }));
    console.log('✅ Delete successful\n');
    
    return true;
  } catch (error) {
    console.error('❌ R2 test failed:', error.message);
    return false;
  }
}

async function testRedis() {
  console.log('🔴 Testing Redis Cache...\n');
  
  const testKey = `test:staging:${Date.now()}`;
  
  try {
    // Test 1: SET/GET
    console.log('Test 1: SET and GET');
    await redis.set(testKey, { test: true, timestamp: Date.now() });
    const value = await redis.get(testKey);
    
    if (value && value.test === true) {
      console.log('✅ SET/GET successful\n');
    } else {
      throw new Error('Value mismatch!');
    }
    
    // Test 2: SETEX (with expiration)
    console.log('Test 2: SETEX with expiration');
    const expireKey = `${testKey}:expire`;
    await redis.setex(expireKey, 60, 'Expires in 60 seconds');
    const ttl = await redis.ttl(expireKey);
    
    if (ttl > 0 && ttl <= 60) {
      console.log(`✅ SETEX successful, TTL: ${ttl}s\n`);
    } else {
      throw new Error('TTL not set correctly!');
    }
    
    // Test 3: INCR (counter)
    console.log('Test 3: INCR counter');
    const counterKey = `${testKey}:counter`;
    await redis.incr(counterKey);
    await redis.incr(counterKey);
    const count = await redis.get(counterKey);
    
    if (count === 2) {
      console.log('✅ INCR successful, count: 2\n');
    } else {
      throw new Error('Counter value incorrect!');
    }
    
    // Test 4: Rate Limiting simulation
    console.log('Test 4: Rate limiting simulation');
    const rateLimitKey = `rate_limit:test:${Date.now()}`;
    await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, 60);
    const requests = await redis.get(rateLimitKey);
    
    if (requests === 1) {
      console.log('✅ Rate limiting successful\n');
    } else {
      throw new Error('Rate limit counter incorrect!');
    }
    
    // Cleanup
    console.log('Cleanup: Deleting test keys');
    await redis.del(testKey);
    await redis.del(expireKey);
    await redis.del(counterKey);
    await redis.del(rateLimitKey);
    console.log('✅ Cleanup successful\n');
    
    return true;
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    return false;
  }
}

async function testIntegration() {
  console.log('🔗 Testing Integration (Cache + Storage)...\n');
  
  try {
    const fileKey = `documents/test-${Date.now()}.json`;
    const cacheKey = `cache:document:${fileKey}`;
    const testData = {
      id: Date.now(),
      name: 'Test Document',
      content: 'Integration test content',
    };
    
    // 1. Upload to R2
    console.log('Step 1: Upload document to R2');
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
      Body: JSON.stringify(testData),
      ContentType: 'application/json',
    }));
    console.log('✅ Document uploaded\n');
    
    // 2. Cache metadata in Redis
    console.log('Step 2: Cache metadata in Redis');
    await redis.setex(cacheKey, 300, {
      key: fileKey,
      size: JSON.stringify(testData).length,
      uploadedAt: Date.now(),
    });
    console.log('✅ Metadata cached\n');
    
    // 3. Retrieve from cache
    console.log('Step 3: Retrieve from cache');
    const cached = await redis.get(cacheKey);
    
    if (cached && cached.key === fileKey) {
      console.log('✅ Cache hit successful\n');
    } else {
      throw new Error('Cache miss or data mismatch!');
    }
    
    // 4. Download from R2
    console.log('Step 4: Download from R2');
    const response = await s3.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    }));
    const body = await response.Body.transformToString();
    const downloaded = JSON.parse(body);
    
    if (downloaded.id === testData.id) {
      console.log('✅ Download and parse successful\n');
    } else {
      throw new Error('Downloaded data mismatch!');
    }
    
    // Cleanup
    console.log('Cleanup: Deleting test data');
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    }));
    await redis.del(cacheKey);
    console.log('✅ Cleanup successful\n');
    
    return true;
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════');
  console.log('STORAGE & CACHE STAGING TESTS');
  console.log('═══════════════════════════════════════\n');
  
  const results = {
    r2: false,
    redis: false,
    integration: false,
  };
  
  // Run tests
  results.r2 = await testR2();
  results.redis = await testRedis();
  results.integration = await testIntegration();
  
  // Summary
  console.log('═══════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`R2 Storage:     ${results.r2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Redis Cache:    ${results.redis ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Integration:    ${results.integration ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.r2 && results.redis && results.integration;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Storage & Cache staging ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check configuration.');
    process.exit(1);
  }
}

// Run all tests
runAllTests().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
