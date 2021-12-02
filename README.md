Cocos Creator Unpack TextureAtlas Plugin
===

This is a tiny package for unpacking TexturePacker assets in Cocos Creator.

----------------中文优化--------------------

cocos 图集解压工具

开发帮助 [官方api]](https://docs.cocos.com/creator/api/zh/editor/main/editor.html).
## 安装
放入用户目录下 .CocosCreator\packages
或 扩展->创建新扩展 ---程序自动打开一个文件夹，把整个目录移动到该文件夹

### 要求
- Cocos Creator v1.3+
当前仅测试cocos v2.4.3

## 怎么使用
- 在Cocos Creator**资源管理器中**选择一个 **图集资源** . (这个图集资源是 **plist** 文件).
- 选择 **扩展/解压图集** 中 **解压**  .
- 等待加载完成，可以根据日志查找生成文件目录，在工程目录下的temp目录.

## Limitations
- The texture atlas exported by TexturePacker with triangular information could not be extractd successfully.

## License
[MIT](./LICENSE)
