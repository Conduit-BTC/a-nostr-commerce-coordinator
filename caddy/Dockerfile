FROM caddy:latest

COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443 3333

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
