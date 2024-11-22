const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const port = 3000;

// Set up file upload storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Middleware for parsing JSON and URL encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files like the frontend HTML and CSS
app.use(express.static('public'));

// Endpoint to update settings and upload video
app.post('/update-settings', upload.single('videoFile'), (req, res) => {
    const { rtmpUrl, rtmpKey, audioUrl } = req.body;
    const videoFile = req.file ? req.file.path : null;

    if (!videoFile) {
        return res.status(400).send('No video file uploaded.');
    }

    // Store settings and prepare for the stream
    const streamSettings = {
        rtmpUrl,
        rtmpKey,
        audioUrl,
        videoFile,
    };

    // Simulate starting the stream (replace with real logic)
    res.send('Settings updated and video uploaded. Now you can start streaming!');
});

// Endpoint to start the stream
app.post('/start', (req, res) => {
    const videoPath = 'uploads/video.mp4';  // Video path from the uploaded file
    const { rtmpUrl, rtmpKey, audioUrl } = req.body;

    if (!videoPath || !rtmpUrl || !rtmpKey || !audioUrl) {
        return res.status(400).send('Missing required parameters.');
    }

    // Command for starting the stream with FFmpeg
    const ffmpegCommand = [
        'ffmpeg',
        '-loglevel', 'info', '-re',
        '-stream_loop', '-1', '-i', videoPath,
        '-i', audioUrl,
        '-c:v', 'libx264', '-preset', 'ultrafast', '-b:v', '200k', '-maxrate', '200k', '-bufsize', '400k',
        '-r', '15', '-s', '640x360', '-vf', 'format=yuv420p', '-g', '30', '-shortest',
        '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
        '-map', '0:v', '-map', '1:a',
        '-f', 'flv', `${rtmpUrl}/${rtmpKey}`,
    ];

    // Run the FFmpeg command to start the stream
    exec(ffmpegCommand.join(' '), (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(`Error starting the stream: ${stderr}`);
        }
        res.send('Stream started successfully!');
    });
});

// Endpoint to stop the stream (simulate stop)
app.post('/stop', (req, res) => {
    // Logic to stop the stream can be added here
    res.send('Stream stopped.');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
