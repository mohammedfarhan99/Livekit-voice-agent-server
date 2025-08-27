FROM node:22-bookworm-slim AS base

# Install Python
RUN apt-get update && \
    apt-get install -y  python-is-python3 python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Node dependencies
COPY package*.json ./
RUN npm ci --only=production

# Python dependencies
WORKDIR /app/python-agents
COPY python-agents/requirements.txt .

RUN python3 -m venv venv
RUN venv/bin/pip install --upgrade pip
RUN venv/bin/pip install -r requirements.txt

# Copy rest of app
WORKDIR /app
COPY . .

EXPOSE 3000