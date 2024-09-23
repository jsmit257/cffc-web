.PHONY: down
down:
	docker-compose down
	
.PHONY: build
build: down
	docker-compose build cffc-web

.PHONY: run
run: build
	docker-compose up --remove-orphans -d cffc-web
	docker tag cffc-web:latest jsmit257/cffc-web:lkg
