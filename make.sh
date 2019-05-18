#!/bin/sh -x
rm -f title-with-progress.zip
zip -r title-with-progress.zip . -x '*.git*' -x '*.swp' -x 'make.sh' -x 'index.html'
