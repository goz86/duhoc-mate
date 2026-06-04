FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./

RUN npm ci --only=production

COPY server/ ./

# Hugging Face Spaces require the app to listen on port 7860.
EXPOSE 7860
ENV PORT=7860
ENV DISABLE_FALLBACK_PORT=1

CMD ["node", "index.js"]
