WCEVERSION=$(shell grep "var wfce_editor" wce-ote/plugin/plugin.js | cut -f2 -d\"|sed 's/[-()]//g'|sed 's/ /-/g')
NOW=$(shell date "+%Y%m%d")
VERSION=${WCEVERSION}.b${NOW}
TARBALL=wce-ote-${VERSION}.tar.gz
ZIPFILE=wce-ote-${VERSION}.zip
TINYRELEASE=$(shell ls tinymce_*_dev.zip)

all: install

install: js

test: node_modules install
	npm test

release: install
	rm -f ${TARBALL}
	tar czfv ${TARBALL} `ls -ad *|grep -v node_modules|grep -v tar.gz|grep -v .zip`

clean:
	rm -rf wce-ote-*.tar.gz wce-ote*.zip
	rm -rf js/
	rm -rf TinyMCE-LICENSE.TXT
	rm -rf TinyMCE-readme.md
	rm -rf TinyMCE-changelog.txt

node_modules: package.json
	npm install

js: ${TINYRELEASE}
	unzip ${TINYRELEASE}
	mv tinymce/js .
	mv tinymce/readme.md TinyMCE-readme.md
	mv tinymce/LICENSE.TXT TinyMCE-LICENSE.TXT
	mv tinymce/changelog.txt TinyMCE-changelog.txt
	rm -rf tinymce
	unzip tinymce_languages.zip
	mv langs/* js/tinymce/langs
	rmdir langs
