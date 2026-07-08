/**
 * Firestore seed script — uses Firebase Admin SDK (bypasses security rules).
 *
 * Setup:
 *   1. Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save the downloaded JSON as scripts/serviceAccountKey.json
 *   3. Run: node scripts/seed.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = resolve(__dirname, 'serviceAccountKey.json');

if (!existsSync(keyPath)) {
  console.error('ERROR: scripts/serviceAccountKey.json not found.');
  console.error('Download it from: Firebase Console → Project Settings → Service Accounts → Generate new private key');
  process.exit(1);
}

const admin = require('firebase-admin');
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://trackback-bd810-default-rtdb.firebaseio.com',
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ── Users ─────────────────────────────────────────────────────────────────────

const users = [
  {
    uid: 'user_alice_001',
    displayName: 'Alice Rahman',
    email: 'alice@example.com',
    photoURL: 'https://i.pravatar.cc/150?u=alice',
    fcmToken: '',
  },
  {
    uid: 'user_bob_002',
    displayName: 'Bob Hasan',
    email: 'bob@example.com',
    photoURL: 'https://i.pravatar.cc/150?u=bob',
    fcmToken: '',
  },
];

// ── Items ─────────────────────────────────────────────────────────────────────

const items = [
  {
    type: 'lost',
    title: 'Black leather wallet',
    description: 'Lost my black bifold wallet near Gulshan 2 circle. Has my NID and cards inside.',
    category: 'Wallet',
    location: 'Gulshan 2, Dhaka',
    images: [],
    keywords: ['black', 'leather', 'wallet', 'bifold', 'nid', 'cards', 'gulshan'],
    status: 'active',
    userId: 'user_alice_001',
    userName: 'Alice Rahman',
    userPhoto: 'https://i.pravatar.cc/150?u=alice',
  },
  {
    type: 'found',
    title: 'Found a wallet near Gulshan',
    description: 'Found a black wallet on the footpath near Gulshan 2. Contains some cards.',
    category: 'Wallet',
    location: 'Gulshan 2, Dhaka',
    images: [],
    keywords: ['black', 'wallet', 'gulshan', 'cards', 'footpath'],
    status: 'active',
    userId: 'user_bob_002',
    userName: 'Bob Hasan',
    userPhoto: 'https://i.pravatar.cc/150?u=bob',
  },
  {
    type: 'lost',
    title: 'iPhone 14 Pro — Space Black',
    description: 'Lost my iPhone 14 Pro in a CNG near Banani. Has a cracked screen protector.',
    category: 'Phone',
    location: 'Banani, Dhaka',
    images: [],
    keywords: ['iphone', '14', 'pro', 'space', 'black', 'cracked', 'cng', 'banani'],
    status: 'active',
    userId: 'user_alice_001',
    userName: 'Alice Rahman',
    userPhoto: 'https://i.pravatar.cc/150?u=alice',
  },
  {
    type: 'found',
    title: 'Found keys with a red keychain',
    description: 'Found a set of keys with a red star keychain near Dhanmondi lake.',
    category: 'Keys',
    location: 'Dhanmondi, Dhaka',
    images: [],
    keywords: ['keys', 'red', 'keychain', 'star', 'dhanmondi', 'lake'],
    status: 'active',
    userId: 'user_bob_002',
    userName: 'Bob Hasan',
    userPhoto: 'https://i.pravatar.cc/150?u=bob',
  },
];

// ── Seed functions ─────────────────────────────────────────────────────────────

async function seedUsers() {
  console.log('\nSeeding users...');
  for (const user of users) {
    await db.collection('users').doc(user.uid).set({
      ...user,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`  ✓ ${user.displayName} (${user.uid})`);
  }
}

async function seedItems() {
  console.log('\nSeeding items...');
  const itemIds = [];
  for (const item of items) {
    const ref = await db.collection('items').add({
      ...item,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    itemIds.push(ref.id);
    console.log(`  ✓ [${item.type}] "${item.title}" (${ref.id})`);
  }
  return itemIds;
}

async function seedConversation(itemId) {
  console.log('\nSeeding conversation + messages...');
  const convRef = await db.collection('conversations').add({
    participants: ['user_alice_001', 'user_bob_002'],
    itemId,
    lastMessage: 'Can you describe it further?',
    lastMessageAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`  ✓ conversation (${convRef.id})`);

  const messages = [
    { text: 'Hi, I think you found my wallet!', senderId: 'user_alice_001', read: true },
    { text: 'Hey! Yes, I have it. Can you describe it?', senderId: 'user_bob_002', read: true },
    { text: 'It is black bifold with an NID card inside.', senderId: 'user_alice_001', read: false },
  ];

  for (const msg of messages) {
    await convRef.collection('messages').add({
      ...msg,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  ✓ ${messages.length} messages added`);
  return convRef.id;
}

async function seedNotifications(itemId) {
  console.log('\nSeeding notifications...');
  const notifications = [
    {
      userId: 'user_alice_001',
      type: 'match',
      title: 'Possible match found!',
      body: 'Someone reported finding a wallet near Gulshan — it might be yours.',
      itemId,
      read: false,
    },
    {
      userId: 'user_alice_001',
      type: 'message',
      title: 'New message from Bob Hasan',
      body: 'Hey! Yes, I have it. Can you describe it?',
      itemId,
      read: false,
    },
  ];

  for (const notif of notifications) {
    const ref = await db.collection('notifications').add({
      ...notif,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`  ✓ [${notif.type}] ${notif.title} (${ref.id})`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to Firestore (trackback-bd810)...');
  try {
    await seedUsers();
    const itemIds = await seedItems();
    await seedConversation(itemIds[0]);
    await seedNotifications(itemIds[0]);
    console.log('\n✓ Seed complete. Open Firestore console to verify.');
    process.exit(0);
  } catch (err) {
    console.error('\nSeed failed:', err.message);
    process.exit(1);
  }
}

main();
