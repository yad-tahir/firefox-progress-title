#!/bin/sh

rm -f title-with-progress.zip 2> /dev/null
zip -r title-with-progress.zip . -x '*.git*' -x '*.swp' -x 'make.sh' -x 'index.html'
