/**
 * plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*global tinymce:true */


tinymce.PluginManager.add('wcecharmap', function(editor) {
   var isArray = tinymce.util.Tools.isArray;
   var charmap_filter_value = "";

   var charmap_greek = [
      ['885', 'GREEK LOWER NUMERAL SIGN'],
   // Greek letters
        ['913', 'Alpha'],
      ['914', 'Beta'],
      ['915', 'Gamma'],
      ['916', 'Delta'],
      ['917', 'Epsilon'],
      ['918', 'Zeta'],
      ['919', 'Eta'],
      ['920', 'Theta'],
      ['921', 'Iota'],
      ['922', 'Kappa'],
      ['923', 'Lambda'],
      ['924', 'Mu'],
      ['925', 'Nu'],
      ['926', 'Xi'],
      ['927', 'Omicron'],
      ['928', 'Pi'],
      ['929', 'Rho'],
      ['931', 'Sigma'],
      ['932', 'Tau'],
      ['933', 'Upsilon'],
      ['934', 'Phi'],
      ['935', 'Chi'],
      ['936', 'Psi'],
      ['937', 'Omega'],
      ['945', 'alpha'],
      ['946', 'beta'],
      ['947', 'gamma'],
      ['948', 'delta'],
      ['949', 'epsilon'],
      ['950', 'zeta'],
      ['951', 'eta'],
      ['952', 'theta'],
      ['953', 'iota'],
      ['954', 'kappa'],
      ['955', 'lambda'],
      ['956', 'mu'],
      ['957', 'nu'],
      ['958', 'xi'],
      ['959', 'omicron'],
      ['960', 'pi'],
      ['961', 'rho'],
      ['962', 'final sigma'],
      ['963', 'sigma'],
      ['964', 'tau'],
      ['965', 'upsilon'],
      ['966', 'phi'],
      ['967', 'chi'],
      ['968', 'psi'],
      ['969', 'omega'],
   // Greek accented letters
      ['902', ''],
      ['903', ''],
      ['904', ''],
      ['905', ''],
      ['906', ''],
   //     ['907', false, ''],
      ['908', ''],
   //	['909', false, ''],
      ['910', ''],
      ['911', ''],
      ['912', ''],
   
   // Greek Extended Block of Unicode
      ['7936', 'alpha with psili'],
      ['7937', 'alpha with dasia'],
      ['7938', 'alpha with psili and varia'],
      ['7939', 'alpha with dasia and varia'],
      ['7940', 'alpha with psili and oxia'],
      ['7941', 'alpha with dasia and oxia'],
      ['7942', 'alpha with psili and perispomeni'],
      ['7943', 'alpha with dasia and perispomeni'],
      ['7944', 'alpha with psili'],
      ['7945', 'alpha with dasia'],
      ['7946', 'alpha with psili and varia'],
      ['7947', 'alpha with dasia and varia'],
      ['7948', 'alpha with psili and oxia'],		
      ['7949', 'alpha with dasia and oxia'],
      ['7950', 'alpha with psili and perispomeni'],
      ['7951', 'alpha with dasia and perispomeni'],
      ['7952', 'epsilon with psili'],
      ['7953', 'epsilon with dasia'],
      ['7954', 'epsilon with psili and varia'],
      ['7955', 'epsilon with dasia and varia'],
      ['7956', 'epsilon with psili and oxia'],
      ['7957', 'epsilon with dasia and oxia'],
      ['7960', 'epsilon with psili'],
      ['7961', 'epsilon with dasia'],
      ['7962', 'epsilon with psili and varia'],
      ['7963', 'epsilon with dasia and varia'],
      ['7964', 'epsilon with psili and oxia'],
      ['7965', 'epsilon with dasia and oxia'],
      ['7968', 'eta with psili'],
      ['7969', 'eta with dasia'],
      ['7970', 'eta with psili and varia'],
      ['7971', 'eta with dasia and varia'],
      ['7972', 'eta with psili and oxia'],
      ['7973', 'eta with dasia and oxia'],
      ['7974', 'eta with psili and perispomeni'],
      ['7975', 'eta with dasia and perispomeni'],
      ['7976', 'eta with psili'],
      ['7977', 'eta with dasia'],
      ['7978', 'eta with psili and varia'],
      ['7979', 'eta with dasia and varia'],
      ['7980', 'eta with psili and oxia'],
      ['7981', 'eta with dasia and oxia'],
      ['7982', 'eta with psili and perispomeni'],
      ['7983', 'eta with dasia and perispomeni'],
      ['7984', 'iota with psili'],
      ['7985', 'iota with dasia'],
      ['7986', 'iota with psili and varia'],
      ['7987', 'iota with dasia and varia'],
      ['7988', 'iota with psili and oxia'],
      ['7989', 'iota with dasia and oxia'],
      ['7990', 'iota with psili and perispomeni'],
      ['7991', 'iota with dasia and perispomeni'],
      ['7992', 'iota with psili'],
      ['7993', 'iota with dasia'],
      ['7994', 'iota with psili and varia'],
      ['7995', 'iota with dasia and varia'],
      ['7996', 'iota with psili and oxia'],
      ['7997', 'iota with dasia and oxia'],
      ['7998', 'iota with psili and perispomeni'],
      ['7999', 'iota with dasia and perispomeni'],
      ['8000', 'omicron with psili'],
      ['8001', 'omicron with dasia'],
      ['8002', 'omicron with psili and varia'],
      ['8003', 'omicron with dasia and varia'],
      ['8004', 'omicron with psili and oxia'],
      ['8005', 'omicron with dasia and oxia'],
      ['8008', 'omicron with psili'],
      ['8009', 'omicron with dasia'],
      ['8010', 'omicron with psili and varia'],
      ['8011', 'omicron with dasia and varia'],
      ['8012', 'omicron with psili and oxia'],
      ['8013', 'omicron with dasia and oxia'],
      ['8016', 'upsilon with psili'],
      ['8017', 'upsilon with dasia'],
      ['8018', 'upsilon with psili and varia'],
      ['8019', 'upsilon with dasia and varia'],
      ['8020', 'upsilon with psili and oxia'],
      ['8021', 'upsilon with dasia and oxia'],
      ['8022', 'upsilon with psili and perispomeni'],
      ['8023', 'upsilon with dasia and perispomeni'],
      ['8025', 'upsilon with dasia'],
      ['8027', 'upsilon with dasia and varia'],
      ['8029', 'upsilon with dasia and oxia'],
      ['8031', 'upsilon with dasia and perispomeni'],
      ['8032', 'omega with psili'],
      ['8033', 'omega with dasia'],
      ['8034', 'omega with psili and varia'],
      ['8035', 'omega with dasia and varia'],
      ['8036', 'omega with psili and oxia'],
      ['8037', 'omega with dasia and oxia'],
      ['8038', 'omega with psili and perispomeni'],
      ['8039', 'omega with dasia and perispomeni'],
      ['8040', 'omega with psili'],
      ['8041', 'omega with dasia'],
      ['8042', 'omega with psili and varia'],
      ['8043', 'omega with dasia and varia'],
      ['8044', 'omega with psili and oxia'],
      ['8045', 'omega with dasia and oxia'],
      ['8046', 'omega with psili and perispomeni'],
      ['8047', 'omega with dasia and perispomeni'],
      ['8048', 'alpha with varia'],
      ['8049', 'alpha with oxia'],
      ['8050', 'epsilon with varia'],
      ['8051', 'epsilon with oxia'],
      ['8052', 'eta with varia'],
      ['8053', 'eta with oxia'],
      ['8054', 'iota with varia'],
      ['8055', 'iota with oxia'],
      ['8056', 'omicron with varia'],
      ['8057', 'omicron with oxia'],
      ['8058', 'upsilon with varia'],
      ['8059', 'upsilon with oxia'],
      ['8060', 'omega with varia'],
      ['8061', 'omega with oxia'],
      ['8064', 'alpha with psili and ypogegrammeni'],
      ['8065', 'alpha with dasia and ypogegrammeni'],
      ['8066', 'alpha with psili and varia and ypogegrammeni'],
      ['8067', 'alpha with dasia and varia and ypogegrammeni'],
      ['8068', 'alpha with psili and oxia and ypogegrammeni'],
      ['8069', 'alpha with dasia and oxia and ypogegrammeni'],
      ['8070', 'alpha with psili and perispomeni and ypogegrammeni'],
      ['8071', 'alpha with dasia and perispomeni and ypogegrammeni'],
      ['8072', 'alpha with psili and prosgegrammeni'],
      ['8073', 'alpha with dasia and prosgegrammeni'],
      ['8074', 'alpha with psili and varia and prosgegrammeni'],
      ['8075', 'alpha with dasia and varia and prosgegrammeni'],
      ['8076', 'alpha with psili and oxia and prosgegrammeni'],
      ['8077', 'alpha with dasia and oxia and prosgegrammeni'],
      ['8078', 'alpha with psili and perispomeni and prosgegrammeni'],
      ['8079', 'alpha with dasia and perispomeni and prosgegrammeni'],
      ['8080', 'eta with psili and ypogegrammeni'],
      ['8081', 'eta with dasia and ypogegrammeni'],
      ['8082', 'eta with psili and varia and ypogegrammeni'],
      ['8083', 'eta with dasia and varia and ypogegrammeni'],
      ['8084', 'eta with psili and oxia and ypogegrammeni'],
      ['8085', 'eta with dasia and oxia and ypogegrammeni'],
      ['8086', 'eta with psili and perispomeni and ypogegrammeni'],
      ['8087', 'eta with dasia and perispomeni and ypogegrammeni'],
      ['8088', 'eta with psili and prosgegrammeni'],
      ['8089', 'eta with dasia and prosgegrammeni'],
      ['8090', 'eta with psili and varia and prosgegrammeni'],
      ['8091', 'eta with dasia and varia and prosgegrammeni'],
      ['8092', 'eta with psili and oxia and prosgegrammeni'],
      ['8093', 'eta with dasia and oxia and prosgegrammeni'],
      ['8094', 'eta with psili and perispomeni and prosgegrammeni'],
      ['8095', 'eta with dasia and perispomeni and prosgegrammeni'],
      ['8096', 'omega with psili and ypogegrammeni'],
      ['8097', 'omega with dasia and ypogegrammeni'],
      ['8098', 'omega with psili and varia and ypogegrammeni'],
      ['8099', 'omega with dasia and varia and ypogegrammeni'],
      ['8100', 'omega with psili and oxia and ypogegrammeni'],
      ['8101', 'omega with dasia and oxia and ypogegrammeni'],
      ['8102', 'omega with psili and perispomeni and ypogegrammeni'],
      ['8103', 'omega with dasia and perispomeni and ypogegrammeni'],
      ['8104', 'omega with psili and prosgegrammeni'],
      ['8105', 'omega with dasia and prosgegrammeni'],
      ['8106', 'omega with psili and varia and prosgegrammeni'],
      ['8107', 'omega with dasia and varia and prosgegrammeni'],
      ['8108', 'omega with psili and oxia and prosgegrammeni'],
      ['8109', 'omega with dasia and oxia and prosgegrammeni'],
      ['8110', 'omega with psili and perispomeni and prosgegrammeni'],
      ['8111', 'omega with dasia and perispomeni and prosgegrammeni'],
      ['8112', 'alpha with vrachy'],
      ['8113', 'alpha with macron'],
      ['8114', 'alpha with varia and ypogegrammeni'],
      ['8115', 'alpha with ypogegrammeni'],
      ['8116', 'alpha with oxia and ypogegrammeni'],
      ['8118', 'alpha with perispomeni'],
      ['8119', 'alpha with perispomeni and ypogegrammeni'],
      ['8120', 'alpha with vrachy'],
      ['8121', 'alpha with macron'],
      ['8122', 'alpha with varia'],
      ['8123', 'alpha with oxia'],
      ['8124', 'alpha with prosgegrammeni'],
      ['8125', 'greek koronis'],
      ['8126', 'greek prosgegrammeni'],
      ['8127', 'greek psili'],
      ['8128', 'greek perispomeni'],
      ['8129', 'greek dialytika and perispomeni'],
      ['8130', 'eta with varia and ypogegrammeni'],
      ['8131', 'eta with ypogegrammeni'],
      ['8132', 'eta with oxia and ypogegrammeni'],
      ['8134', 'eta with perispomeni'],
      ['8135', 'eta with perispomeni and ypogegrammeni'],
      ['8136', 'epsilon with varia'],
      ['8137', 'epsilon with oxia'],
      ['8138', 'eta with varia'],
      ['8139', 'eta with oxia'],
      ['8140', 'eta with prosgegrammeni'],
      ['8141', 'greek psili and varia'],
      ['8142', 'greek psili and oxia'],
      ['8143', 'greek psili and perispomeni'],
      ['8144', 'iota with vrachy'],
      ['8145', 'iota with macron'],
      ['8146', 'iota with dialytika and varia'],
      ['8147', 'iota with dialytika and oxia'],
      ['8150', 'iota with perispomeni'],
      ['8151', 'iota with dialytika and perispomeni'],
      ['8152', 'iota with vrachy'],
      ['8153', 'iota with macron'],
      ['8154', 'iota with varia'],
      ['8155', 'iota with oxia'],
      ['8157', 'dasia and varia'],
      ['8158', 'dasia and oxia'],
      ['8159', 'dasia and perispomeni'],
      ['8160', 'upsilon with vrachy'],
      ['8161', 'upsilon with macron'],
      ['8162', 'upsilon with dialytika and varia'],
      ['8163', 'upsilon with dialytika and oxia'],
      ['8164', 'rho with psili'],
      ['8165', 'rho with dasia'],
      ['8166', 'upsilon with perispomeni'],
      ['8167', 'upsilon with dialytika and perispomeni'],
      ['8168', 'upsilon with vrachy'],
      ['8169', 'upsilon with macron'],
      ['8170', 'upsilon with varia'],
      ['8171', 'upsilon with oxia'],
      ['8172', 'rho with dasia'],
      ['8173', 'dialytika and varia'],
      ['8174', 'dialytika and oxia'],
      ['8175', 'varia'],
      ['8178', 'omega with varia and ypogegrammeni'],
      ['8179', 'omega with ypogegrammeni'],
      ['8180', 'omega with oxia and ypogegrammeni'],
      ['8182', 'omega with perispomeni'],
      ['8183', 'omega with perispomeni and ypogegrammeni'],
      ['8184', 'omicron with varia'],
      ['8185', 'omicron with oxia'],
      ['8186', 'omega with varia'],
      ['8187', 'omega with oxia'],
      ['8188', 'omega with prosgegrammeni'],
      ['8189', 'oxia'],
      ['8190', 'dasia'],
      // WCE Greek
      ['976', 'beta symbol'],
      ['977', 'theta symbol'],
      ['978', 'upsilon - hook symbol'],
      ['981', 'phi symbol'],
      ['982', 'pi symbol'],
      ['983', 'kai symbol'],
      ['984', 'Archaic Koppa'],
      ['985', 'Archaic koppa'],
      ['986', 'Stigma'],
      ['987', 'stigma'],
      
      ['988', 'Digamma'],
      ['989', 'digamma'],
      ['993', 'sampi'],
      ['992', 'Sampi'],
      ['1015', 'Scho'],
      ['1016', 'scho'],
      ['990', 'koppa'],
      ['991', 'Koppa'],
   ];
   
   var charmap_latin = [
   // alphabetical special chars
      ['192', 'A - grave'],
      ['193', 'A - acute'],
      ['194', 'A - circumflex'],
      ['195', 'A - tilde'],
      ['196', 'A - diaeresis'],
      ['197', 'A - ring above'],
      ['198', 'ligature AE'],
      ['199', 'C - cedilla'],
      ['200', 'E - grave'],
      ['201', 'E - acute'],
      ['202', 'E - circumflex'],
      ['203', 'E - diaeresis'],
      ['204', 'I - grave'],
      ['205', 'I - acute'],
      ['206', 'I - circumflex'],
      ['207', 'I - diaeresis'],
      ['208', 'ETH'],
      ['209', 'N - tilde'],
      ['210', 'O - grave'],
      ['211', 'O - acute'],
      ['212', 'O - circumflex'],
      ['213', 'O - tilde'],
      ['214', 'O - diaeresis'],
      ['216', 'O - slash'],
      ['338', 'ligature OE'],
      ['352', 'S - caron'],
      ['217', 'U - grave'],
      ['218', 'U - acute'],
      ['219', 'U - circumflex'],
      ['220', 'U - diaeresis'],
      ['221', 'Y - acute'],
      ['376', 'Y - diaeresis'],
      ['222', 'THORN'],
      ['224', 'a - grave'],
      ['225', 'a - acute'],
      ['226', 'a - circumflex'],
      ['227', 'a - tilde'],
      ['228', 'a - diaeresis'],
      ['229', 'a - ring above'],
      ['230', 'ligature ae'],
      ['231', 'c - cedilla'],
      ['232', 'e - grave'],
      ['233', 'e - acute'],
      ['234', 'e - circumflex'],
      ['235', 'e - diaeresis'],
      ['236', 'i - grave'],
      ['237', 'i - acute'],
      ['238', 'i - circumflex'],
      ['239', 'i - diaeresis'],
      ['240', 'eth'],
      ['241', 'n - tilde'],
      ['242', 'o - grave'],
      ['243', 'o - acute'],
      ['244', 'o - circumflex'],
      ['245', 'o - tilde'],
      ['246', 'o - diaeresis'],
      ['248', 'o slash'],
      ['339', 'ligature oe'],
      ['353', 's - caron'],
      ['249', 'u - grave'],
      ['250', 'u - acute'],
      ['251', 'u - circumflex'],
      ['252', 'u - diaeresis'],
      ['253', 'y - acute'],
      ['254', 'thorn'],
      ['255', 'y - diaeresis'],
   // WCE Abbreviations	
      ['281', 'e with caudata'],
      ['247', 'Abbreviation est'],
      ['405', 'Abbreviation autem'],
      ['10746', 'Abbreviation enim'],
      ['601', 'Abbreviation eius'],
      ['38', 'Abbreviation et'],
      ['8266', 'Abbreviation et7'],
      ['182', 'Paragraph'],
   //	['173',  false, 'soft hyphen'],
   //	['173',  false, 'soft hyphen'],
      ['59', 'Semicolon'],
      ['865', 'Slur']
   ];
   
   var charmap_slavic = [
      ['1030', ''],
      ['1031', ''],
      ['1066', ''],
      ['1067', ''],
      ['1068', ''],
      ['1070', ''],
      ['1098', ''],
      ['1099', ''],
      ['1100', ''],
      ['1102', ''],
      ['1120', ''],
      ['1121', ''],
      ['1122', ''],
      ['1123', ''],
      ['1124', ''],
      ['1125', ''],
      ['1126', ''],
      ['1127', ''],
      ['1128', ''],
      ['1129', ''],
      ['1130', ''],
      ['1131', ''],
      ['1132', ''],
      ['1133', ''],
      ['1134', ''],
      ['1135', ''],
      ['1136', ''],
      ['1137', ''],
      ['1138', ''],
      ['1139', ''],
      ['1140', ''],
      ['1141', ''],
      ['1142', ''],
      ['1143', ''],
      ['1144', ''],
      ['1145', ''],
      ['1146', ''],
      ['1147', ''],
      ['1148', ''],
      ['1149', ''],
      ['1150', ''],
      ['1151', ''],
      ['1152', ''],
      ['1153', ''],
      ['1154', ''],
      ['1155', ''],
      ['1156', ''],
      ['1157', ''],
      ['1158', ''],
      ['1159', ''],
      ['1160', ''],
      ['1161', ''],
      ['1162', ''],
      ['1163', ''],
      ['1164', ''],
      ['1165', ''],
      ['1166', ''],
   
      ['1248', ''],
      ['1249', ''],
      ['779', ''],
   ];

   var charmap_coptic = [
      ['65060', 'Combining Macron Left Half'],
      ['65062', 'Combining Conjoining Macron'],
      ['65061', 'Combining Macron Right Half'],
      ['772', 'Combining Macron'],
      ['776', 'Combining diaeresis'],
      ['11503', 'Combining ni above'],
      ['11403', 'The stigma (sou)']
   ];
   

   function charmapFilter(charmap) {
      return tinymce.util.Tools.grep(charmap, function(item) {
         return isArray(item) && item.length == 2;
      });
   }

   function getCharsFromSetting(settingValue) {
      if (isArray(settingValue)) {
         return [].concat(charmapFilter(settingValue));
      }

      if (typeof settingValue == "function") {
         return settingValue();
      }

      return [];
   }

   function extendCharMap(charmap) {
      var settings = editor.settings;

      if (settings.charmap) {
         charmap = getCharsFromSetting(settings.charmap);
      }

      if (settings.charmap_append) {
         return [].concat(charmap).concat(getCharsFromSetting(settings.charmap_append));
      }

      return charmap;
   }

   function insertChar(chr, chrindex, charmapname) {
      editor.fire('insertCustomChar', {
         chr: chr
      }).chr;
      editor.execCommand('mceInsertContent', false, chr);
   }

   function getGridHtml(charmap) {
      var gridHtml = '<table role="presentation" cellspacing="0" class="mce-charmap"><tbody>';
      charmap = charmap ? charmap : getCharMap();
      var width = Math.min(charmap.length, 25);
      var height = Math.ceil(charmap.length / width);
      for (y = 0; y < height; y++) {
         gridHtml += '<tr>';

         for (x = 0; x < width; x++) {
            var index = y * width + x;
            if (index < charmap.length) {
               var chr = charmap[index];
               gridHtml += '<td title="' + chr[1] + '"><div tabindex="' + index + '" title="' + chr[1] + '" role="button">' +
                  (chr ? parseSomeInt(chr[0]) : '&nbsp;') + '</div></td>';
            } else {
               gridHtml += '<td />';
            }
         }

         gridHtml += '</tr>';
      }

      gridHtml += '</tbody></table>';
      return gridHtml;
   }

   function getCharMap() {
      let charmap = [];
      let selectedLanguages = [];
      let checkboxes = document.getElementsByName('charmap_filter');
      for (let i = 0; i < checkboxes.length; i += 1) {
         if (checkboxes[i].checked) {
            selectedLanguages.push(checkboxes[i].value);
         }
      }
      if (selectedLanguages.indexOf('greek') !== -1 || selectedLanguages.length == 0) {
         charmap = charmap.concat(charmap_greek);
      }
      if (selectedLanguages.indexOf('latin') !== -1 || selectedLanguages.length == 0) {
         charmap = charmap.concat(charmap_latin);
      }
      if (selectedLanguages.indexOf('slavic') !== -1 || selectedLanguages.length == 0) {
         charmap = charmap.concat(charmap_slavic);
      }
      if (selectedLanguages.indexOf('coptic') !== -1 || selectedLanguages.length == 0) {
         charmap = charmap.concat(charmap_coptic);
      }
      return extendCharMap(charmap);
   }

   function showDialog(charmap, charmap_filter_value) {
      var gridHtml, x, y, win;

      function getParentTd(elm) {
         while (elm) {
            if (elm.nodeName == 'TD') {
               return elm;
            }

            elm = elm.parentNode;
         }
      }

      charmap_filter_value = charmap_filter_value ? charmap_filter_value : 'All_glyphs';
      gridHtml = '<div class="mce-charmap-wrapper">' + getGridHtml(charmap) + '</div>';

      var checkboxGroup = [{
            id: 'charmap_greek',
            value: 'greek',
            i18n: 'charmap_greek',
            charmap: getCharMap
         }, {
            id: 'charmap_latin',
            value: 'latin',
            i18n: 'charmap_latin',
            charmap: getCharMap
         }, {
            id: 'charmap_slavic',
            value: 'slavic',
            i18n: 'charmap_slavic',
            charmap: getCharMap
         }, {
            id: 'charmap_coptic',
            value: 'coptic',
            i18n: 'charmap_coptic',
            charmap: getCharMap
         }
      ];

      var checkboxHtml = '<div style="padding:10px">';
      var translate = tinymce.util.I18n.translate;
      checkboxGroup.forEach(function(r, i) {
         checkboxHtml += '<div><input type="checkbox" id="' + r.id + '"';
         checkboxHtml += ' checked="checked"';
         checkboxHtml += ' name="charmap_filter" value="' + r.value + '" /> ';
         checkboxHtml += '<label style="margin-right:2px">' + translate(r.i18n) + '</label></div>';
      });

      var charMapPanel = {
         type: 'container',
         html: gridHtml,
         onclick: function(e) {
            var target = e.target;

            if (/^(TD|DIV)$/.test(target.nodeName)) {
               if (getParentTd(target) && getParentTd(target).firstChild) {
                  insertChar(tinymce.trim(target.innerText || target.textContent),
                     target.getAttribute("tabindex"), charmap_filter_value);
                  if (!e.ctrlKey) {
                     win.close();
                  }
               }
            }
         },
         onmouseover: function(e) {
            var td = getParentTd(e.target);
            if (td && td.firstChild) {
               win.find('#preview').text(td.firstChild.firstChild.data);
               win.find('#previewTitle').text(td.title);
            } else {
               win.find('#preview').text(' ');
               win.find('#previewTitle').text(' ');
            }
         }
      };

      win = editor.windowManager.open({
         title: "Special characters",
         spacing: 10,
         padding: 10,
         items: [
            charMapPanel,
            {
               type: 'container',
               layout: 'flex',
               direction: 'column',
               align: 'center',
               spacing: 5,
               minWidth: 300,
               minHeight: 400,
               items: [{
                     type: 'label',
                     name: 'preview',
                     text: ' ',
                     style: 'font-size: 72px; text-align: center',
                     border: 1,
                     minWidth: 300,
                     minHeight: 120
                  },
                  {
                     type: 'label',
                     name: 'previewTitle',
                     text: ' ',
                     style: 'text-align: center',
                     border: 1,
                     minWidth: 300,
                     minHeight: 80
                  }, {
                     type: 'container',
                     layout: 'flex',
                     direction: 'column',
                     html: checkboxHtml,
                     minWidth: 300,
                     minHeight: 200,
                     onclick: function(e) {
                        var target = e.target;
                        if (target.nodeName && target.nodeName.toLocaleLowerCase() == 'input') {
                           var filterValue = target.value;

                           var radioInput = checkboxGroup.find(function(r) {
                              if (r.value == filterValue) {
                                 return true;
                              }
                           });
                           var newGridHtml = getGridHtml(radioInput.charmap());
                           win.$el.find('div[class="mce-charmap-wrapper"]').html(newGridHtml);
                        }
                     }
                  }
               ]
            }
         ],
         buttons: [],
         resizable : 'yes'
      });
   }

   editor.addCommand('mceShowWceCharmap', showDialog);

   editor.addButton('wcecharmap', {
      icon: 'charmap',
      tooltip: 'WCE special character map',
      cmd: 'mceShowWceCharmap'
   });

   editor.addMenuItem('wcecharmap', {
      icon: 'charmap',
      text: 'Special characters',
      cmd: 'mceShowWceCharmap',
      context: 'insert'
   });

   function parseSomeInt(charcodes) {
      var str = charcodes.split('+');
      var out = '';
      for (i = 0; i < str.length; i++) {
         if (isNaN(parseFloat(str[i]))) {
            out += str[i];
         } else {
            out += String.fromCodePoint(parseInt(str[i]));
         }
      }
      return out;
   }
   
   return {
      getCharMap: getCharMap,
      insertChar: insertChar
   };
});
