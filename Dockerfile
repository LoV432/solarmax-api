FROM node:20-alpine

WORKDIR /app
COPY index.ts lib.ts errorCodes.ts sign.ts types.d.ts package.json package-lock.json ./
RUN npm install
CMD ["npm", "run", "start"]