#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

console.log('🧹 Supabase User Cleanup Tool');
console.log('=============================');

// Your NEW database credentials
const NEW_SUPABASE_URL = 'https://your-new-project-id.supabase.co';
const NEW_SERVICE_ROLE_KEY = 'your-new-service-role-key';

// Users to keep (don't delete these)
const PROTECTED_USERS = [
  'sage@myai.ad'  // Super admin - never delete
];

console.log('⚠️  IMPORTANT: Update the credentials above with your NEW Supabase project details');
console.log('');

// Create Supabase client
const supabase = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY);

async function listCurrentUsers() {
  console.log('👥 Step 1: Listing Current Users');
  console.log('=================================');
  
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Failed to fetch users:', error.message);
      return null;
    }
    
    console.log(`📊 Found ${users.users.length} users in database:`);
    console.log('');
    
    users.users.forEach((user, index) => {
      const isProtected = PROTECTED_USERS.includes(user.email);
      const status = isProtected ? '🔒 PROTECTED' : '🗑️  CAN DELETE';
      
      console.log(`${index + 1}. ${user.email} - ${status}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}`);
      console.log('');
    });
    
    return users.users;
  } catch (error) {
    console.error('❌ Failed to list users:', error.message);
    return null;
  }
}

async function deleteUser(userId, email) {
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error(`❌ Failed to delete ${email}:`, error.message);
      return false;
    }
    
    console.log(`✅ Deleted user: ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting ${email}:`, error.message);
    return false;
  }
}

async function cleanupUsers() {
  console.log('\n🧹 Step 2: User Cleanup');
  console.log('=======================');
  
  const users = await listCurrentUsers();
  if (!users) {
    return false;
  }
  
  const usersToDelete = users.filter(user => !PROTECTED_USERS.includes(user.email));
  
  if (usersToDelete.length === 0) {
    console.log('✅ No users to delete - all users are protected');
    return true;
  }
  
  console.log(`🗑️  Will delete ${usersToDelete.length} users:`);
  usersToDelete.forEach(user => {
    console.log(`   - ${user.email}`);
  });
  console.log('');
  
  // Ask for confirmation (in a real scenario, you'd want user input)
  console.log('⚠️  CONFIRMATION REQUIRED:');
  console.log('This script will delete the users listed above.');
  console.log('Make sure you have verified your database is working correctly first!');
  console.log('');
  console.log('To proceed, edit this script and set CONFIRM_DELETE = true');
  
  const CONFIRM_DELETE = false; // Change this to true to actually delete users
  
  if (!CONFIRM_DELETE) {
    console.log('❌ Deletion cancelled - CONFIRM_DELETE is false');
    return false;
  }
  
  console.log('🚀 Starting user deletion...');
  
  let deletedCount = 0;
  let failedCount = 0;
  
  for (const user of usersToDelete) {
    const success = await deleteUser(user.id, user.email);
    if (success) {
      deletedCount++;
    } else {
      failedCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Cleanup Summary:');
  console.log(`✅ Deleted: ${deletedCount} users`);
  console.log(`❌ Failed: ${failedCount} users`);
  console.log(`🔒 Protected: ${PROTECTED_USERS.length} users`);
  
  return failedCount === 0;
}

async function createCleanupReport() {
  console.log('\n📝 Step 3: Creating Cleanup Report');
  console.log('===================================');
  
  const users = await listCurrentUsers();
  if (!users) {
    return false;
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    total_users: users.length,
    protected_users: users.filter(user => PROTECTED_USERS.includes(user.email)),
    other_users: users.filter(user => !PROTECTED_USERS.includes(user.email)),
    protected_emails: PROTECTED_USERS
  };
  
  try {
    fs.writeFileSync('user_cleanup_report.json', JSON.stringify(report, null, 2));
    console.log('✅ Cleanup report saved to: user_cleanup_report.json');
    return true;
  } catch (error) {
    console.error('❌ Failed to create report:', error.message);
    return false;
  }
}

async function runCleanup() {
  console.log('🚀 Starting user cleanup process...\n');
  
  const steps = [
    { name: 'List Users', fn: listCurrentUsers },
    { name: 'Cleanup Users', fn: cleanupUsers },
    { name: 'Create Report', fn: createCleanupReport }
  ];
  
  let allSuccessful = true;
  
  for (const step of steps) {
    const result = await step.fn();
    if (!result && step.name !== 'Cleanup Users') { // Cleanup might be cancelled
      allSuccessful = false;
      console.log(`❌ ${step.name} failed`);
    }
  }
  
  console.log('\n📋 Important Notes:');
  console.log('==================');
  console.log('1. 🔒 Protected users (never deleted):');
  PROTECTED_USERS.forEach(email => console.log(`   - ${email}`));
  console.log('2. 🧪 Always test your application thoroughly before cleanup');
  console.log('3. 💾 Keep backups of your user data');
  console.log('4. 📧 Consider notifying users before deletion');
  
  if (allSuccessful) {
    console.log('\n🎉 CLEANUP PROCESS COMPLETE!');
  } else {
    console.log('\n❌ CLEANUP PROCESS HAD ISSUES');
    console.log('Check the errors above and retry if needed.');
  }
}

// Check if credentials are still placeholders
if (NEW_SUPABASE_URL.includes('your-new') || NEW_SERVICE_ROLE_KEY.includes('your-new')) {
  console.log('⚠️  Please update the credentials at the top of this file with your NEW Supabase project details:');
  console.log('1. NEW_SUPABASE_URL');
  console.log('2. NEW_SERVICE_ROLE_KEY');
  console.log('\nThen run this script again.');
} else {
  runCleanup();
} 