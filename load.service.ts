import { AssetLibrary, loader } from "cc";

const uuidBasePaths = {}

const getLibUrlNoExt = AssetLibrary.getLibUrlNoExt;
AssetLibrary.getLibUrlNoExt = (uuid: any, inRawAssetsDir?: boolean | undefined): string => {
    let libUrl = getLibUrlNoExt.call(AssetLibrary, uuid, inRawAssetsDir);
    let basePath = uuidBasePaths[uuid];
    if (basePath) {
        libUrl = basePath + libUrl;
    }
    return libUrl;
}

const assets = [
    {
        'name': '',
        'path': ''
    },
    {
        'name': 'model',
        'path': 'http://x.x.x.x/model/'
    }
]

class LoadService {

    static loadSettings(settings: any, name: string, subGameRootPath: string, callback: Function) {
        const key = subGameRootPath + 'src/settings.js';
        loader.release(key);
        loader.load(key, (err: any) => {
            if (err) return callback(err);
            const ccSettings = window._CCSettings;
            window._CCSettings = undefined;
            if (!ccSettings) return callback('setting load error');

            var uuids = ccSettings.uuids;
            var rawAssets = ccSettings.rawAssets;
            var assetTypes = ccSettings.assetTypes;
            var realRawAssets = ccSettings.rawAssets = {};
            for (var mount in rawAssets) {
                var entries = rawAssets[mount];
                var realEntries = realRawAssets[mount] = {};
                for (var id in entries) {
                    var entry = entries[id];
                    var type = entry[1];
                    // retrieve minified raw asset
                    if (typeof type === 'number') {
                        entry[1] = assetTypes[type];
                    }
                    // retrieve uuid
                    realEntries[uuids[id] || id] = entry;
                    // 根据name判定是否是远程加载的文件，如果是的话，记录远程路径
                    if (name) uuidBasePaths[uuids[id] || id] = subGameRootPath;
                }
                // 合并数组
                settings.rawAssets[mount] = {...settings.rawAssets[mount], ...realEntries}
            }

            var packedAssets = ccSettings.packedAssets;
            for (var packId in packedAssets) {
                var packedIds = packedAssets[packId];
                for (var j = 0; j < packedIds.length; ++j) {
                    if (typeof packedIds[j] === 'number') {
                        packedIds[j] = uuids[packedIds[j]];
                    }
                }
                // 根据name判定是否是远程加载的文件，如果是的话，记录远程路径
                if (name) uuidBasePaths[packId] = subGameRootPath;
            }
            // 合并数组
            settings.packedAssets = {...settings.packedAssets, ...packedAssets}
            callback();
        })
    }

    static loadCustomAsset() {
        const settings = {
            rawAssets: {},
            packedAssets: {}
        }

        const doLoad = (assetIndex = 0) => {
            let asset = assets[assetIndex];
            if (!asset) {   // 如果已经读完最后一个
                cc.AssetLibrary.init({
                    libraryPath: `res/import`,
                    rawAssetsBase: `res/raw-`,
                    rawAssets: settings.rawAssets,
                    packedAssets: settings.packedAssets
                })
            }
            assetIndex++;
            // 加载settings.js文件
            this.loadSettings(settings, asset.name, asset.path, doLoad.bind(this, assetIndex));
        }
        doLoad();
    }
}


export default LoadService;
