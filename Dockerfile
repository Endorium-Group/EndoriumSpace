# Image statique du site EndoriumSpace, servie par nginx.
# Caddy termine le TLS et fait le reverse-proxy vers ce conteneur en HTTP:80.
FROM nginx:1.27-alpine

# Copie uniquement les fichiers du site (pas .git, Dockerfile, README…).
COPY index.html styles.css main.js /usr/share/nginx/html/
COPY assets/     /usr/share/nginx/html/assets/
COPY docs/       /usr/share/nginx/html/docs/
COPY community/  /usr/share/nginx/html/community/
COPY legal/      /usr/share/nginx/html/legal/

# nginx:alpine écoute déjà sur le port 80 et sert /usr/share/nginx/html.
EXPOSE 80
