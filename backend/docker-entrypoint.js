#!/usr/bin/env node
/**
 * Docker entrypoint: wait for Mongo → seed demo users → start server.
 */
const { spawn } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const SEED_ON_BOOT = process.env.SEED_ON_BOOT !== 'false';
const MAX_ATTEMPTS = 40;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForMongo = async () => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  console.log('⏳ Waiting for MongoDB...');
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(MONGODB_URI);
      await mongoose.disconnect();
      console.log('✅ MongoDB is ready');
      return;
    } catch (error) {
      console.log(`   attempt ${attempt}/${MAX_ATTEMPTS}: ${error.message}`);
      await sleep(2000);
    }
  }
  throw new Error('MongoDB not reachable after waiting');
};

const runSeed = async () => {
  if (!SEED_ON_BOOT) {
    console.log('ℹ️ SEED_ON_BOOT=false — skipping seed');
    return;
  }

  console.log('🌱 Seeding demo users...');
  const { run } = require(path.join(__dirname, 'database', 'seed'));
  await run();
  await mongoose.connection.close().catch(() => {});
};

const startServer = () => {
  console.log('🚀 Starting Alive Health UG...');
  const child = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env
  });

  const forward = (signal) => {
    if (child.pid) child.kill(signal);
  };

  process.on('SIGINT', () => forward('SIGINT'));
  process.on('SIGTERM', () => forward('SIGTERM'));

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code == null ? 1 : code);
  });
};

waitForMongo()
  .then(runSeed)
  .then(startServer)
  .catch((error) => {
    console.error('❌ Entrypoint failed:', error.message);
    process.exit(1);
  });
