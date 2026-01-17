#!/bin/sh

# Replace environment variables in config template
# Use a temporary file to avoid reading and writing to the same file if something goes wrong
# and to ensure config.json is only updated if config.template.json exists
if [ -f /usr/share/nginx/html/config.template.json ]; then
  envsubst '${API_URL} ${ENVIRONMENT}' < /usr/share/nginx/html/config.template.json > /usr/share/nginx/html/config.json
fi

# Start nginx
exec "$@"
