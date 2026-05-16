import express from "express"
import cors from "cors"
import os from "os"

const app = express()

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        // add production URL
        "http://65.0.17.254:3000",
        // after nginx configuration
        "http://65.0.17.254"
    ]
}))

app.use(express.json())

// ─── Helpers ────────────────────────────────────────────────────────────────

const startTime = Date.now()

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    return `${m}m ${s}s`
}

function getCpuUsage() {
    const cpus = os.cpus()
    let totalIdle = 0, totalTick = 0
    cpus.forEach(cpu => {
        for (const type in cpu.times) totalTick += cpu.times[type]
        totalIdle += cpu.times.idle
    })
    const usage = 100 - (totalIdle / totalTick * 100)
    return parseFloat(usage.toFixed(1))
}

function getMemoryInfo() {
    const total = os.totalmem()
    const free = os.freemem()
    const used = total - free
    return {
        total: (total / 1024 / 1024 / 1024).toFixed(2),
        used: (used / 1024 / 1024 / 1024).toFixed(2),
        free: (free / 1024 / 1024 / 1024).toFixed(2),
        percent: parseFloat(((used / total) * 100).toFixed(1))
    }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
    res.json({ message: "Backend is Running", version: "2.0.0" })
})

// Main health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        message: "All systems operational",
        timestamp: new Date().toISOString(),
        uptime: formatUptime(process.uptime()),
        version: "2.0.0",
        environment: process.env.NODE_ENV || "production"
    })
})

// System metrics
app.get("/api/metrics", (req, res) => {
    const mem = getMemoryInfo()
    const cpuUsage = getCpuUsage()
    const processUptime = process.uptime()
    const appUptime = (Date.now() - startTime) / 1000

    res.json({
        cpu: {
            usage: cpuUsage,
            cores: os.cpus().length,
            model: os.cpus()[0]?.model?.split(" ").slice(0, 3).join(" ") || "Unknown",
            architecture: os.arch()
        },
        memory: mem,
        system: {
            platform: os.platform(),
            hostname: os.hostname(),
            osRelease: os.release(),
            nodeVersion: process.version,
            processUptime: formatUptime(processUptime),
            appUptime: formatUptime(appUptime)
        },
        network: {
            loadAvg: os.loadavg().map(v => parseFloat(v.toFixed(2))),
            interfaces: Object.keys(os.networkInterfaces()).length
        }
    })
})

// Services / containers status
app.get("/api/services", (req, res) => {
    // Simulating real service status — in prod this would check actual containers
    const services = [
        {
            name: "react-client",
            type: "Frontend",
            status: "running",
            port: 3000,
            image: "node:20-alpine",
            uptime: formatUptime(process.uptime() + 120),
            health: "healthy",
            restarts: 0
        },
        {
            name: "express-server",
            type: "Backend",
            status: "running",
            port: 5000,
            image: "node:20-alpine",
            uptime: formatUptime(process.uptime()),
            health: "healthy",
            restarts: 0
        },
        {
            name: "nginx-proxy",
            type: "Reverse Proxy",
            status: "running",
            port: 80,
            image: "nginx:latest",
            uptime: formatUptime(process.uptime() + 180),
            health: "healthy",
            restarts: 0
        }
    ]

    res.json({ services, total: services.length, healthy: services.filter(s => s.health === "healthy").length })
})

// Deployment pipeline / CI-CD history
app.get("/api/deployments", (req, res) => {
    const deployments = [
        {
            id: "deploy-004",
            commit: "feat: added live metrics dashboard & API endpoints",
            sha: "a3f9d2c",
            branch: "main",
            status: "success",
            duration: "1m 42s",
            triggeredBy: "push",
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            steps: ["checkout", "install", "build", "docker-build", "deploy"]
        },
        {
            id: "deploy-003",
            commit: "fix: nginx reverse proxy SSL configuration",
            sha: "b7e1a4f",
            branch: "main",
            status: "success",
            duration: "2m 08s",
            triggeredBy: "push",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            steps: ["checkout", "install", "build", "docker-build", "deploy"]
        },
        {
            id: "deploy-002",
            commit: "chore: docker compose multi-service orchestration",
            sha: "c2d5f8a",
            branch: "main",
            status: "success",
            duration: "3m 21s",
            triggeredBy: "push",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            steps: ["checkout", "install", "build", "docker-build", "deploy"]
        },
        {
            id: "deploy-001",
            commit: "init: project setup with Vite + Express + Docker",
            sha: "d9a3e1b",
            branch: "main",
            status: "success",
            duration: "4m 05s",
            triggeredBy: "push",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            steps: ["checkout", "install", "build", "docker-build", "deploy"]
        }
    ]

    res.json({ deployments, total: deployments.length, successRate: "100%" })
})

// Infrastructure stack info
app.get("/api/stack", (req, res) => {
    res.json({
        stack: [
            { layer: "Frontend", tech: "React 19 + Vite", purpose: "SPA served via Nginx" },
            { layer: "Backend", tech: "Express.js 5", purpose: "REST API" },
            { layer: "Reverse Proxy", tech: "Nginx", purpose: "Traffic routing to nginx server without exposing backend and frontend ports" },
            { layer: "Containerization", tech: "Docker + Compose", purpose: "Service orchestration" },
            { layer: "CI/CD", tech: "GitHub Actions", purpose: "Automated build & deploy" },
            { layer: "Cloud", tech: "AWS EC2 (t2.micro)", purpose: "Production VPS hosting" }
        ]
    })
})

// Ping / latency test
app.get("/api/ping", (req, res) => {
    res.json({
        pong: true,
        timestamp: Date.now(),
        message: "Hello World!",
        serverTime: new Date().toISOString()
    })
})

export default app