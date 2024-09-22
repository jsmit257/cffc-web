### A web server for static resources

An nginx config file to route static resources before they reach an api server. The [Dockerfile](./Dockerfile) installs the configuration and rewrites the entrypoint to replace environment vars in `cffc.conf` with their values defined in the execution context. The easiest way to launch it is with `docker-compose` similar to the `cffc-web` service in [this example](../docker-compose.yml).

#### Usage
You mainly care about three configuration options:

- ports: nginx starts on the default port 80, and it's up to you to map it to a different host port, if needed
- volumes: 
  - the background image has its own list entry, for better or worse; if it's missing, nothing will break, the site just won't have a background logo; 
  - but, the album volume has to be mounted from the same source as the cffc-api server, since there's no sane way to share album data; if the album setting is wrong/missing, the `proxy_pass` server can still write album data, but the web server won't be able to fetch it
- environment: these will be substituted into the `proxy_pass` directives when the server starts; mainly for external services, since, so far, the static things are either copied into the image or shared via a volume

At the risk of repeating ourselves: it's pretty well documented [here](../docker-compose.yml)

#### Future use:
##### SSL (!important)
##### AuthNZ service
##### Inventory/Order service
