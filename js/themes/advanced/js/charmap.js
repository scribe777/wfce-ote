/** 
	Copyright (C) 2012-2014 Center for Digital Humanities, Trier
	
	This file is part of the Online Transcription Editor (OTE).

    OTE is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 2.1 of the License, or
    (at your option) any later version.

    OTE is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with OTE.  If not, see <http://www.gnu.org/licenses/>.

    Diese Datei ist Teil des Online-Transkriptions-Editor (OTE).

    OTE ist Freie Software: Sie können es unter den Bedingungen
    der GNU Lesser General Public License, wie von der Free Software Foundation,
    Version 2.1 der Lizenz oder (nach Ihrer Wahl) jeder späteren
    veröffentlichten Version, weiterverbreiten und/oder modifizieren.

    OTE wird in der Hoffnung, dass es nützlich sein wird, aber
    OHNE JEDE GEWÄHRLEISTUNG, bereitgestellt; sogar ohne die implizite
    Gewährleistung der MARKTFÄHIGKEIT oder EIGNUNG FÜR EINEN BESTIMMTEN ZWECK.
    Siehe die GNU Lesser General Public License für weitere Details.

    Sie sollten eine Kopie der GNU Lesser General Public License zusammen mit diesem
    Programm erhalten haben. Wenn nicht, siehe <http://www.gnu.org/licenses/>.
*/
/**
 * charmap.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

tinyMCEPopup.requireLangPack();
var cmap;
var charmap_greek = [
	['&nbsp;',    '&#160;',  false, 'no-break space'],
	['&amp;',     '&#38;',   false, 'ampersand'],
	['&quot;',    '&#34;',   false, 'quotation mark'],
// finance
	['&cent;',    '&#162;',  false, 'cent sign'],
	['&euro;',    '&#8364;', false, 'euro sign'],
	['&pound;',   '&#163;',  false, 'pound sign'],
	['&yen;',     '&#165;',  false, 'yen sign'],
// signs
	['&copy;',    '&#169;',  false, 'copyright sign'],
	['&reg;',     '&#174;',  false, 'registered sign'],
	['&trade;',   '&#8482;', false, 'trade mark sign'],
	['&permil;',  '&#8240;', false, 'per mille sign'],
	['&micro;',   '&#181;',  false, 'micro sign'],
	['&middot;',  '&#183;',  false, 'middle dot'],
	['&bull;',    '&#8226;', false, 'bullet'],
	['&hellip;',  '&#8230;', false, 'three dot leader'],
	['&prime;',   '&#8242;', false, 'minutes / feet'],
	['&Prime;',   '&#8243;', false, 'seconds / inches'],
	['&sect;',    '&#167;',  false, 'section sign'],
	['&para;',    '&#182;',  false, 'paragraph sign'],
	['&szlig;',   '&#223;',  false, 'sharp s / ess-zed'],
// quotations
	['&lsaquo;',  '&#8249;', false, 'single left-pointing angle quotation mark'],
	['&rsaquo;',  '&#8250;', false, 'single right-pointing angle quotation mark'],
	['&laquo;',   '&#171;',  false, 'left pointing guillemet'],
	['&raquo;',   '&#187;',  false, 'right pointing guillemet'],
	['&lsquo;',   '&#8216;', false, 'left single quotation mark'],
	['&rsquo;',   '&#8217;', false, 'right single quotation mark'],
	['&ldquo;',   '&#8220;', false, 'left double quotation mark'],
	['&rdquo;',   '&#8221;', false, 'right double quotation mark'],
	['&sbquo;',   '&#8218;', false, 'single low-9 quotation mark'],
	['&bdquo;',   '&#8222;', false, 'double low-9 quotation mark'],
	['&lt;',      '&#60;',   false, 'less-than sign'],
	['&gt;',      '&#62;',   false, 'greater-than sign'],
	['&le;',      '&#8804;', false, 'less-than or equal to'],
	['&ge;',      '&#8805;', false, 'greater-than or equal to'],
	['&ndash;',   '&#8211;', false, 'en dash'],
	['&mdash;',   '&#8212;', false, 'em dash'],
	['&macr;',    '&#175;',  false, 'macron'],
	['&oline;',   '&#8254;', false, 'overline'],
	['&curren;',  '&#164;',  false, 'currency sign'],
	['&brvbar;',  '&#166;',  false, 'broken bar'],
	['&uml;',     '&#168;',  false, 'diaeresis'],
	['&iexcl;',   '&#161;',  false, 'inverted exclamation mark'],
	['&iquest;',  '&#191;',  false, 'turned question mark'],
	['&circ;',    '&#710;',  false, 'circumflex accent'],
	['&tilde;',   '&#732;',  false, 'small tilde'],
	['&deg;',     '&#176;',  false, 'degree sign'],
	['&minus;',   '&#8722;', false, 'minus sign'],
	['&plusmn;',  '&#177;',  false, 'plus-minus sign'],
	['&divide;',  '&#247;',  false, 'division sign'],
	['&frasl;',   '&#8260;', false, 'fraction slash'],
	['&times;',   '&#215;',  false, 'multiplication sign'],
	['&sup1;',    '&#185;',  false, 'superscript one'],
	['&sup2;',    '&#178;',  false, 'superscript two'],
	['&sup3;',    '&#179;',  false, 'superscript three'],
	['&frac14;',  '&#188;',  false, 'fraction one quarter'],
	['&frac12;',  '&#189;',  false, 'fraction one half'],
	['&frac34;',  '&#190;',  false, 'fraction three quarters'],
// math / logical
	['&fnof;',    '&#402;',  false, 'function / florin'],
	['&int;',     '&#8747;', false, 'integral'],
	['&sum;',     '&#8721;', false, 'n-ary sumation'],
	['&infin;',   '&#8734;', false, 'infinity'],
	['&radic;',   '&#8730;', false, 'square root'],
	['&sim;',     '&#8764;', false,'similar to'],
	['&cong;',    '&#8773;', false,'approximately equal to'],
	['&asymp;',   '&#8776;', false, 'almost equal to'],
	['&ne;',      '&#8800;', false, 'not equal to'],
	['&equiv;',   '&#8801;', false, 'identical to'],
	['&isin;',    '&#8712;', false,'element of'],
	['&notin;',   '&#8713;', false,'not an element of'],
	['&ni;',      '&#8715;', false,'contains as member'],
	['&prod;',    '&#8719;', false, 'n-ary product'],
	['&and;',     '&#8743;', false,'logical and'],
	['&or;',      '&#8744;', false,'logical or'],
	['&not;',     '&#172;',  false, 'not sign'],
	['&cap;',     '&#8745;', false, 'intersection'],
	['&cup;',     '&#8746;', false,'union'],
	['&part;',    '&#8706;', false, 'partial differential'],
	['&forall;',  '&#8704;', false,'for all'],
	['&exist;',   '&#8707;', false,'there exists'],
	['&empty;',   '&#8709;', false,'diameter'],
	['&nabla;',   '&#8711;', false,'backward difference'],
	['&lowast;',  '&#8727;', false,'asterisk operator'],
	['&prop;',    '&#8733;', false,'proportional to'],
	['&ang;',     '&#8736;', false,'angle'],
// undefined
	['&acute;',   '&#180;',  false, 'acute accent'],
	['&cedil;',   '&#184;',  false, 'cedilla'],
	['&ordf;',    '&#170;',  false, 'feminine ordinal indicator'],
	['&ordm;',    '&#186;',  false, 'masculine ordinal indicator'],
	['&dagger;',  '&#8224;', false, 'dagger'],
	['&Dagger;',  '&#8225;', false, 'double dagger'],
// Greek letters
    ['&Alpha;',   '&#913;',  true, 'Alpha'],
	['&Beta;',    '&#914;',  true, 'Beta'],
	['&Gamma;',   '&#915;',  true, 'Gamma'],
	['&Delta;',   '&#916;',  true, 'Delta'],
	['&Epsilon;', '&#917;',  true, 'Epsilon'],
	['&Zeta;',    '&#918;',  true, 'Zeta'],
	['&Eta;',     '&#919;',  true, 'Eta'],
	['&Theta;',   '&#920;',  true, 'Theta'],
	['&Iota;',    '&#921;',  true, 'Iota'],
	['&Kappa;',   '&#922;',  true, 'Kappa'],
	['&Lambda;',  '&#923;',  true, 'Lambda'],
	['&Mu;',      '&#924;',  true, 'Mu'],
	['&Nu;',      '&#925;',  true, 'Nu'],
	['&Xi;',      '&#926;',  true, 'Xi'],
	['&Omicron;', '&#927;',  true, 'Omicron'],
	['&Pi;',      '&#928;',  true, 'Pi'],
	['&Rho;',     '&#929;',  true, 'Rho'],
	['&Sigma;',   '&#931;',  true, 'Sigma'],
	['&Tau;',     '&#932;',  true, 'Tau'],
	['&Upsilon;', '&#933;',  true, 'Upsilon'],
	['&Phi;',     '&#934;',  true, 'Phi'],
	['&Chi;',     '&#935;',  true, 'Chi'],
	['&Psi;',     '&#936;',  true, 'Psi'],
	['&Omega;',   '&#937;',  true, 'Omega'],
	['&alpha;',   '&#945;',  true, 'alpha'],
	['&beta;',    '&#946;',  true, 'beta'],
	['&gamma;',   '&#947;',  true, 'gamma'],
	['&delta;',   '&#948;',  true, 'delta'],
	['&epsilon;', '&#949;',  true, 'epsilon'],
	['&zeta;',    '&#950;',  true, 'zeta'],
	['&eta;',     '&#951;',  true, 'eta'],
	['&theta;',   '&#952;',  true, 'theta'],
	['&iota;',    '&#953;',  true, 'iota'],
	['&kappa;',   '&#954;',  true, 'kappa'],
	['&lambda;',  '&#955;',  true, 'lambda'],
	['&mu;',      '&#956;',  true, 'mu'],
	['&nu;',      '&#957;',  true, 'nu'],
	['&xi;',      '&#958;',  true, 'xi'],
	['&omicron;', '&#959;',  true, 'omicron'],
	['&pi;',      '&#960;',  true, 'pi'],
	['&rho;',     '&#961;',  true, 'rho'],
	['&sigmaf;',  '&#962;',  true, 'final sigma'],
	['&sigma;',   '&#963;',  true, 'sigma'],
	['&tau;',     '&#964;',  true, 'tau'],
	['&upsilon;', '&#965;',  true, 'upsilon'],
	['&phi;',     '&#966;',  true, 'phi'],
	['&chi;',     '&#967;',  true, 'chi'],
	['&psi;',     '&#968;',  true, 'psi'],
	['&omega;',   '&#969;',  true, 'omega'],
// symbols
	['&alefsym;', '&#8501;', false,'alef symbol'],
	['&piv;',     '&#982;',  false,'pi symbol'],
	['&real;',    '&#8476;', false,'real part symbol'],
	['&thetasym;','&#977;',  false,'theta symbol'],
	['&upsih;',   '&#978;',  false,'upsilon - hook symbol'],
	['&weierp;',  '&#8472;', false,'Weierstrass p'],
	['&image;',   '&#8465;', false,'imaginary part'],
// arrows
	['&larr;',    '&#8592;', false, 'leftwards arrow'],
	['&uarr;',    '&#8593;', false, 'upwards arrow'],
	['&rarr;',    '&#8594;', false, 'rightwards arrow'],
	['&darr;',    '&#8595;', false, 'downwards arrow'],
	['&harr;',    '&#8596;', false, 'left right arrow'],
	['&crarr;',   '&#8629;', false,'carriage return'],
	['&lArr;',    '&#8656;', false,'leftwards double arrow'],
	['&uArr;',    '&#8657;', false,'upwards double arrow'],
	['&rArr;',    '&#8658;', false,'rightwards double arrow'],
	['&dArr;',    '&#8659;', false,'downwards double arrow'],
	['&hArr;',    '&#8660;', false,'left right double arrow'],
	['&there4;',  '&#8756;', false,'therefore'],
	['&sub;',     '&#8834;', false,'subset of'],
	['&sup;',     '&#8835;', false,'superset of'],
	['&nsub;',    '&#8836;', false,'not a subset of'],
	['&sube;',    '&#8838;', false,'subset of or equal to'],
	['&supe;',    '&#8839;', false,'superset of or equal to'],
	['&oplus;',   '&#8853;', false,'circled plus'],
	['&otimes;',  '&#8855;', false,'circled times'],
	['&perp;',    '&#8869;', false,'perpendicular'],
	['&sdot;',    '&#8901;', false,'dot operator'],
	['&lceil;',   '&#8968;', false,'left ceiling'],
	['&rceil;',   '&#8969;', false,'right ceiling'],
	['&lfloor;',  '&#8970;', false,'left floor'],
	['&rfloor;',  '&#8971;', false,'right floor'],
	['&lang;',    '&#9001;', false,'left-pointing angle bracket'],
	['&rang;',    '&#9002;', false,'right-pointing angle bracket'],
	['&loz;',     '&#9674;', false,'lozenge'],
	['&spades;',  '&#9824;', false,'black spade suit'],
	['&clubs;',   '&#9827;', false, 'black club suit'],
	['&hearts;',  '&#9829;', false, 'black heart suit'],
	['&diams;',   '&#9830;', false, 'black diamond suit'],
	['&ensp;',    '&#8194;', false,'en space'],
	['&emsp;',    '&#8195;', false,'em space'],
	['&thinsp;',  '&#8201;', false,'thin space'],
	['&zwnj;',    '&#8204;', false,'zero width non-joiner'],
	['&zwj;',     '&#8205;', false,'zero width joiner'],
	['&lrm;',     '&#8206;', false,'left-to-right mark'],
	['&rlm;',     '&#8207;', false,'right-to-left mark'],
	['&shy;',     '&#173;',  false,'soft hyphen'],
// Greek accented letters
	['',		'&#902;', true, ''],
	['',		'&#903;', true, ''],
	['',		'&#904;', true, ''],
	['',		'&#905;', true, ''],
	['',		'&#906;', true, ''],
    ['',		'&#907;', false, ''],
	['',		'&#908;', true, ''],
	['',		'&#909;', false, ''],
	['',		'&#910;', true, ''],
	['',		'&#911;', true, ''],
	['',		'&#912;', true, ''],

// Greek Extended Block of Unicode
	['',		'&#7936;', true, 'alpha with psili'],
	['',		'&#7937;', true, 'alpha with dasia'],
	['',		'&#7938;', true, 'alpha with psili and varia'],
	['',		'&#7939;', true, 'alpha with dasia and varia'],
	['',		'&#7940;', true, 'alpha with psili and oxia'],
	['',		'&#7941;', true, 'alpha with dasia and oxia'],
	['',		'&#7942;', true, 'alpha with psili and perispomeni'],
	['',		'&#7943;', true, 'alpha with dasia and perispomeni'],
	['',		'&#7944;', true, 'alpha with psili'],
	['',		'&#7945;', true, 'alpha with dasia'],
	['',		'&#7946;', true, 'alpha with psili and varia'],
	['',		'&#7947;', true, 'alpha with dasia and varia'],
	['',		'&#7948;', true, 'alpha with psili and oxia'],		
	['',		'&#7949;', true, 'alpha with dasia and oxia'],
	['',		'&#7950;', true, 'alpha with psili and perispomeni'],
	['',		'&#7951;', true, 'alpha with dasia and perispomeni'],
	['',		'&#7952;', true, 'epsilon with psili'],
	['',		'&#7953;', true, 'epsilon with dasia'],
	['',		'&#7954;', true, 'epsilon with psili and varia'],
	['',		'&#7955;', true, 'epsilon with dasia and varia'],
	['',		'&#7956;', true, 'epsilon with psili and oxia'],
	['',		'&#7957;', true, 'epsilon with dasia and oxia'],
	['',		'&#7960;', true, 'epsilon with psili'],
	['',		'&#7961;', true, 'epsilon with dasia'],
	['',		'&#7962;', true, 'epsilon with psili and varia'],
	['',		'&#7963;', true, 'epsilon with dasia and varia'],
	['',		'&#7964;', true, 'epsilon with psili and oxia'],
	['',		'&#7965;', true, 'epsilon with dasia and oxia'],
	['',		'&#7968;', true, 'eta with psili'],
	['',		'&#7969;', true, 'eta with dasia'],
	['',		'&#7970;', true, 'eta with psili and varia'],
	['',		'&#7971;', true, 'eta with dasia and varia'],
	['',		'&#7972;', true, 'eta with psili and oxia'],
	['',		'&#7973;', true, 'eta with dasia and oxia'],
	['',		'&#7974;', true, 'eta with psili and perispomeni'],
	['',		'&#7975;', true, 'eta with dasia and perispomeni'],
	['',		'&#7976;', true, 'eta with psili'],
	['',		'&#7977;', true, 'eta with dasia'],
	['',		'&#7978;', true, 'eta with psili and varia'],
	['',		'&#7979;', true, 'eta with dasia and varia'],
	['',		'&#7980;', true, 'eta with psili and oxia'],
	['',		'&#7981;', true, 'eta with dasia and oxia'],
	['',		'&#7982;', true, 'eta with psili and perispomeni'],
	['',		'&#7983;', true, 'eta with dasia and perispomeni'],
	['',		'&#7984;', true, 'iota with psili'],
	['',		'&#7985;', true, 'iota with dasia'],
	['',		'&#7986;', true, 'iota with psili and varia'],
	['',		'&#7987;', true, 'iota with dasia and varia'],
	['',		'&#7988;', true, 'iota with psili and oxia'],
	['',		'&#7989;', true, 'iota with dasia and oxia'],
	['',		'&#7990;', true, 'iota with psili and perispomeni'],
	['',		'&#7991;', true, 'iota with dasia and perispomeni'],
	['',		'&#7992;', true, 'iota with psili'],
	['',		'&#7993;', true, 'iota with dasia'],
	['',		'&#7994;', true, 'iota with psili and varia'],
	['',		'&#7995;', true, 'iota with dasia and varia'],
	['',		'&#7996;', true, 'iota with psili and oxia'],
	['',		'&#7997;', true, 'iota with dasia and oxia'],
	['',		'&#7998;', true, 'iota with psili and perispomeni'],
	['',		'&#7999;', true, 'iota with dasia and perispomeni'],
	['',		'&#8000;', true, 'omicron with psili'],
	['',		'&#8001;', true, 'omicron with dasia'],
	['',		'&#8002;', true, 'omicron with psili and varia'],
	['',		'&#8003;', true, 'omicron with dasia and varia'],
	['',		'&#8004;', true, 'omicron with psili and oxia'],
	['',		'&#8005;', true, 'omicron with dasia and oxia'],
	['',		'&#8008;', true, 'omicron with psili'],
	['',		'&#8009;', true, 'omicron with dasia'],
	['',		'&#8010;', true, 'omicron with psili and varia'],
	['',		'&#8011;', true, 'omicron with dasia and varia'],
	['',		'&#8012;', true, 'omicron with psili and oxia'],
	['',		'&#8013;', true, 'omicron with dasia and oxia'],
	['',		'&#8016;', true, 'upsilon with psili'],
	['',		'&#8017;', true, 'upsilon with dasia'],
	['',		'&#8018;', true, 'upsilon with psili and varia'],
	['',		'&#8019;', true, 'upsilon with dasia and varia'],
	['',		'&#8020;', true, 'upsilon with psili and oxia'],
	['',		'&#8021;', true, 'upsilon with dasia and oxia'],
	['',		'&#8022;', true, 'upsilon with psili and perispomeni'],
	['',		'&#8023;', true, 'upsilon with dasia and perispomeni'],
	['',		'&#8025;', true, 'upsilon with dasia'],
	['',		'&#8027;', true, 'upsilon with dasia and varia'],
	['',		'&#8029;', true, 'upsilon with dasia and oxia'],
	['',		'&#8031;', true, 'upsilon with dasia and perispomeni'],
	['',		'&#8032;', true, 'omega with psili'],
	['',		'&#8033;', true, 'omega with dasia'],
	['',		'&#8034;', true, 'omega with psili and varia'],
	['',		'&#8035;', true, 'omega with dasia and varia'],
	['',		'&#8036;', true, 'omega with psili and oxia'],
	['',		'&#8037;', true, 'omega with dasia and oxia'],
['', '&#8038;', true, 'omega with psili and perispomeni'],
['', '&#8039;', true, 'omega with dasia and perispomeni'],
['', '&#8040;', true, 'omega with psili'],
['', '&#8041;', true, 'omega with dasia'],
['', '&#8042;', true, 'omega with psili and varia'],
['', '&#8043;', true, 'omega with dasia and varia'],
['', '&#8044;', true, 'omega with psili and oxia'],
['', '&#8045;', true, 'omega with dasia and oxia'],
['', '&#8046;', true, 'omega with psili and perispomeni'],
['', '&#8047;', true, 'omega with dasia and perispomeni'],
['', '&#8048;', true, 'alpha with varia'],
['', '&#8049;', true, 'alpha with oxia'],
['', '&#8050;', true, 'epsilon with varia'],
['', '&#8051;', true, 'epsilon with oxia'],
['', '&#8052;', true, 'eta with varia'],
['', '&#8053;', true, 'eta with oxia'],
['', '&#8054;', true, 'iota with varia'],
['', '&#8055;', true, 'iota with oxia'],
['', '&#8056;', true, 'omicron with varia'],
['', '&#8057;', true, 'omicron with oxia'],
['', '&#8058;', true, 'upsilon with varia'],
['', '&#8059;', true, 'upsilon with oxia'],
['', '&#8060;', true, 'omega with varia'],
['', '&#8061;', true, 'omega with oxia'],
['', '&#8064;', true, 'alpha with psili and ypogegrammeni'],
['', '&#8065;', true, 'alpha with dasia and ypogegrammeni'],
['', '&#8066;', true, 'alpha with psili and varia and ypogegrammeni'],
['', '&#8067;', true, 'alpha with dasia and varia and ypogegrammeni'],
['', '&#8068;', true, 'alpha with psili and oxia and ypogegrammeni'],
['', '&#8069;', true, 'alpha with dasia and oxia and ypogegrammeni'],
['', '&#8070;', true, 'alpha with psili and perispomeni and ypogegrammeni'],
['', '&#8071;', true, 'alpha with dasia and perispomeni and ypogegrammeni'],
['', '&#8072;', true, 'alpha with psili and prosgegrammeni'],
['', '&#8073;', true, 'alpha with dasia and prosgegrammeni'],
['', '&#8074;', true, 'alpha with psili and varia and prosgegrammeni'],
['', '&#8075;', true, 'alpha with dasia and varia and prosgegrammeni'],
['', '&#8076;', true, 'alpha with psili and oxia and prosgegrammeni'],
['', '&#8077;', true, 'alpha with dasia and oxia and prosgegrammeni'],
['', '&#8078;', true, 'alpha with psili and perispomeni and prosgegrammeni'],
['', '&#8079;', true, 'alpha with dasia and perispomeni and prosgegrammeni'],
['', '&#8080;', true, 'eta with psili and ypogegrammeni'],
['', '&#8081;', true, 'eta with dasia and ypogegrammeni'],
['', '&#8082;', true, 'eta with psili and varia and ypogegrammeni'],
['', '&#8083;', true, 'eta with dasia and varia and ypogegrammeni'],
['', '&#8084;', true, 'eta with psili and oxia and ypogegrammeni'],
['', '&#8085;', true, 'eta with dasia and oxia and ypogegrammeni'],
['', '&#8086;', true, 'eta with psili and perispomeni and ypogegrammeni'],
['', '&#8087;', true, 'eta with dasia and perispomeni and ypogegrammeni'],
['', '&#8088;', true, 'eta with psili and prosgegrammeni'],
['', '&#8089;', true, 'eta with dasia and prosgegrammeni'],
['', '&#8090;', true, 'eta with psili and varia and prosgegrammeni'],
['', '&#8091;', true, 'eta with dasia and varia and prosgegrammeni'],
['', '&#8092;', true, 'eta with psili and oxia and prosgegrammeni'],
['', '&#8093;', true, 'eta with dasia and oxia and prosgegrammeni'],
['', '&#8094;', true, 'eta with psili and perispomeni and prosgegrammeni'],
['', '&#8095;', true, 'eta with dasia and perispomeni and prosgegrammeni'],
['', '&#8096;', true, 'omega with psili and ypogegrammeni'],
['', '&#8097;', true, 'omega with dasia and ypogegrammeni'],
['', '&#8098;', true, 'omega with psili and varia and ypogegrammeni'],
['', '&#8099;', true, 'omega with dasia and varia and ypogegrammeni'],
['', '&#8100;', true, 'omega with psili and oxia and ypogegrammeni'],
['', '&#8101;', true, 'omega with dasia and oxia and ypogegrammeni'],
['', '&#8102;', true, 'omega with psili and perispomeni and ypogegrammeni'],
['', '&#8103;', true, 'omega with dasia and perispomeni and ypogegrammeni'],
['', '&#8104;', true, 'omega with psili and prosgegrammeni'],
['', '&#8105;', true, 'omega with dasia and prosgegrammeni'],
['', '&#8106;', true, 'omega with psili and varia and prosgegrammeni'],
['', '&#8107;', true, 'omega with dasia and varia and prosgegrammeni'],
['', '&#8108;', true, 'omega with psili and oxia and prosgegrammeni'],
['', '&#8109;', true, 'omega with dasia and oxia and prosgegrammeni'],
['', '&#8110;', true, 'omega with psili and perispomeni and prosgegrammeni'],
['', '&#8111;', true, 'omega with dasia and perispomeni and prosgegrammeni'],
['', '&#8112;', true, 'alpha with vrachy'],
['', '&#8113;', true, 'alpha with macron'],
['', '&#8114;', true, 'alpha with varia and ypogegrammeni'],
['', '&#8115;', true, 'alpha with ypogegrammeni'],
['', '&#8116;', true, 'alpha with oxia and ypogegrammeni'],
['', '&#8118;', true, 'alpha with perispomeni'],
['', '&#8119;', true, 'alpha with perispomeni and ypogegrammeni'],
['', '&#8120;', true, 'alpha with vrachy'],
['', '&#8121;', true, 'alpha with macron'],
['', '&#8122;', true, 'alpha with varia'],
['', '&#8123;', true, 'alpha with oxia'],
['', '&#8124;', true, 'alpha with prosgegrammeni'],
['', '&#8125;', true, 'greek koronis'],
['', '&#8126;', true, 'greek prosgegrammeni'],
['', '&#8127;', true, 'greek psili'],
['', '&#8128;', true, 'greek perispomeni'],
['', '&#8129;', true, 'greek dialytika and perispomeni'],
['', '&#8130;', true, 'eta with varia and ypogegrammeni'],
['', '&#8131;', true, 'eta with ypogegrammeni'],
['', '&#8132;', true, 'eta with oxia and ypogegrammeni'],
['', '&#8134;', true, 'eta with perispomeni'],
['', '&#8135;', true, 'eta with perispomeni and ypogegrammeni'],
['', '&#8136;', true, 'epsilon with varia'],
['', '&#8137;', true, 'epsilon with oxia'],
['', '&#8138;', true, 'eta with varia'],
['', '&#8139;', true, 'eta with oxia'],
['', '&#8140;', true, 'eta with prosgegrammeni'],
['', '&#8141;', true, 'greek psili and varia'],
['', '&#8142;', true, 'greek psili and oxia'],
['', '&#8143;', true, 'greek psili and perispomeni'],
['', '&#8144;', true, 'iota with vrachy'],
['', '&#8145;', true, 'iota with macron'],
['', '&#8146;', true, 'iota with dialytika and varia'],
['', '&#8147;', true, 'iota with dialytika and oxia'],
['', '&#8150;', true, 'iota with perispomeni'],
['', '&#8151;', true, 'iota with dialytika and perispomeni'],
['', '&#8152;', true, 'iota with vrachy'],
['', '&#8153;', true, 'iota with macron'],
['', '&#8154;', true, 'iota with varia'],
['', '&#8155;', true, 'iota with oxia'],
['', '&#8157;', true, 'dasia and varia'],
['', '&#8158;', true, 'dasia and oxia'],
['', '&#8159;', true, 'dasia and perispomeni'],
['', '&#8160;', true, 'upsilon with vrachy'],
['', '&#8161;', true, 'upsilon with macron'],
['', '&#8162;', true, 'upsilon with dialytika and varia'],
['', '&#8163;', true, 'upsilon with dialytika and oxia'],
['', '&#8164;', true, 'rho with psili'],
['', '&#8165;', true, 'rho with dasia'],
['', '&#8166;', true, 'upsilon with perispomeni'],
['', '&#8167;', true, 'upsilon with dialytika and perispomeni'],
['', '&#8168;', true, 'upsilon with vrachy'],
['', '&#8169;', true, 'upsilon with macron'],
['', '&#8170;', true, 'upsilon with varia'],
['', '&#8171;', true, 'upsilon with oxia'],
['', '&#8172;', true, 'rho with dasia'],
['', '&#8173;', true, 'dialytika and varia'],
['', '&#8174;', true, 'dialytika and oxia'],
['', '&#8175;', true, 'varia'],
['', '&#8178;', true, 'omega with varia and ypogegrammeni'],
['', '&#8179;', true, 'omega with ypogegrammeni'],
['', '&#8180;', true, 'omega with oxia and ypogegrammeni'],
['', '&#8182;', true, 'omega with perispomeni'],
['', '&#8183;', true, 'omega with perispomeni and ypogegrammeni'],
['', '&#8184;', true, 'omicron with varia'],
['', '&#8185;', true, 'omicron with oxia'],
['', '&#8186;', true, 'omega with varia'],
['', '&#8187;', true, 'omega with oxia'],
['', '&#8188;', true, 'omega with prosgegrammeni'],
['', '&#8189;', true, 'oxia'],
['', '&#8190;', true, 'dasia'],
// WCE Greek
	['&betav;',    '&#976;',  true,'beta symbol'],
	['&thetav;',   '&#977;',  true,'theta symbol'],
	['&upsih;',    '&#978;',  false,'upsilon - hook symbol'],
	['&phiv;',     '&#981;',  true,'phi symbol'],
	['&piv;',      '&#982;',  true,'pi symbol'],
	['&kaiv;',     '&#983;',  true,'kai symbol'],
	['&#984;',     '&#984;',  true,'Archaic Koppa'],
	['&#985;',     '&#985;',  true,'Archaic koppa'],
	['&#986;',     '&#986;',  true,'Stigma'],
	['&#987;',     '&#987;',  true,'stigma'],
	
	['&#988;',     '&#988;',  true,'Digamma'],
	['&#989;',     '&#989;',  true,'digamma'],
	['&#993;',     '&#993;',  true,'sampi'],
	['&#992;',     '&#992;',  true,'Sampi'],
	['&#1015;',    '&#1015;',  true,'Scho'],
	['&#1016;',    '&#1016;',  true,'scho'],
	['&#990;',     '&#990;',  true,'koppa'],
	['&#991;',     '&#991;',  true,'Koppa'],
];

var charmap_latin = [
	['&nbsp;',    '&#160;',  false, 'no-break space'],
	['&amp;',     '&#38;',   false, 'ampersand'],
	['&quot;',    '&#34;',   false, 'quotation mark'],
// finance
	['&cent;',    '&#162;',  false, 'cent sign'],
	['&euro;',    '&#8364;', false, 'euro sign'],
	['&pound;',   '&#163;',  false, 'pound sign'],
	['&yen;',     '&#165;',  false, 'yen sign'],
// signs
	['&copy;',    '&#169;',  false, 'copyright sign'],
	['&reg;',     '&#174;',  false, 'registered sign'],
	['&trade;',   '&#8482;', false, 'trade mark sign'],
	['&permil;',  '&#8240;', false, 'per mille sign'],
	['&micro;',   '&#181;',  false, 'micro sign'],
	['&middot;',  '&#183;',  false, 'middle dot'],
	['&bull;',    '&#8226;', false, 'bullet'],
	['&hellip;',  '&#8230;', false, 'three dot leader'],
	['&prime;',   '&#8242;', false, 'minutes / feet'],
	['&Prime;',   '&#8243;', false, 'seconds / inches'],
	['&sect;',    '&#167;',  false, 'section sign'],
	['&para;',    '&#182;',  false, 'paragraph sign'],
	['&szlig;',   '&#223;',  false, 'sharp s / ess-zed'],
// alphabetical special chars
	['&Agrave;',  '&#192;',  true, 'A - grave'],
	['&Aacute;',  '&#193;',  true, 'A - acute'],
	['&Acirc;',   '&#194;',  true, 'A - circumflex'],
	['&Atilde;',  '&#195;',  true, 'A - tilde'],
	['&Auml;',    '&#196;',  true, 'A - diaeresis'],
	['&Aring;',   '&#197;',  true, 'A - ring above'],
	['&AElig;',   '&#198;',  true, 'ligature AE'],
	['&Ccedil;',  '&#199;',  true, 'C - cedilla'],
	['&Egrave;',  '&#200;',  true, 'E - grave'],
	['&Eacute;',  '&#201;',  true, 'E - acute'],
	['&Ecirc;',   '&#202;',  true, 'E - circumflex'],
	['&Euml;',    '&#203;',  true, 'E - diaeresis'],
	['&Igrave;',  '&#204;',  true, 'I - grave'],
	['&Iacute;',  '&#205;',  true, 'I - acute'],
	['&Icirc;',   '&#206;',  true, 'I - circumflex'],
	['&Iuml;',    '&#207;',  true, 'I - diaeresis'],
	['&ETH;',     '&#208;',  true, 'ETH'],
	['&Ntilde;',  '&#209;',  true, 'N - tilde'],
	['&Ograve;',  '&#210;',  true, 'O - grave'],
	['&Oacute;',  '&#211;',  true, 'O - acute'],
	['&Ocirc;',   '&#212;',  true, 'O - circumflex'],
	['&Otilde;',  '&#213;',  true, 'O - tilde'],
	['&Ouml;',    '&#214;',  true, 'O - diaeresis'],
	['&Oslash;',  '&#216;',  true, 'O - slash'],
	['&OElig;',   '&#338;',  true, 'ligature OE'],
	['&Scaron;',  '&#352;',  true, 'S - caron'],
	['&Ugrave;',  '&#217;',  true, 'U - grave'],
	['&Uacute;',  '&#218;',  true, 'U - acute'],
	['&Ucirc;',   '&#219;',  true, 'U - circumflex'],
	['&Uuml;',    '&#220;',  true, 'U - diaeresis'],
	['&Yacute;',  '&#221;',  true, 'Y - acute'],
	['&Yuml;',    '&#376;',  true, 'Y - diaeresis'],
	['&THORN;',   '&#222;',  true, 'THORN'],
	['&agrave;',  '&#224;',  true, 'a - grave'],
	['&aacute;',  '&#225;',  true, 'a - acute'],
	['&acirc;',   '&#226;',  true, 'a - circumflex'],
	['&atilde;',  '&#227;',  true, 'a - tilde'],
	['&auml;',    '&#228;',  true, 'a - diaeresis'],
	['&aring;',   '&#229;',  true, 'a - ring above'],
	['&aelig;',   '&#230;',  true, 'ligature ae'],
	['&ccedil;',  '&#231;',  true, 'c - cedilla'],
	['&egrave;',  '&#232;',  true, 'e - grave'],
	['&eacute;',  '&#233;',  true, 'e - acute'],
	['&ecirc;',   '&#234;',  true, 'e - circumflex'],
	['&euml;',    '&#235;',  true, 'e - diaeresis'],
	['&igrave;',  '&#236;',  true, 'i - grave'],
	['&iacute;',  '&#237;',  true, 'i - acute'],
	['&icirc;',   '&#238;',  true, 'i - circumflex'],
	['&iuml;',    '&#239;',  true, 'i - diaeresis'],
	['&eth;',     '&#240;',  true, 'eth'],
	['&ntilde;',  '&#241;',  true, 'n - tilde'],
	['&ograve;',  '&#242;',  true, 'o - grave'],
	['&oacute;',  '&#243;',  true, 'o - acute'],
	['&ocirc;',   '&#244;',  true, 'o - circumflex'],
	['&otilde;',  '&#245;',  true, 'o - tilde'],
	['&ouml;',    '&#246;',  true, 'o - diaeresis'],
	['&oslash;',  '&#248;',  true, 'o slash'],
	['&oelig;',   '&#339;',  true, 'ligature oe'],
	['&scaron;',  '&#353;',  true, 's - caron'],
	['&ugrave;',  '&#249;',  true, 'u - grave'],
	['&uacute;',  '&#250;',  true, 'u - acute'],
	['&ucirc;',   '&#251;',  true, 'u - circumflex'],
	['&uuml;',    '&#252;',  true, 'u - diaeresis'],
	['&yacute;',  '&#253;',  true, 'y - acute'],
	['&thorn;',   '&#254;',  true, 'thorn'],
	['&yuml;',    '&#255;',  true, 'y - diaeresis'],
// WCE Abbreviations	
	['&nbar;',     '&#8194&#773;',  true, 'enbar'],
	['&mbar;',     '&#8760;',  true, 'embar'],
	['&ecaud;',    '&#281;',  true, 'e with caudata'],
	['&est;',      '&#247;',  true, 'Abbreviation est'],
	['&autem;',    '&#405;',  true, 'Abbreviation autem'],
	['&enim;',     '&#10746;',  true, 'Abbreviation enim'],
	['&eius;',     '&#601;',  true, 'Abbreviation eius'],
	['&et;',       '&#38;',  true, 'Abbreviation et'],
	['&et7;',      '&#8266;',  true, 'Abbreviation et7'],
	['&paraph;',   '&#182;',  true, 'Paragraph'],
	['&obelos;',   '&#173;',  false, 'soft hyphen'],
	['&diple;',    '&#173;',  false, 'soft hyphen'],
	['&semicolon;','&#59;',  true, 'Semicolon'],
	['&slur;',      '&#865;', true, 'Slur']
];

var charmap_slavistic = [
	['',   '&#x0406;',  true, ''],
	['',   '&#x0407;',  true, ''],
	['',   '&#x042A;',  true, ''],
	['',   '&#x042B;',  true, ''],
	['',   '&#x042C;',  true, ''],
	['',   '&#x042E;',  true, ''],
	['',   '&#x044A;',  true, ''],
	['',   '&#x044B;',  true, ''],
	['',   '&#x044C;',  true, ''],
	['',   '&#x044E;',  true, ''],
	['',   '&#x0460;',  true, ''],
	['',   '&#x0461;',  true, ''],
	['',   '&#x0462;',  true, ''],
	['',   '&#x0463;',  true, ''],
	['',   '&#x0464;',  true, ''],
	['',   '&#x0465;',  true, ''],
	['',   '&#x0466;',  true, ''],
	['',   '&#x0467;',  true, ''],
	['',   '&#x0468;',  true, ''],
	['',   '&#x0469;',  true, ''],
	['',   '&#x046A;',  true, ''],
	['',   '&#x046B;',  true, ''],
	['',   '&#x046C;',  true, ''],
	['',   '&#x046D;',  true, ''],
	['',   '&#x046E;',  true, ''],
	['',   '&#x046F;',  true, ''],
	['',   '&#x0470;',  true, ''],
	['',   '&#x0471;',  true, ''],
	['',   '&#x0472;',  true, ''],
	['',   '&#x0473;',  true, ''],
	['',   '&#x0474;',  true, ''],
	['',   '&#x0475;',  true, ''],
	['',   '&#x0476;',  true, ''],
	['',   '&#x0477;',  true, ''],
	['',   '&#x0478;',  true, ''],
	['',   '&#x0479;',  true, ''],
	['',   '&#x047A;',  true, ''],
	['',   '&#x047B;',  true, ''],
	['',   '&#x047C;',  true, ''],
	['',   '&#x047D;',  true, ''],
	['',   '&#x047E;',  true, ''],
	['',   '&#x047F;',  true, ''],
	['',   '&#x0480;',  true, ''],
	['',   '&#x0481;',  true, ''],
	['',   '&#x0482;',  true, ''],
	['',   '&#x0483;',  true, ''],
	['',   '&#x0484;',  true, ''],
	['',   '&#x0485;',  true, ''],
	['',   '&#x0486;',  true, ''],
	['',   '&#x0487;',  true, ''],
	['',   '&#x0488;',  true, ''],
	['',   '&#x0489;',  true, ''],
	['',   '&#x048A;',  true, ''],
	['',   '&#x048B;',  true, ''],
	['',   '&#x048C;',  true, ''],
	['',   '&#x048D;',  true, ''],
	['',   '&#x04E0;',  true, ''],
	['',   '&#x04E0;',  true, ''],
	['',   '&#x04E1;',  true, ''],
];

tinyMCEPopup.onInit.add(function() { 
	cmap = checkstatus_charmap();
	tinyMCEPopup.dom.setHTML('charmapView', renderCharMapHTML(cmap));
});

function renderCharMapHTML(charmap) {
	var charsPerRow = 20, tdWidth=20, tdHeight=20, i;
	var html = '<table border="0" cellspacing="1" cellpadding="0" width="' + (tdWidth*charsPerRow) + '"><tr height="' + tdHeight + '">';
	var cols=-1;
	

	for (i=0; i<charmap.length; i++) {
		if (charmap[i][2]==true) {
			cols++;
			html += ''
				+ '<td class="charmap" style="font-family:GentiumPlus,Verdana">'
				+ '<a onmouseover="previewChar(\'' + charmap[i][1].substring(1,charmap[i][1].length) + '\',\'' + charmap[i][0].substring(1,charmap[i][0].length) + '\',\'' + charmap[i][3] + '\');" onfocus="previewChar(\'' + charmap[i][1].substring(1,charmap[i][1].length) + '\',\'' + charmap[i][0].substring(1,charmap[i][0].length) + '\',\'' + charmap[i][3] + '\');" href="javascript:void(0)" onclick="insertChar(\'' + charmap[i][1] + '\');" onclick="return false;" onmousedown="return false;" title="' + charmap[i][3] + '">'
				+ charmap[i][1]
				+ '</a></td>';
			if ((cols+1) % charsPerRow == 0)
				html += '</tr><tr height="' + tdHeight + '">';
		}
	 }

	if (cols % charsPerRow > 0) {
		var padd = charsPerRow - (cols % charsPerRow);
		for (var i=0; i<padd-1; i++)
			html += '<td width="' + tdWidth + '" height="' + tdHeight + '" class="charmap">&nbsp;</td>';
	}

	html += '</tr></table>';

	return html;
}

function insertChar(chr) {
	tinyMCEPopup.execCommand('mceInsertContent', false, chr);

	// Refocus in window
	if (tinyMCEPopup.isWindow)
		window.focus();

	tinyMCEPopup.editor.focus();
	tinyMCEPopup.close();
}

function previewChar(codeA, codeB, codeN) {
	var elmA = document.getElementById('codeA');
	var elmB = document.getElementById('codeB');
	var elmV = document.getElementById('codeV');
	var elmN = document.getElementById('codeN');

	if (codeA=='#160;') {
		elmV.innerHTML = '__';
	} else {
		elmV.innerHTML = '&' + codeA;
	}

	elmB.innerHTML = '&amp;' + codeA;
	elmA.innerHTML = '&amp;' + codeB;
	elmN.innerHTML = codeN;
}

function checkstatus_charmap() {
	var a = getCharmapType();
	if (a == 'charmap=charmap_g') {
		return	charmap_greek;
	} else if (a == 'charmap=charmap_l') {
		return charmap_latin;
	} else if (a == 'charmap=charmap_s') {
		return charmap_slavistic;
	}
	return charmap_greek.concat(charmap_latin).concat(charmap_slavistic);
	
	//if (document.getElementById("charmap_g").checked == true) {
	//	return charmap_greek;
	//}
	//else if (document.getElementById("charmap_l").checked == true) {
	//	return charmap_latin;
	//}
	//else {
		//return charmap_greek.concat(charmap_latin);
	//}
}