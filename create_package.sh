#!/bin/sh

rm ldrnotifier.xpi
cd ./src
zip -r -9 ../ldrnotifier.xpi .
cd ..
HASH=`shasum -a 512 ldrnotifier.xpi | sed s'/[ ].*$//'`
mv update.rdf update.rdf.bak
sed -e "s/em:updateHash=\".*\"/em:updateHash=\"sha512:$HASH\"/" update.rdf.bak > update.rdf
rm update.rdf.bak
