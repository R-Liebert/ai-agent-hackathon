#!/bin/sh

htmlFolder="/usr/share/nginx/html"
envFileName="env.js"
rm -f $htmlFolder/$envFileName

sed -i "s/@buildVersion/$BUILD_VERSION/" $htmlFolder/$APP_ENVIRONMENT.js
sed -i "s/@releaseVersion/$RELEASE_VERSION/" $htmlFolder/$APP_ENVIRONMENT.js


mv $htmlFolder/$APP_ENVIRONMENT.js $htmlFolder/$envFileName

exec "$@"