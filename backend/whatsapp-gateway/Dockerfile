FROM node:20-alpine

# Install git since Baileys has dependencies requiring git to resolve
RUN apk add --no-cache git

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 4000

ENV PORT=4000

CMD ["node", "index.js"]
