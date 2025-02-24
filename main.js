/****************************************************************************
Copyright (c) 2016-2017 zilongshanren

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
****************************************************************************/

'use strict';
const Fs = require('fire-fs');
const Path = require('fire-path');
const Async = require('async');
const Del = require('del');

let sharpPath;
if (Editor.dev) {
  sharpPath = 'sharp';
} else {
  sharpPath = Editor.url('unpack://utils/sharp');
}
const Sharp = require(sharpPath);

const dontSelectCorrectAssetMsg = {
  type: 'warning',
  buttons: ['确定'],
  titile: '解压图集',
  message: '请选择一个图集文件!',
  defaultId: 0,
  noLink: true
};

module.exports = {
  load() {
    // execute when package loaded
  },

  unload() {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'unpack'() {
      Editor.Metrics.trackEvent({
        category: 'Packages',
        label: '解压图集',
        action: 'Open By Menu'
      }, null);

      let currentSelection = Editor.Selection.curSelection('asset');
      if (currentSelection.length > 0) {
        let selectionUUid = currentSelection[0];
        let selectionMeta = Editor.assetdb.loadMetaByUuid(selectionUUid);
        let selectionUrl = Editor.assetdb.uuidToUrl(selectionUUid);
        let assetInfo = Editor.assetdb.assetInfoByUuid(selectionUUid);
        const textureAtlasPath = Editor.assetdb.uuidToFspath(selectionMeta.rawTextureUuid);


        if (!textureAtlasPath) {
          Editor.Dialog.messageBox(dontSelectCorrectAssetMsg);
          return;
        }
        let textureAtlasSubMetas = selectionMeta.getSubMetas();

        if (assetInfo.type === 'sprite-atlas'
          && selectionMeta.type === 'Texture Packer'
          && textureAtlasSubMetas) {

          // In Creator Editor version 2.2.2,use Editor.Project.path 
          let extractedImageSaveFolder = Path.join(Editor.Project.path, 'temp', Path.basenameNoExt(textureAtlasPath) + '_unpack');
          Fs.mkdirsSync(extractedImageSaveFolder);
          Editor.log('保存位置: ' + extractedImageSaveFolder);
          let spriteFrameNames = Object.keys(textureAtlasSubMetas);
          Async.forEach(spriteFrameNames, function (spriteFrameName, next) {
            let spriteFrameObj = textureAtlasSubMetas[spriteFrameName];
            let isRotated = spriteFrameObj.rotated;
            let originalSize = cc.size(spriteFrameObj.rawWidth, spriteFrameObj.rawHeight);
            let rect = cc.rect(spriteFrameObj.trimX, spriteFrameObj.trimY, spriteFrameObj.width, spriteFrameObj.height);
            let offset = { x: spriteFrameObj.offsetX, y: spriteFrameObj.offsetY };
            //offset=cc.p(spriteFrameObj.offsetX, spriteFrameObj.offsetY);
            let trimmedLeft = Math.ceil(offset.x + (originalSize.width - rect.width) / 2);
            let trimmedRight = Math.ceil((originalSize.width - rect.width) / 2 - offset.x);
            let trimmedTop = Math.ceil((originalSize.height - rect.height) / 2 - offset.y);
            let trimmedBottom = Math.ceil(offset.y + (originalSize.height - rect.height) / 2);
            let sharpCallback = (err) => {
              if (err) {
                Editor.log('操作 ' + spriteFrameName + ' 出错, 详情:' + err);
              }
              Editor.log(spriteFrameName + ' 成功!');
              next();
            };

            let extractedSmallPngSavePath = Path.join(extractedImageSaveFolder, spriteFrameName);
            if (isRotated) {
              Sharp(textureAtlasPath).extract({ left: rect.x, top: rect.y, width: rect.height, height: rect.width })
                // .background('rgba(0,0,0,0)') 
                .extend({ top: trimmedTop, bottom: trimmedBottom, left: trimmedLeft, right: trimmedRight })
                .rotate(270)
                .toFile(extractedSmallPngSavePath, sharpCallback);

            } else {
              Sharp(textureAtlasPath).extract({ left: rect.x, top: rect.y, width: rect.width, height: rect.height })
                // .background('rgba(0,0,0,0)') -- In Creator Editor version 2.2.2,background is undefined
                .extend({ top: trimmedTop, bottom: trimmedBottom, left: trimmedLeft, right: trimmedRight })
                .rotate(0)
                .toFile(extractedSmallPngSavePath, sharpCallback);
            }
          }, () => {
            Editor.log(`解压 ${spriteFrameNames.length} 个资源完成!`);
            //这里移动资源到工程文件夹内,然而我并不想移动。
            // //start importing the generated textures folder
            // Editor.Ipc.sendToMain('asset-db:import-assets', [extractedImageSaveFolder], Path.dirname(selectionUrl), true, (err) => {
            //   if (err) Editor.log('移动资源出错:' + err);

            //   Del(extractedImageSaveFolder, { force: true });
            // }, -1);
          }); // end of Async.forEach

        } else {
          Editor.Dialog.messageBox(dontSelectCorrectAssetMsg);
        }
      } else {
        Editor.Dialog.messageBox(dontSelectCorrectAssetMsg);
      }
    },
  },
};
