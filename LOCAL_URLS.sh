#!/bin/bash

# Online Consultancy Platform - PORT CONFIGURATION
# All services use ports 1112-1123

echo "============================================"
echo "   ONLINE CONSULTANCY PLATFORM - LOCAL URLs"
echo "   Using Ports: 1112-1123"
echo "============================================"
echo ""

# PORT MAPPING
# 1112 - Web App (Next.js)
# 1113 - Admin Dashboard
# 1114 - User Service API
# 1115 - Consultant Service API
# 1116 - Booking Service API
# 1117 - Billing Service API (Go)
# 1118 - Content Service API
# 1119 - AI Orchestrator API (Python)
# 1120 - Notification Service API
# 1121 - WhatsApp Bot API
# 1122 - Prometheus Monitoring
# 1123 - Grafana Dashboard

echo "🌐 WEB APPLICATION:"
echo "   http://localhost:1112"
echo ""
echo "   Pages:"
echo "   ├── Home:                http://localhost:1112/"
echo "   ├── Login:               http://localhost:1112/auth/login"
echo "   ├── Register:            http://localhost:1112/auth/register"
echo "   ├── Search:              http://localhost:1112/search"
echo "   ├── Consultant Profile:  http://localhost:1112/consultant/[id]"
echo "   ├── User Dashboard:      http://localhost:1112/dashboard"
echo "   ├── Profile:             http://localhost:1112/profile"
echo "   ├── Payment:             http://localhost:1112/payment"
echo "   ├── Session:             http://localhost:1112/session/[id]"
echo "   ├── Consultant Portal:   http://localhost:1112/consultant/dashboard"
echo "   ├── Onboarding:          http://localhost:1112/consultant/onboarding"
echo "   └── Availability:        http://localhost:1112/consultant/availability"
echo ""

echo "🔧 ADMIN DASHBOARD:"
echo "   http://localhost:1113"
echo ""
echo "   Pages:"
echo "   ├── Home:                http://localhost:1113/"
echo "   ├── Users:               http://localhost:1113/users"
echo "   ├── Verifications:       http://localhost:1113/verifications"
echo "   ├── Bookings:            http://localhost:1113/bookings"
echo "   ├── Settings:            http://localhost:1113/settings"
echo "   ├── Billing Config:      http://localhost:1113/billing-config"
echo "   └── Scheduling:          http://localhost:1113/billing-scheduling"
echo ""

echo "🚀 BACKEND SERVICES:"
echo ""
echo "   User Service (1114):     http://localhost:1114"
echo "   ├── Health:              GET  http://localhost:1114/health"
echo "   ├── Docs:                http://localhost:1114/docs"
echo "   ├── Register:            POST http://localhost:1114/auth/register"
echo "   ├── Login:               POST http://localhost:1114/auth/login"
echo ""
echo "   Consultant Service (1115): http://localhost:1115"
echo "   ├── List Consultants:    GET  http://localhost:1115/consultants"
echo "   ├── Get Consultant:      GET  http://localhost:1115/consultants/:id"
echo ""
echo "   Booking Service (1116):  http://localhost:1116"
echo "   ├── Create Booking:      POST http://localhost:1116/bookings"
echo "   ├── Get Bookings:        GET  http://localhost:1116/bookings"
echo ""
echo "   Billing Service (1117):  http://localhost:1117"
echo "   ├── Calculate Price:     POST http://localhost:1117/pricing/calculate"
echo "   ├── Payment Intent:      POST http://localhost:1117/payments/stripe/intent"
echo ""
echo "   Content Service (1118):  http://localhost:1118"
echo "   ├── Upload Content:      POST http://localhost:1118/upload"
echo "   ├── Stream Content:      GET  http://localhost:1118/stream/:id"
echo ""
echo "   AI Orchestrator (1119):  http://localhost:1119"
echo "   ├── AI Matching:         POST http://localhost:1119/ai/matching"
echo "   ├── Chatbot:             POST http://localhost:1119/ai/chatbot"
echo ""
echo "   Notification (1120):     http://localhost:1120"
echo "   ├── Send Email:          POST http://localhost:1120/notifications/email"
echo ""
echo "   WhatsApp Bot (1121):     http://localhost:1121"
echo "   ├── Webhook:             GET/POST http://localhost:1121/webhook"
echo ""

echo "📊 MONITORING:"
echo "   Prometheus:              http://localhost:1122"
echo "   Grafana:                 http://localhost:1123 (admin/admin)"
echo ""

echo "📡 DATABASE:"
echo "   PostgreSQL:              localhost:5432"
echo "   Database:                consultancy"
echo "   User:                    postgres"
echo ""

echo "============================================"
echo "   QUICK START"
echo "============================================"
echo ""
echo "# Start Web App:"
echo "   cd packages/web && npm run dev"
echo ""
echo "# Start Admin Dashboard:"
echo "   cd packages/admin && npm run dev"
echo ""
echo "# Start User Service:"
echo "   cd packages/services/user-service && npm run dev"
echo ""
echo "# Database Query:"
echo "   psql -U postgres -d consultancy"
echo ""
echo "============================================"