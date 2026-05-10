# CropWise – AI Powered Smart Farming Intelligence

<div align="center">

## GEN AI COPILOT FOR FARMERS

Offline-first intelligent farming assistant designed to empower farmers with AI-driven crop intelligence, disease detection, climate insights, and government scheme navigation.

</div>

---

# Overview

CropWise is an AI-powered smart farming platform focused on solving real-world agricultural challenges faced by farmers in rural and low-connectivity regions.

The platform combines:

- Generative AI
- Climate intelligence
- Crop recommendation systems
- Voice-based interaction
- Offline-first architecture
- Real-time weather intelligence
- Multi-agent AI workflows

CropWise is designed specifically for regions with:
- Poor internet connectivity
- Local dialect requirements
- Limited technical literacy
- High dependency on climate-sensitive agriculture

---

# Problem Statement

Farmers face several critical challenges:

- Poor or unstable internet connectivity in rural regions
- Language barriers in existing agri-tech systems
- Difficulty accessing government schemes and agricultural information
- Delayed pest detection causing major crop losses
- Climate volatility affecting traditional farming decisions

CropWise aims to bridge these gaps using intelligent AI systems and offline-first infrastructure.

---

# Core Features

## The Crop Doctor
AI-powered disease detection using crop images.

### Features
- Instant plant disease diagnosis
- Bio-pesticide recommendations
- Soil-health-friendly treatment suggestions
- Multimodal AI support

---

## PM Kisan Navigator
Voice-powered assistant for government agricultural schemes.

### Features
- Scheme eligibility checking
- Application guidance
- Payment status assistance
- Local language support

---

## Smart Farming Planner
Personalized farming activity planner.

### Features
- Sowing-to-harvest activity calendar
- Real-time mandi price alerts
- Smart reminders
- Market-aware recommendations

---

## Climate Counsellor
AI-driven crop and weather intelligence.

### Features
- Climate-aware crop suggestions
- Soil-health analysis
- Weather pattern monitoring
- Profitable crop prediction

---

## Sky-to-Soil Monitoring
Advanced weather and storm intelligence.

### Features
- Live typhoon tracking
- Thunderstorm intensity mapping
- Field-coordinate monitoring
- Color-coded weather visualization

---

# Workflow

```text
1. Farmer speaks in local dialect or uploads an image
        ↓
2. Speech-to-Text converts voice input into prompts
        ↓
3. RAG system searches agricultural databases
        ↓
4. LLM generates concise actionable insights
        ↓
5. Text-to-Speech returns response in local language
```

---

# Unique Innovations

## Signal-Adaptive Intelligent Routing

CropWise dynamically switches between:
- Cloud RAG
- MQTT low-bandwidth mode
- Local-only offline inference

This ensures uninterrupted usability even in poor connectivity zones.

---

## Zero-Data SMS Fallback Bridge

For regions with no internet:
- Queries are compressed into SMS-compatible packets
- Backend processes requests
- AI-generated responses are returned through SMS

---

## Village Mesh Sync (P2P)

Peer-to-peer synchronization enables:
- Weather updates
- Scheme alerts
- Local knowledge sharing

Using:
- Bluetooth
- Local Wi-Fi mesh networking

---

## Edge-First Local Intelligence

Progressive Web App architecture caches:
- Pest databases
- Sowing schedules
- Market trends
- Government resources

Allowing offline accessibility without data consumption.

---

# Tech Stack

## Frontend
- React
- TypeScript
- Tailwind CSS
- Progressive Web App (PWA)

## Backend
- Node.js
- Express.js
- REST APIs
- Webhooks

## AI & Orchestration
- LangGraph.js
- LangChain.js
- Multi-Agent Workflows
- State-Based AI Reasoning

## Models
- Llama 3.3 70B (Groq)
- Phi-3 Mini
- Whisper
- Text-to-Speech Systems

## Databases & Retrieval
- Pinecone
- ChromaDB
- Retrieval-Augmented Generation (RAG)

## Connectivity & Offline Systems
- MQTT
- SMS Gateway
- P2P Mesh Sync
- Offline Cache Engine

---

# Architecture Highlights

- Offline-first AI system
- Real-time climate intelligence
- Edge AI support
- Multilingual voice interface
- Multi-agent orchestration
- Hybrid cloud-edge inference

---

# Project Structure

```bash
CropWise/
│
├── frontend/          # React + TypeScript frontend
├── backend/           # Node.js + Express APIs
├── ai/                # AI orchestration and workflows
├── rag/               # Retrieval systems and embeddings
├── public/            # Static assets
├── docs/              # Documentation and presentations
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/sRiSh-JaNa-tech/CropWise_SiliCoders.git
cd CropWise_SiliCoders
```

---

## Install Dependencies

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
npm install
```

---

# Run Locally

## Frontend

```bash
npm run dev
```

## Backend

```bash
npm start
```

---

# Future Scope

- Satellite-based soil analysis
- AI-powered irrigation optimization
- IoT sensor integration
- Drone-based crop monitoring
- Blockchain-based agricultural supply chains
- Hyperlocal weather prediction

---

# Team Silicoders

Built with the vision of making AI accessible to every farmer regardless of connectivity, language, or technical literacy.
