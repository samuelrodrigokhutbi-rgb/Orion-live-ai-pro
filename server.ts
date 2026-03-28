import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/export-project", (req, res) => {
    try {
      const zip = new AdmZip();
      const rootDir = process.cwd();
      
      // Folders to include
      const folders = ['src', 'public', 'dist'];
      folders.forEach(folder => {
        const folderPath = path.join(rootDir, folder);
        if (fs.existsSync(folderPath)) {
          zip.addLocalFolder(folderPath, folder);
        }
      });

      // Individual files to include
      const files = [
        'package.json',
        'index.html',
        'server.ts',
        'vite.config.ts',
        'tsconfig.json',
        'metadata.json',
        'firebase-blueprint.json',
        'firestore.rules',
        'firebase-applet-config.json',
        '.env.example'
      ];
      
      files.forEach(file => {
        const filePath = path.join(rootDir, file);
        if (fs.existsSync(filePath)) {
          zip.addLocalFile(filePath);
        }
      });

      const zipBuffer = zip.toBuffer();
      
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=orion-ai-project.zip',
        'Content-Length': zipBuffer.length
      });

      res.send(zipBuffer);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export project" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA fallback for production
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
