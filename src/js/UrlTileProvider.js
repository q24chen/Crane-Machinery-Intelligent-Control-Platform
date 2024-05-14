import { MapProvider } from "geo-three";

export default class UrlTileProvider extends MapProvider {
    constructor(options) {
        super();
        this.path=options.url;
        this.minZoom=options.minZoom;
        this.maxZoom=options.maxZoom;
    }
    setUrl(url){
        this.path=url;
    }
    fetchTile(zoom, x, y) {
        return new Promise((resolve, reject) => {
            const image = document.createElement('img');
            image.onload = function () {
                resolve(image);
            };
            image.onerror = function (e) {
                reject(e);
            };
            image.crossOrigin = 'Anonymous';
            image.src =this.path.replace('{z}',zoom).replace('{x}',x).replace('{y}',y);
        });
    }
}
