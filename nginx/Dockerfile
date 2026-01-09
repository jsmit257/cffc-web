FROM alpine:latest AS build
ENV MIN_CLEAN=true
COPY ./nginx/minify.sh /minify.sh
COPY ./www/test-harness /www
RUN rm -f /www/js/jquery*
RUN apk update
RUN apk add git php
RUN git clone https://github.com/matthiasmullie/minify.git /minify
RUN /minify.sh /www/index.html

FROM nginx:bookworm AS deploy
RUN mkdir -m 600 /etc/nginx/certs
COPY --from=build /www /www
ADD ./nginx/cffc.conf /cffc.conf
ADD ./nginx/certs/cert.pem ./nginx/certs/key.pem /etc/nginx/certs/
# ENTRYPOINT /bin/bash -c "envsubst </cffc.conf >/etc/nginx/nginx.conf && sleep 20m"
ENTRYPOINT /bin/bash -c "envsubst </cffc.conf >/etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"
