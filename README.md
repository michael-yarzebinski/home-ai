# 🚀 Home AI

A private, self-hosted AI ecosystem running on a Mac Mini hub. This project orchestrates local LLMs, Home Assistant, and macOS native applications (Notes, Calendar, iMessage) into a single, cohesive automated home intelligence.

## 🏗 Architecture

The system uses a "Hybrid-Native" architecture to bypass the limitations of containerization on macOS while keeping the core logic isolated.

### 1. The Core (Docker)

* **NestJS Server:** The "brain" that processes logic and manages integrations.

* **Postgres:** Database for long-term memory and state.

* **Home Assistant:** Manages IoT devices (lights, switches, sensors).

* **Ollama:** Hosts local LLMs (Mistral/Llama) for private natural language processing.

### 2. The Bridge (Native Mac Host)

* **Express Relay:** A lightweight Node.js service running on the host OS. It acts as a secure bridge for the Dockerized server to execute AppleScripts (controlling Notes and Calendar) with full UI/Accessibility permissions.

* **BlueBubbles:** Provides an iMessage bridge, allowing the AI to communicate via standard Apple Messages.

## 🛠 Prerequisites

* **Hardware:** A Mac (Optimized for Mac Mini M1/M2/M3).

* **OS:** macOS 13.0+ (Ventura or newer).

* **Permissions:** You must be an administrator to grant Accessibility and Full Disk Access.

## 🚀 Installation

Follow these steps to turn your Mac into a Home AI hub.

### 1. Run the One-Click Install

Open your terminal and run the following command from the project root:

```bash
chmod +x install.sh
./install.sh
```

**This script will:**

* Install **Homebrew**, **Docker**, and **Node.js** if missing.

* Install and launch **BlueBubbles**.

* Start the **Express Relay** as a background service via PM2.

* Pull and configure **Ollama** models (~10GB).

### 2. Grant Permissions (CRITICAL)

For the AI to interact with your Mac, you must manually grant these permissions:

1. **Full Disk Access:** Go to `System Settings > Privacy & Security > Full Disk Access`. Toggle **ON** for **BlueBubbles** and **Terminal**.

2. **Accessibility:** The first time the AI tries to update a note, a popup will appear. Click **Allow** to let the Relay (Node) control the UI.

## 🕹 Daily Management

We provide simple scripts to manage the entire stack without needing to remember complex Docker commands.

* **Start everything:** `./start.sh`

* **Stop everything:** `./stop.sh`

* **Check logs:** `docker compose logs -f server`

* **Check Relay status:** `pm2 list`

## 📝 Features & Integrations

### 🍏 Apple Ecosystem

* **Notes:** Automated grocery lists with native Apple Checklists.

* **Calendar:** Smart scheduling and event creation via AppleScript.

* **iMessage:** Send and receive updates via BlueBubbles.

### 🏠 Home Automation

* **Home Assistant:** Deep integration with local devices.

* **Local AI:** All processing happens on your hardware. No data leaves your house.

## 🛡 Security

* **Secure Relay:** The bridge between Docker and your Mac is protected by a shared API Key.

* **Local-First:** Ollama ensures your conversations are never sent to external cloud providers.