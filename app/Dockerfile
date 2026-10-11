# Dockerfile — kako se zgradi vsebnik z aplikacijo
FROM node:20-alpine

WORKDIR /app

# najprej samo package.json, da Docker ne nameša knjižnic znova ob vsaki spremembi kode
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# potem še vsa koda
COPY . .

# mapa za naložene datoteke; lastnik je uporabnik "node",
# pravice 750 = samo lastnik lahko piše, drugi uporabniki nimajo dostopa
RUN mkdir -p datoteke && chown node:node datoteke && chmod 750 datoteke

# aplikacija ne teče kot root, ampak kot navaden uporabnik "node"
USER node

EXPOSE 3000

CMD ["node", "server.js"]
