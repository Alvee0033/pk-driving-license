FROM node:20-alpine

WORKDIR /app

# Install system dependencies: Python3, Pillow, QRCode, and TrueType fonts
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-pillow \
    py3-qrcode \
    font-dejavu \
    font-liberation \
    ttf-freefont

# Install npm dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application files
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN npm run build

# Expose application port
EXPOSE 3005
ENV PORT 3005
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "start"]
