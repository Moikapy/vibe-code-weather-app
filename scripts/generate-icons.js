const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Icon sizes needed
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to draw a weather icon
function drawWeatherIcon(ctx, size) {
  const center = size / 2;
  const radius = size * 0.35;

  // Background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4F46E5'); // Indigo
  gradient.addColorStop(1, '#7C3AED'); // Purple
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Sun
  ctx.beginPath();
  ctx.arc(center - radius * 0.2, center - radius * 0.2, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#FCD34D'; // Yellow
  ctx.fill();

  // Cloud
  ctx.beginPath();
  ctx.arc(center, center + radius * 0.2, radius * 0.8, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(center + radius * 0.6, center + radius * 0.2, radius * 0.6, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fillStyle = '#F3F4F6'; // Light gray
  ctx.fill();

  // Add subtle shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = size * 0.05;
  ctx.shadowOffsetX = size * 0.02;
  ctx.shadowOffsetY = size * 0.02;
}

// Generate icons for each size
sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw the icon
  drawWeatherIcon(ctx, size);

  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), buffer);
  console.log(`Generated ${size}x${size} icon`);
}); 