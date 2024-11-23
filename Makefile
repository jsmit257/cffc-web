.PHONY: down
down:
	docker-compose down -t5
	
.PHONY: build
build: down
	docker-compose build cffc-web

# requires:
# - AUTHN_HOST
# - AUTHN_PORT
# - CFFC_API_HOST
# - CFFC_API_PORT
.PHONY: run
run: build
	docker-compose up --build --remove-orphans -d cffc-web
	docker tag jsmit257/cffc-web:latest jsmit257/cffc-web:lkg

.PHONY: push
push:
	docker push jsmit257/cffc-web:lkg