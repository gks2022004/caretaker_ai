import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import os from "os";
import { writeFile } from "fs/promises";

// 1) Initialize Groq with your API key
//    Make sure you have API_KEY in your .env.local or environment variables
const groq = new Groq({ apiKey: process.env.API_KEY });

// 2) Handle CORS Preflight (optional, if you’re calling from a different origin)
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// 3) POST Handler for Transcription
export async function POST(req) {
  try {
    // a) Parse the incoming FormData
    const formData = await req.formData();
    const file = formData.get("file"); // "file" must match the key from your FormData

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // b) Use the OS’s temp directory to avoid "ENOENT" on Windows
    const tempDir = os.tmpdir(); // e.g., C:\Users\<Name>\AppData\Local\Temp on Windows
    const filePath = path.join(tempDir, "uploaded.webm");

    // c) Write the uploaded Blob to a temp file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    // d) Call Groq’s Whisper API for transcription
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json",
    });

    // e) Clean up the temp file
    fs.unlinkSync(filePath);

    // f) Return the transcribed text
    return NextResponse.json({ text: transcription.text }, { status: 200 , headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // <-- Change "*" to your domain in production
      },});
  } catch (error) {
    console.error("Transcription Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 , headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // <-- Change "*" to your domain in production
      },});
  }
}
