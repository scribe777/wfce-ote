VERSION=$(shell grep "var wfce_editor" wce-ote/plugin/plugin.js | cut -f2 -d\"|sed 's/[-()]//g'|sed 's/ /-/g')
TARBALL=wce-ote-${VERSION}.tar.gz
ZIPFILE=wce-ote-${VERSION}.zip

unpack: clean
	unzip tinymce_*_dev.zip
	mv tinymce/* tinymce/.??* .
	rmdir tinymce
	unzip tinymce_languages.zip
	mv langs/* js/tinymce/langs
	rmdir langs

release: unpack
	rm -f ${TARBALL}
	tar czfv ${TARBALL} `ls -ad *|grep -v tar.gz|grep -v .zip`

clean:
	rm -rf `ls -ad * .??*|grep -v LICENSE|grep -v __tests__|grep -v package-lock.json|grep -v package.json|grep -v wce-ote|grep -v .zip|grep -v Makefile |grep -v .git|grep -v README|grep -v tinymce_languages.zip`
	rm -rf *.tar.gz
