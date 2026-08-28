# Repyr Project Overview

## App Name
Repyr (repyrai.com)

## Purpose
Repyr is an AI-powered vehicle diagnostic assistant. Users describe car symptoms, and an AI diagnostician asks targeted questions to identify the exact failing component with confidence scores and localized cost estimates.

## Target Users
Car owners who want quick, affordable preliminary diagnostics before visiting a mechanic.

## Key Features
- **AI Diagnostic Chat**: Users describe symptoms → AI asks one question at a time → identifies exact failing component with 95%+ confidence → provides localized repair cost estimate.
- **Vehicle Garage**: Store multiple vehicles with details (make, model, year, mileage, fuel type, transmission, location).
- **Diagnostic History**: View past completed diagnoses grouped by time period.
- **Subscription System**: Trial (1 free session/day), Plus ($6.99/mo - 5 sessions/day), Pro ($12.99/mo - unlimited).
- **Guest Mode**: Users can try the app without signing up, then prompted to create account before starting diagnosis.
- **Authentication**: Google OAuth + Email/Password auth.

## User Flow
1. Sign up
2. Add vehicle
3. Select vehicle
4. Choose problem category or describe symptoms
5. AI diagnostic chat
6. Get diagnosis with cost estimate

## Guest Flow
1. Land on page
2. Fill in vehicle details as guest
3. Describe symptoms
4. Prompted to sign up
5. After sign up, vehicle is migrated and symptoms are auto-filled
6. Diagnosis starts
