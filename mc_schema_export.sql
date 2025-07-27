-- MC Database Schema Export
-- Generated from existing Supabase database
-- Date: 2025-07-27T20:23:11.282Z

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: users
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT,
  "email" TEXT,
  "name" TEXT,
  "referral_code" TEXT,
  "profile_image_url" TEXT,
  "bio" TEXT,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "is_admin" BOOLEAN,
  "data_source" TEXT
);

-- Table: commission_plans
CREATE TABLE IF NOT EXISTS "commission_plans" (
  "id" TEXT,
  "product_category" TEXT,
  "product_name" TEXT,
  "shopify_product_id" TEXT,
  "level_1_rate" INTEGER,
  "level_2_rate" INTEGER,
  "level_3_rate" INTEGER,
  "is_active" BOOLEAN,
  "effective_from" TIMESTAMP,
  "effective_until" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP
);

-- Table: goaffpro_orders
CREATE TABLE IF NOT EXISTS "goaffpro_orders" (
  "id" TEXT,
  "goaffpro_order_id" TEXT,
  "affiliate_id" TEXT,
  "goaffpro_affiliate_id" TEXT,
  "order_number" TEXT,
  "customer_email" TEXT,
  "order_date" TEXT,
  "order_amount" TEXT,
  "commission_amount" NUMERIC,
  "commission_status" TEXT,
  "commission_date" TEXT,
  "raw_data" JSONB,
  "last_synced" TIMESTAMP,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "commission_rate" TEXT,
  "data_source" TEXT,
  "customer_name" TEXT,
  "order_total" NUMERIC,
  "products" JSONB,
  "status" TEXT
);

-- Table: rag_documents
CREATE TABLE IF NOT EXISTS "rag_documents" (
  "id" TEXT,
  "title" TEXT,
  "content" TEXT,
  "file_type" TEXT,
  "file_size" INTEGER,
  "tags" JSONB,
  "uploaded_by" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP
);

