#!/bin/bash

##############################################################################################################
# This install script will install my NodeJS application.
# It will also set up my connection strings to the the database as environment vars for the application
# to read in
##############################################################################################################

#Trying to avoid weird timing issues here, will revisit
sleep 150

#Get and install the mysql client app so my app can talk to the database
apt-get -y install unzip mysql-client --allow-unauthenticated

#Create and export database connection strings
cat > export_db_credentials.sh <<_END_
#!/usr/bin/env bash

export DB_CONNECTIONSTRING="${SQL_SERVER_NAME}.mysql.database.azure.com"
export DB_USERNAME="${SQL_ADMIN_USER}@${SQL_SERVER_NAME}"
export DB_PASSWORD="${SQL_ADMIN_PASSWORD}"
export DB_NAME=todo

\$@
_END_

cat > sql_schema.sh <<_END_
#!/usr/bin/env bash

echo "Configure MySQL schema"
# If MySQL client is not installed, fail!
mysql -h "${SQL_SERVER_NAME}.mysql.database.azure.com" -p"${SQL_ADMIN_PASSWORD}" -u "${SQL_ADMIN_USER}@${SQL_SERVER_NAME}" < schema_fudged.sql

\$@
_END_

cat > schema.sql <<_END_
CREATE DATABASE IF NOT EXISTS todo;

USE todo;

CREATE TABLE IF NOT EXISTS |todo| (
  |_id|   int NOT NULL AUTO_INCREMENT,
  |text| varchar(256) NOT NULL,
  PRIMARY KEY(|_id|)
);
_END_

cat > app_install.sh <<_END_
#!/bin/bash

#Check if app directory exists, if it doesn't create it
if [ -d "/app" ]; then
  rm -rf /app/*
else
  mkdir /app
fi

# Unzip the deployment package into the app directory
unzip ./package.zip -d /app
chmod 640 /app/server.js
sleep 15
cp export_db_credentials.sh /app
(cd /app ; npm install)

# Install Todo list SystemD service
install -v -C \
	--owner root \
	--group root \
	--mode 0400 \
	todolist.service /etc/systemd/system/todolist.service

# Reload systemctl to read new systemd service
systemctl daemon-reload

# Starting App
service todolist start
_END_

cat > todolist.service <<_END_
[Unit]
Description=Todo list Server

[Service]
Environment=USE_LOG_FILE=true
WorkingDirectory=/app/
ExecStart=/app/export_db_credentials.sh node /app/server.js
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog

[Install]
WantedBy=multi-user.target
_END_

chmod +x export_db_credentials.sh
chmod +x sql_schema.sh
chmod +x app_install.sh

#hack to make the above work proper like
sed s/\|/\`/g schema.sql > schema_fudged.sql

./export_db_credentials.sh
./sql_schema.sh
./app_install.sh