### CFFC-Web

A collection of static resources and a simple nginx config file to serve them, and to proxy API requests. The [Dockerfile](./nginx/Dockerfile) copies the web resources, installs the configuration and rewrites the entrypoint to replace environment vars in [cffc.conf](./nginx/cffc.conf) with their values defined in the execution context.

#### Production
The only production artefact from this project is a docker container at [jsmit257/cffc-web:lkg](https://hub.docker.com/repository/docker/jsmit257/cffc-web/general).  The easiest way to launch it is with the `cffc-web` service in [docker-compose](./docker-compose.yml). Simple usage is something like:
```sh
CFFC_API_HOST=myhost CFFC_API_PORT=12345 docker-compose up [--build] [--remove-orphans] [-d] cffc-web
```
The environment variables need to be defined for the server to start, and there are no default values. Typically, these would be pointed to a running test server in [wherever](???). All the bootstrap process cares about is if they have non-empty values. The runtime will care if the non-empty values are correct.

#### Configuration
You mainly care about three options in [docker-compose](./docker-compose.yml):
- `ports`: nginx starts on the default port 80 in the container, and it's up to you to map it to a different host port, if needed (probably)
- `volumes`: 
  - the background image has its own list entry, for better or worse; if it's missing, nothing will break, the site just won't have a background logo
  - but, the album volume has to be mounted from the same source as the cffc-api server, since there's no sane way to share album data (symlinks work, but we're not fond of the idea); if the album setting is wrong/missing, the server handling the `proxy_pass` can still write album data, but the web server won't be able to fetch it
- `environment`: these will be substituted into the `proxy_pass` directives when the server starts; mainly for external services, since, so far, the static things are either copied into the image or shared via a volume

#### Future use:
##### SSL (!important)
##### AuthNZ service
##### Inventory/Order service
