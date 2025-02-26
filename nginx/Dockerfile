FROM alpine:latest AS build
ENV MIN_CLEAN=true
COPY ./nginx/minify.sh /minify.sh
COPY ./www/test-harness /www
RUN rm /www/js/jquery*
RUN apk update
RUN apk add git php
RUN git clone https://github.com/matthiasmullie/minify.git /minify
RUN /minify.sh /www/index.html

FROM nginx:bookworm AS deploy
COPY --from=build /www /www
COPY ./nginx/cffc.conf /cffc.conf
COPY ./nginx/certs/cert.key /etc/nginx
COPY ./nginx/certs/cert.pem /etc/nginx
# ENTRYPOINT /bin/bash -c "envsubst </cffc.conf >/etc/nginx/nginx.conf && sleep 20m"
ENTRYPOINT /bin/bash -c "envsubst </cffc.conf >/etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"
